export interface ApiErrorDetails {
  title?: string;
  detail?: string;
  details?: string[];
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  meta: Record<string, unknown> | null;
  error: ApiErrorDetails | null;
}
