export interface ApiErrorDetails {
  type?: string;
  title?: string;
  status?: number;
  /** Thông điệp lỗi chính — khớp field `detail` (số ít) mà backend thật sự trả về. */
  detail?: string;
  /** @deprecated Backend không trả field này — giữ lại vì code cũ (auth/creator-profile/marketplace service) đang tham chiếu. Dùng `detail` cho code mới. */
  details?: string[];
  traceId?: string;
  /** Chỉ có khi lỗi đến từ ASP.NET Core model validation tự động (không phải validation trong MediatR handler). */
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  meta: Record<string, unknown> | null;
  error: ApiErrorDetails | null;
}
