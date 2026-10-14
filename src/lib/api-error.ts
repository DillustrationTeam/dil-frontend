import axios from 'axios';
import { ApiResponse } from '@/types/api.types';

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

export const getApiErrorMessage = getErrorMessage;
