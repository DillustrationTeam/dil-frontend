export interface SubmitCreatorApplicationRequest {
  portfolioLinks: string[];
  socialLinks?: string[];
  idProofUrl: string;
  idProofBackUrl: string;
  primaryStyle: string;
  speedpaintVideoUrls: string[];
}

export interface SubmitCreatorApplicationResponse {
  applicationId: string;
}

export type MyCreatorApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AdditionalProofRequested';

export interface MyCreatorApplicationDto {
  id: string;
  status: MyCreatorApplicationStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
  portfolioLinks: string[];
  socialLinks?: string[] | null;
  idProofUrl: string;
  idProofBackUrl: string;
  primaryStyle?: string | null;
  speedpaintVideoUrls: string[];
}