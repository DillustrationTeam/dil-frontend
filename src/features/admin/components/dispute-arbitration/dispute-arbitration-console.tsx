'use client';

import React from 'react';
import { useDisputes } from '@/features/admin/hooks/use-disputes';
import {
  DisputeHeader,
  DisputeQueueTable,
  DisputeArbitrationSection,
} from './components';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function DisputeArbitrationConsole() {
  const {
    items,
    meta,
    filters,
    selectedDisputeId,
    selectedDispute,
    isQueueLoading,
    isInspectionLoading,
    isArbitrationSubmitting,
    queueError,
    loadQueue,
    inspectDispute,
    setStatusFilter,
    setSearchFilter,
    setPage,
    resolveDispute,
  } = useDisputes();

  const handleInspectDispute = async (disputeId: string) => {
    await inspectDispute(disputeId);
    // Smooth scroll down to arbitration section on mobile / smaller viewports
    const element = document.getElementById('arbitration-dossier');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Statistics, Filters & Search Header */}
      <DisputeHeader
        pendingCount={meta.pendingCount}
        underReviewCount={meta.underReviewCount}
        resolvedCount={meta.resolvedCount}
        totalLockedEscrow={meta.totalLockedEscrow}
        activeStatus={filters.status}
        searchQuery={filters.search}
        isLoading={isQueueLoading}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchFilter}
        onRefresh={() => loadQueue()}
      />

      {/* Error alert banner if queue fetch fails */}
      {queueError && (
        <div className="p-4 rounded-2xl bg-[#A8321C]/10 border border-[#A8321C]/40 flex items-center justify-between text-xs text-[#A8321C]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#A8321C]" />
            <span>{queueError}</span>
          </div>
          <button
            onClick={() => loadQueue()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#A8321C]/20 hover:bg-[#A8321C]/20 text-[#241F1A] font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Dispute Queue Table */}
      <DisputeQueueTable
        items={items}
        meta={meta}
        selectedDisputeId={selectedDisputeId}
        isLoading={isQueueLoading}
        error={queueError}
        onInspect={handleInspectDispute}
        onPageChange={setPage}
      />

      {/* 3. Deep Arbitration Section (Evidence & Chat Snapshot + Settlement Form) */}
      <DisputeArbitrationSection
        dispute={selectedDispute}
        isLoading={isInspectionLoading}
        isSubmitting={isArbitrationSubmitting}
        onResolve={resolveDispute}
      />
    </div>
  );
}
