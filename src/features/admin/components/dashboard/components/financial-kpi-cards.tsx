'use client';

import React from 'react';
import { TrendingUp, ShieldCheck, DollarSign, Users } from 'lucide-react';

interface FinancialKpiCardsProps {
  totalGmv: number;
  completedCommissions: number;
  escrowLocked: number;
  inProgressCommissions: number;
  netRevenue: number;
  totalUsers: number;
  totalClients: number;
  totalCreators: number;
  loading: boolean;
  hasOverviewData: boolean;
}

export function FinancialKpiCards({
  totalGmv,
  completedCommissions,
  escrowLocked,
  inProgressCommissions,
  netRevenue,
  totalUsers,
  totalClients,
  totalCreators,
  loading,
  hasOverviewData,
}: FinancialKpiCardsProps) {
  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Platform GMV */}
      <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
            TOTAL PLATFORM GMV
          </span>
          <div className="p-1.5 rounded-lg bg-[#C5C9F8]/10 text-[#C5C9F8]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <h3 className="font-h1 text-2xl font-extrabold text-[#C5C9F8] tracking-tight">
          {loading && !hasOverviewData ? '...' : formatCurrency(totalGmv)}
        </h3>
        <p className="text-[11px] text-[#8A8FA9]">
          <span className="font-h1 font-bold text-white/90">{completedCommissions.toLocaleString()}</span> Completed Commissions
        </p>
      </div>

      {/* Card 2: Active Escrow */}
      <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
            ACTIVE ESCROW LOCKED
          </span>
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h3 className="font-h1 text-2xl font-extrabold text-white tracking-tight">
          {loading && !hasOverviewData ? '...' : formatCurrency(escrowLocked)}
        </h3>
        <p className="text-[11px] text-amber-400/90 font-medium">
          <span className="font-h1 font-bold">{inProgressCommissions}</span> Active Commissions
        </p>
      </div>

      {/* Card 3: Net Revenue */}
      <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
            NET REVENUE (<span className="font-h1 font-bold">10%</span> FEE)
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <h3 className="font-h1 text-2xl font-extrabold text-emerald-400 tracking-tight">
          {loading && !hasOverviewData ? '...' : formatCurrency(netRevenue)}
        </h3>
        <p className="text-[11px] text-emerald-400/80 font-medium">
          Platform 10% Commission Fee
        </p>
      </div>

      {/* Card 4: Registered Users */}
      <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
            REGISTERED USERS
          </span>
          <div className="p-1.5 rounded-lg bg-purple-400/10 text-purple-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <h3 className="font-h1 text-2xl font-extrabold text-white tracking-tight">
          {loading && !hasOverviewData ? (
            '...'
          ) : (
            <>
              <span className="font-h1 font-extrabold">{totalUsers.toLocaleString()}</span>{' '}
              <span className="text-xl font-bold text-white/90">Users</span>
            </>
          )}
        </h3>
        <p className="text-[11px] text-purple-300 font-medium">
          <span className="font-h1 font-bold text-purple-200">{totalClients.toLocaleString()}</span> Clients •{' '}
          <span className="font-h1 font-bold text-purple-200">{totalCreators.toLocaleString()}</span> Creators
        </p>
      </div>
    </div>
  );
}