export type ApplicationStatusName = 'Pending' | 'Approved' | 'Rejected' | 'AdditionalProofRequested';

export interface CreatorApplicationDto {
  id: string;
  applicantName: string;
  applicantUsername: string;
  applicantEmail: string;
  primaryStyle?: string | null;
  portfolioLinks: string[];
  speedpaintVideoUrl?: string | null;
  socialLinks?: string[] | null;
  idProofUrl: string;
  idProofBackUrl: string;
  isNationalIdVerified: boolean;
  status: ApplicationStatusName;
  reviewedByModId?: string | null;
  reviewedByModName?: string | null;
  reviewNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

// Khớp enum ApplicationStatus bên backend (Domain/Enums/ApplicationStatus.cs).
// Body PUT .../review chưa có JsonStringEnumConverter nên phải gửi số, không gửi chuỗi.
export const ApplicationStatusValue = {
  Approved: 2,
  Rejected: 3,
  AdditionalProofRequested: 4,
} as const;

export interface ReviewApplicationRequest {
  status: number;
  reviewNote?: string;
  grantAiVerifiedBadge?: boolean;
}

export interface ListApplicationsMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  pendingCount: number;
}

export interface ListApplicationsResult {
  items: CreatorApplicationDto[];
  meta: ListApplicationsMeta;
}
