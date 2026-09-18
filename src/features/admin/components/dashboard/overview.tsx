'use client';

import { DashboardOverviewDto } from '@/features/admin/types/admin.types';
import { OverviewCard } from './overview-card';

interface OverviewProps {
  data: DashboardOverviewDto;
}

export function Overview({ data }: OverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
      <OverviewCard title="Total Users" value={data.totalUsers} />
      <OverviewCard title="Total Creators" value={data.totalCreators} />
      <OverviewCard title="Total Artworks" value={data.totalArtworks} />
      <OverviewCard title="Total Commissions" value={data.totalCommissions} />
      <OverviewCard title="Total Revenue" value={`$${data.totalRevenue}`} />
    </div>
  );
}
