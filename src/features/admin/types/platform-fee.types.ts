// ==========================================
// SCREEN 18 (SCR-18 / UC33): PLATFORM FEE & POLICY CONFIGURATION
// ==========================================

export interface PlatformFeePolicyDto {
  /** Tỷ lệ phần trăm phí hoa hồng sàn (5.0% - 15.0%, mặc định 10.0%) */
  platformFeePercent: number;

  /** Thời gian tự động duyệt cột mốc (ngày, mặc định 7 ngày theo BR-37) */
  milestoneAutoApprovalDays: number;

  /** Giới hạn số lần yêu cầu chỉnh sửa miễn phí mặc định (mặc định 2) */
  defaultFreeRevisionLimit: number;

  /** Thời gian hết hạn của AWS S3 / Cloudinary Presigned URL (phút, mặc định 15 phút theo BR-39) */
  presignedUrlExpirationMinutes: number;

  /** Thời điểm cập nhật cấu hình lần cuối */
  updatedAt?: string | null;
}

export interface UpdatePlatformFeePolicyRequest {
  /** Tỷ lệ phần trăm phí hoa hồng sàn (5.0% - 15.0%) */
  platformFeePercent: number;

  /** Thời gian tự động duyệt cột mốc (ngày, 1 - 30 ngày) */
  milestoneAutoApprovalDays: number;

  /** Số lần yêu cầu chỉnh sửa miễn phí mặc định (0 - 20 lần) */
  defaultFreeRevisionLimit: number;

  /** Thời gian hết hạn của AWS S3 / Cloudinary Presigned URL (phút, 5 - 1440 phút) */
  presignedUrlExpirationMinutes: number;
}

export const DEFAULT_PLATFORM_FEE_POLICY: UpdatePlatformFeePolicyRequest = {
  platformFeePercent: 10.0,
  milestoneAutoApprovalDays: 7,
  defaultFreeRevisionLimit: 2,
  presignedUrlExpirationMinutes: 15,
};
