export interface PaymentOrderDto {
  paymentOrderId: string; orderRef: string; amount: number; gateway: string; paymentOrderStatus: string;
  paymentUrl?: string | null; qrCode?: string | null; accountNumber?: string | null; accountName?: string | null; bankBin?: string | null;
  checkoutAction?: string | null; checkoutFields?: { name: string; value: string }[] | null;
  createdAt?: string; paidAt?: string | null; walletBalance?: number;
}
export interface BankAccountDto {
  bankAccountId: string; bankName: string; accountNumberMasked: string; accountHolder: string; isDefault: boolean;
  bankBin?: string | null; bankCode?: string | null; isVerified: boolean;
}
export interface BankAccountRequest {
  bankName: string; accountNumber: string; accountHolder: string; isDefault: boolean;
}
export interface PayoutDto {
  payoutRequestId: string; amount: number; payoutStatus: string; payoutNote: string | null;
  processedBy: string | null; transactionRef: string | null;
  createdAt: string; processedAt: string | null; rejectReason?: string | null; bankAccount?: BankAccountDto | null;
}
export interface UpdatePayoutStatusRequest {
  payoutStatus: 'Processed' | 'Rejected';
  payoutNote?: string | null;
  transactionRef?: string | null;
}
export interface AdminPayoutFilters {
  status?: 'Pending' | 'Processed' | 'Rejected';
  userId?: string;
  cursor?: string;
  limit?: number;
}
export interface VoucherDto {
  voucherId: string; voucherCode: string; name: string | null; discountType: 'Percent' | 'Fixed'; discountValue: number;
  minOrderAmount: number; maxDiscountAmount: number | null; scope: string[]; startDate: string; endDate: string;
  usageLimit: number | null; usedCount: number; isActive: boolean; voucherStatus: string; createdByUserId: string | null; isMine: boolean;
}
export interface VoucherRequest {
  voucherCode: string; name?: string; discountType: 'Percent' | 'Fixed'; discountValue: number; minOrderAmount: number;
  maxDiscountAmount?: number | null; scope: string[]; startDate: string; endDate: string; usageLimit?: number | null; isActive?: boolean;
}
export interface VoucherDetailDto {
  voucher: VoucherDto; usedCount: number;
  redemptions: { voucherRedemptionId: string; userId: string; refType: string; refId: string; discountAmount: number; redeemedAt: string }[];
}
export interface VoucherValidationDto { voucherId: string | null; isValid: boolean; discountAmount: number; finalAmount: number; reason: string | null }
export interface VoucherRedeemedDto {
  voucherRedemptionId: string; voucherId: string; voucherCode: string;
  discountAmount: number; orderAmount: number; finalAmount: number; redeemedAt: string;
}
export interface RevenueSummaryDto { grossAmount: number; feeAmount: number; netAmount: number; completedOrderCount: number; averageOrderValue: number }
export interface RevenuePointDto { periodLabel: string; grossAmount: number; feeAmount: number; netAmount: number }
export interface RevenueBreakdownDto { key: string; label: string; grossAmount: number; feeAmount: number; netAmount: number; orderCount: number }
export interface RevenueSnapshotDto { revenueSnapshotId: string; scope: string; snapshotDate: string; grossAmount: number; feeAmount: number; netAmount: number; completedOrderCount: number; rebuiltAt: string | null }
