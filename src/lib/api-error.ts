import axios from 'axios';
import { ApiErrorDetails, ApiResponse } from '@/types/api.types';

/**
 * Axios throw ngay khi HTTP status không phải 2xx — nên message lỗi thật (backend gửi trong
 * body { error: { detail, errors } }) nằm trong err.response.data, không phải err.message
 * (err.message chỉ là chuỗi chung chung kiểu "Request failed with status code 400").
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as {
      error?: ApiErrorDetails & { details?: string[] | string };
      message?: string;
    } | undefined;
    const apiError = data?.error;

    if (apiError?.errors) {
      const fieldMessages = Object.values(apiError.errors).flat();
      if (fieldMessages.length > 0) {
        return fieldMessages.join(' ');
      }
    }

    if (apiError?.detail) {
      return apiError.detail;
    }

    if (Array.isArray(apiError?.details) && apiError.details.length > 0) {
      return apiError.details.join(' ');
    }

    if (typeof apiError?.details === 'string' && apiError.details.trim()) {
      return apiError.details;
    }

    if (data?.message) {
      return data.message;
    }

    if (apiError?.title && apiError.title !== 'Bad Request') {
      return apiError.title;
    }
  }

  if (err instanceof Error && err.message && !err.message.includes('status code')) {
    return err.message;
  }

  return fallback;
}

/**
 * @deprecated Đọc field `error.details`/`error.title` mà backend không thực sự trả (xem
 * `ApiErrorDetails.details`) nên luôn rơi về fallback/err.message thay vì lý do lỗi thật.
 * Dùng `getApiErrorMessage` cho code mới. Giữ lại vì các hook trong `features/admin/hooks`
 * đang import hàm này — cần migrate riêng, không sửa trong lúc resolve merge conflict.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiResponse | undefined;
    return (
      apiError?.error?.details?.join(', ') ||
      apiError?.error?.title ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
