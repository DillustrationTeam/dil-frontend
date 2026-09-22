export const walletTransactionLabels = {
  Deposit: 'Nạp tiền',
  EscrowHold: 'Tạm giữ tiền',
  EscrowRelease: 'Giải ngân',
  EscrowReceive: 'Nhận thanh toán',
  Refund: 'Hoàn tiền',
  RefundFromHold: 'Hoàn tiền tạm giữ',
  Payout: 'Rút tiền',
  PlatformFee: 'Phí nền tảng',
  Adjustment: 'Điều chỉnh',
} as const;

export type WalletTransactionType = keyof typeof walletTransactionLabels;
export type WalletDirection = 'In' | 'Out';

export interface WalletOverviewDto {
  wallet: {
    walletId: string;
    balance: number;
    lockedBalance: number;
    currency: string;
    walletStatus: string;
  };
  summary: {
    /** Tiền đang bị giữ cho escrow đơn vẽ + cọc đấu giá. */
    escrowHeldAmount: number;
    /** Tổng đã rút THÀNH CÔNG (Admin đã chuyển khoản). */
    totalWithdrawn: number;
    /** Tiền đang CHỜ RÚT — ví đã trừ nhưng Admin chưa xử lý. */
    pendingPayoutAmount: number;
  };
}

export interface WalletTransactionDto {
  walletTransactionId: string;
  walletTxType: string;
  direction: WalletDirection;
  amount: number;
  balanceAfter: number;
  refType: string | null;
  refId: string | null;
  createdAt: string;
  note?: string | null;
}

export interface WalletTransactionFilters {
  walletTxType?: WalletTransactionType;
  direction?: WalletDirection;
  from?: string;
  to?: string;
}

export interface WalletTransactionPage {
  items: WalletTransactionDto[];
  nextCursor: string | null;
  total: number | null;
}
