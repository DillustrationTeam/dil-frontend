import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/use-auth-store';
import { ApiResponse } from '@/types/api.types';
import { AuthResponseDto } from '@/types/auth.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5075/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh Token Rotation on 401 Unauthorized
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().clearAuth();
    return null;
  }

  try {
    const refreshResponse = await axios.post<ApiResponse<AuthResponseDto>>(
      `${API_BASE_URL}/auth/refresh-token`,
      { refreshToken }
    );

    if (refreshResponse.data.data) {
      const newAuthData = refreshResponse.data.data;
      useAuthStore.getState().setAuth(newAuthData);
      return newAuthData.tokens.accessToken;
    }

    useAuthStore.getState().clearAuth();
    return null;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token, dedupe các lệnh gọi đồng thời thành MỘT request.
 *
 * Dùng chung cho axios interceptor (401) và `accessTokenFactory` của SignalR
 * (xem `ensureFreshAccessToken`) — refresh token xoay vòng mỗi lần dùng
 * (`docs/04-api-conventions.md`), nên hai lệnh refresh song song sẽ khiến một
 * bên dùng lại token đã bị thu hồi và revoke luôn cả chuỗi token.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = typeof window !== 'undefined'
      ? window.atob(padded)
      : Buffer.from(padded, 'base64').toString('utf-8');
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

const TOKEN_REFRESH_SKEW_MS = 15_000;

/**
 * Access token còn hiệu lực cho SignalR, tự refresh trước nếu đã/sắp hết hạn.
 *
 * SignalR gọi `accessTokenFactory` trước MỖI lần negotiate/reconnect — kể cả
 * khi tab đứng yên không gọi REST API nào suốt 15 phút (thời hạn access
 * token). Trả thẳng token đang nằm trong store (như trước) khiến negotiate
 * luôn fail 401 "Lifetime validation failed" sau một khoảng không hoạt động
 * dài. Dùng chung `refreshAccessToken()` ở trên để tránh đua với interceptor.
 */
export async function ensureFreshAccessToken(): Promise<string> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return '';

  const expiresAtMs = decodeJwtExpiryMs(accessToken);
  if (expiresAtMs === null || expiresAtMs - Date.now() > TOKEN_REFRESH_SKEW_MS) {
    return accessToken;
  }

  const refreshed = await refreshAccessToken();
  return refreshed ?? '';
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Kiểm tra xem 401 có phải do tài khoản bị đình chỉ / khóa / vô hiệu hóa không
      const errorData = error.response?.data as ApiResponse | undefined;
      const errorDetail = errorData?.error?.detail ?? '';
      const isSanctionedOrBanned =
        typeof errorDetail === 'string' &&
        (errorDetail.includes('đình chỉ') ||
          errorDetail.includes('khóa vĩnh viễn') ||
          errorDetail.includes('vô hiệu hóa') ||
          errorDetail.includes('Tài khoản không tồn tại'));

      if (isSanctionedOrBanned) {
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          import('react-hot-toast')
            .then(({ default: toast }) => {
              toast.error(errorDetail, { duration: 6000 });
            })
            .catch(() => {});
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null);
          return apiClient(originalRequest);
        } else {
          processQueue(error);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Trích xuất câu thông báo lỗi chi tiết từ response của Backend ASP.NET Core
 * (ProblemDetails, ValidationProblemDetails, hoặc custom Result/ApiResponse object).
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại.'): string {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') return error;

  if (typeof error === 'object' && error !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (error as { response?: { data?: any; status?: number; statusText?: string } }).response;
    if (res?.data) {
      const data = res.data;

      // Case 1: Custom Result wrapper `data.errors: string[]`
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.map((e: unknown) => (typeof e === 'string' ? e : JSON.stringify(e))).join(' · ');
      }

      // Case 2: ValidationProblemDetails `data.errors: Record<string, string[]>`
      if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
        const errorList: string[] = [];
        for (const key of Object.keys(data.errors)) {
          const val = data.errors[key];
          if (Array.isArray(val)) {
            errorList.push(...val);
          } else if (typeof val === 'string') {
            errorList.push(val);
          }
        }
        if (errorList.length > 0) return errorList.join(' · ');
      }

      // Case 3: `data.error.detail` / `data.error.details` / `data.error.title`
      if (data.error) {
        if (typeof data.error.detail === 'string' && data.error.detail.trim()) {
          return data.error.detail;
        }
        if (Array.isArray(data.error.details) && data.error.details.length > 0) {
          return data.error.details.join(' · ');
        }
        if (typeof data.error.message === 'string' && data.error.message) {
          return data.error.message;
        }
        if (typeof data.error.title === 'string' && data.error.title && data.error.title !== 'Unauthorized') {
          return data.error.title;
        }
      }

      // Case 4: `data.message` hoặc `data.detail` hoặc `data.title`
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }
      if (typeof data.title === 'string' && data.title.trim() && data.title !== 'One or more validation errors occurred.') {
        return data.title;
      }
    }

    if (res?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
    }
    if (res?.status === 403) {
      return 'Tài khoản của bạn không có quyền thực hiện thao tác này.';
    }
    if (res?.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu (404).';
    }
    if (res?.status === 500) {
      return 'Máy chủ xảy ra lỗi (500). Vui lòng thử lại sau.';
    }

    // Case 5: Error.message (nếu không phải dạng generic 'Request failed with status code...')
    const msg = (error as { message?: string }).message;
    if (msg && !msg.startsWith('Request failed with status code')) {
      return msg;
    }
  }

  return fallbackMessage;
}
