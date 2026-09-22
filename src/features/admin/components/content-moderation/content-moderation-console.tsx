'use client';

import React from 'react';
import { useModeration } from '@/features/admin/hooks/use-moderation';
import {
  ModerationHeader,
  ModerationQueueTable,
  ModerationInspectionPanel,
} from './components';

export function ContentModerationConsole() {
  const {
    items,
    meta,
    filters,
    selectedArtwork,
    isQueueLoading,
    isInspectionLoading,
    isDecisionSubmitting,
    queueError,
    loadQueue,
    inspectArtwork,
    clearSelectedArtwork,
    setStatusFilter,
    setSearchFilter,
    setPage,
    executeDecision,
  } = useModeration();

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Top Header with Title, Stats & Filter Controls */}
      <ModerationHeader
        pendingCount={meta.pendingCount}
        activeStatus={filters.status}
        searchQuery={filters.search}
        isLoading={isQueueLoading}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchFilter}
        onRefresh={() => void loadQueue()}
      />

      {/* 2. Flagged Artwork Queue Table */}
      <ModerationQueueTable
        items={items}
        meta={meta}
        selectedArtworkId={selectedArtwork?.artworkId}
        isLoading={isQueueLoading}
        error={queueError}
        onInspect={inspectArtwork}
        onPageChange={setPage}
      />

      {/* 3. Detailed Inspection & Moderator Decision Panel */}
      <ModerationInspectionPanel
        artwork={selectedArtwork}
        isLoading={isInspectionLoading}
        isSubmitting={isDecisionSubmitting}
        onExecuteDecision={executeDecision}
        onClose={selectedArtwork ? clearSelectedArtwork : undefined}
      />
    </div>
  );
}

export default ContentModerationConsole;
