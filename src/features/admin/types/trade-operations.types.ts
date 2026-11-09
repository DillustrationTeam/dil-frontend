import { ArtTradeDto, TradeStatus } from '@/types/art-trade.types';

export type TradeDisputeStatus = 'Pending' | 'Investigating' | 'Resolved' | 'Dismissed';

export type TradeDisputeResolutionType =
  | 'FaultInitiator'
  | 'FaultReceiver'
  | 'MutualCancel'
  | 'Dismissed';

export type TradeDisputeCategory =
  | 'AiArt'
  | 'Plagiarism'
  | 'AgreementBreach'
  | 'DeadlineMissed'
  | 'TosViolation'
  | 'Other';

export interface TradeDisputeDto {
  id: string;
  artTradeId: string;
  tradeTitle?: string | null;
  raisedById: string;
  raisedByName?: string | null;
  partnerId: string;
  partnerName?: string | null;
  category?: TradeDisputeCategory | string | null;
  reason: string;
  evidenceUrls?: string | null;
  evidenceUrlList: string[];
  status: string;
  resolution?: string | null;
  adminNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface ResolveTradeDisputePayload {
  resolution: TradeDisputeResolutionType;
  adminNote?: string | null;
}

export interface AdminTradeListParams {
  status?: TradeStatus | string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminDisputeListParams {
  status?: string;
  category?: string;
  artTradeId?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminTradeListMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  activeCount: number;
  completedCount: number;
  disputedCount: number;
  cancelledCount: number;
}

export interface AdminTradeListResponse {
  items: ArtTradeDto[];
  meta: AdminTradeListMeta;
}

export interface AdminDisputeListResponse {
  items: TradeDisputeDto[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

