'use client';

import { AdminDashboardOverviewDto } from '@/features/admin/types/admin.types';
import { OverviewCard } from './overview-card';

interface OverviewProps {
  data: AdminDashboardOverviewDto;
}

export function Overview({ data }: OverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OverviewCard
        title="TOTAL PLATFORM GMV"
        value={formatCurrency(data.financialKpis?.totalGmv ?? 0)}
      />
      <OverviewCard
        title="ACTIVE ESCROW LOCKED"
        value={formatCurrency(data.financialKpis?.activeEscrowLocked ?? 0)}
      />
      <OverviewCard
        title="NET REVENUE (10% FEE)"
        value={formatCurrency(data.financialKpis?.netPlatformRevenue ?? 0)}
      />
      <OverviewCard
        title="REGISTERED USERS"
        value={`${data.userMetrics?.totalUsers ?? 0} Users`}
      />
    </div>
  );
}
