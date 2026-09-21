import { AxiosError } from 'axios';
import { ApiErrorDetails } from '@/types/api.types';

/**
 * Axios throw ngay khi HTTP status không phải 2xx — nên message lỗi thật (backend gửi trong
 * body { error: { detail, errors } }) nằm trong err.response.data, không phải err.message
 * (err.message chỉ là chuỗi chung chung kiểu "Request failed with status code 400").
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosError = err as AxiosError<{ error?: ApiErrorDetails }>;
  const apiError = axiosError.response?.data?.error;

  if (apiError?.errors) {
    const fieldMessages = Object.values(apiError.errors).flat();
    if (fieldMessages.length > 0) {
      return fieldMessages.join(' ');
    }
  }

  if (apiError?.detail) {
    return apiError.detail;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}
