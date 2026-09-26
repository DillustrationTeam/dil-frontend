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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<AuthResponseDto>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        if (refreshResponse.data.data) {
          const newAuthData = refreshResponse.data.data;
          useAuthStore.getState().setAuth(newAuthData);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAuthData.tokens.accessToken}`;
          }

          processQueue(null);
          return apiClient(originalRequest);
        } else {
          useAuthStore.getState().clearAuth();
          processQueue(error);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        useAuthStore.getState().clearAuth();
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

      // Case 3: `data.error.details` / `data.error.title`
      if (data.error) {
        if (Array.isArray(data.error.details) && data.error.details.length > 0) {
          return data.error.details.join(' · ');
        }
        if (typeof data.error.title === 'string' && data.error.title) {
          return data.error.title;
        }
        if (typeof data.error.message === 'string' && data.error.message) {
          return data.error.message;
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

    // Case 5: Error.message (nếu không phải dạng generic 'Request failed with status code...')
    const msg = (error as { message?: string }).message;
    if (msg && !msg.startsWith('Request failed with status code')) {
      return msg;
    }
  }

  return fallbackMessage;
}
