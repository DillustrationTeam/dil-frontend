import { DatePeriod } from '@/lib/date-utils';

export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string | null;
}

export interface AdminUserFilters {
  keyword: string;
  role: string | null;
  status: string | null;
}

export interface CreatorApplicationDto {
  id: string;
  fullName: string;
  username: string;
  email: string;
  statement: string;
  applicationStatus: string;
  submittedAt: string;
  createdAt?: string;
}

export interface CreatorApplicationDetailDto {
  id: string;
  fullName: string;
  email: string;
  idCardUrl: string;
  portfolioUrl: string;
  statement: string;
  applicationStatus: string;
  submittedAt: string;
}

// ==========================================
// SCREEN 24 (SCR-24 / UC32): SYSTEM OVERVIEW & FINANCIAL KPIS
// ==========================================

export interface AdminFinancialKpiDto {
  /** Tổng giá trị giao dịch đơn vẽ (Gross Merchandise Value - VND) */
  totalGmv: number;
  /** Tổng tiền cọc Escrow đang bị khóa trong hệ thống (VND) */
  activeEscrowLocked: number;
  /** Doanh thu ròng của nền tảng từ phí sàn (VND) */
  netPlatformRevenue: number;
  /** Tổng số dư tiền trong ví người dùng (VND) */
  totalPlatformBalance: number;
  /** Tổng số tiền đã rút về ngân hàng thành công (VND) */
  totalPayoutsProcessed: number;
}

export interface AdminUserMetricsDto {
  totalUsers: number;
  newUsersToday: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalClients: number;
  totalCreators: number;
  totalModerators: number;
}

export interface AdminCommissionMetricsDto {
  totalCommissions: number;
  pendingAcceptanceCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  disputedCount: number;
}

export interface AdminActionRequiredQueueDto {
  pendingDisputesCount: number;
  pendingCreatorApplicationsCount: number;
  pendingPayoutsCount: number;
  flaggedArtworksCount: number;
}

export interface AdminDailyRevenueDto {
  date: string; // "yyyy-MM-dd"
  gmv: number;
  platformRevenue: number;
  escrowDeposited: number;
}

export interface AdminRecentTransactionDto {
  id: string;
  walletId: string;
  userName: string;
  userEmail: string;
  type: string;
  direction: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

export interface AdminDashboardOverviewDto {
  financialKpis: AdminFinancialKpiDto;
  userMetrics: AdminUserMetricsDto;
  commissionMetrics: AdminCommissionMetricsDto;
  actionRequiredQueue: AdminActionRequiredQueueDto;
  revenueTrend: AdminDailyRevenueDto[];
  recentTransactions: AdminRecentTransactionDto[];
}

// Alias for backwards compatibility
export type DashboardOverviewDto = AdminDashboardOverviewDto;

export type StatisticsTabKey = 'USERS' | 'ARTWORKS' | 'COMMISSIONS' | 'REVENUE';
export type ChartType = 'BAR' | 'LINE';

export interface StatisticsPointDto {
  label: string;
  value: number;
}

export interface StatisticsFilters {
  activeTab: StatisticsTabKey;
  period: DatePeriod;
  referenceDate: Date;
  chartType: ChartType;
}

export interface StatisticsQuery {
  period: DatePeriod;
  referenceDate: string;
}

export * from './platform-fee.types';
