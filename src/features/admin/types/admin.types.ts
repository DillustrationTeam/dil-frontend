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

export interface DashboardOverviewDto {
  totalUsers: number;
  totalCreators: number;
  totalArtworks: number;
  totalCommissions: number;
  totalRevenue: number;
}

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
