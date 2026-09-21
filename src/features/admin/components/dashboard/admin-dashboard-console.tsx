'use client';

import React from 'react';
import { useAdminDashboard } from '@/features/admin/hooks/use-admin-dashboard';
import {
  DashboardHeader,
  ActionRequiredQueue,
  FinancialKpiCards,
  RevenueTrendChart,
  CommissionBreakdownCard,
  SystemAuditLogTable,
} from './components';

export function AdminDashboardConsole() {
  const {
    overview,
    financialKpis,
    userMetrics,
    commissionMetrics,
    actionRequiredQueue,
    revenueTrend,
    recentTransactions,
    loading,
    error,
    refresh,
  } = useAdminDashboard();

  return (
    <div className="space-y-8 animate-fadeIn font-body">
      {/* 1. Page Header with Title, Actions & Error Alerts */}
      <DashboardHeader
        loading={loading}
        error={error}
        onRefresh={refresh}
      />

      {/* 2. Operational Action Required Queue */}
      <ActionRequiredQueue queue={actionRequiredQueue} />

      {/* 3. Executive KPI Cards (GMV, Escrow, Revenue, Users) */}
      <FinancialKpiCards
        totalGmv={financialKpis?.totalGmv ?? 0}
        completedCommissions={commissionMetrics?.completedCount ?? 0}
        escrowLocked={financialKpis?.activeEscrowLocked ?? 0}
        inProgressCommissions={commissionMetrics?.inProgressCount ?? 0}
        netRevenue={financialKpis?.netPlatformRevenue ?? 0}
        totalUsers={userMetrics?.totalUsers ?? 0}
        totalClients={userMetrics?.totalClients ?? 0}
        totalCreators={userMetrics?.totalCreators ?? 0}
        loading={loading}
        hasOverviewData={overview !== null}
      />

      {/* 4. Analytics & Breakdown Charts (5 cols Chart, 7 cols Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <RevenueTrendChart revenueTrend={revenueTrend} />
        </div>
        <div className="lg:col-span-7">
          <CommissionBreakdownCard
            totalCommissions={commissionMetrics?.totalCommissions ?? 0}
            completedCommissions={commissionMetrics?.completedCount ?? 0}
            inProgressCommissions={commissionMetrics?.inProgressCount ?? 0}
            disputedCommissions={commissionMetrics?.disputedCount ?? 0}
          />
        </div>
      </div>

      {/* 5. Live System Audit Log Table with Pagination (Max 10 per page) */}
      <SystemAuditLogTable
        transactions={recentTransactions}
        loading={loading}
      />
    </div>
  );
}

export default AdminDashboardConsole;
