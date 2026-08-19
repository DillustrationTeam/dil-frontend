export interface ApiErrorDetails {
  title?: string;
  details?: string[];
}

export interface ApiResponse<T = any> {
  data: T | null;
  meta: Record<string, any> | null;
  error: ApiErrorDetails | null;
}
