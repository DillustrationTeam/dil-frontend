'use client';

import React from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import { usePlatformFee } from '@/features/admin/hooks/use-platform-fee';
import {
  PolicyHeader,
  FeeRateSliderCard,
  PolicyParametersGrid,
  PolicyFormActionBar,
} from './components';

export function PlatformFeePolicyConsole() {
  const {
    policy,
    formValues,
    isDirty,
    loading,
    updating,
    error,
    loadPolicy,
    setFieldValue,
    savePolicy,
  } = usePlatformFee();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePolicy();
  };

  if (loading && !policy) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-100 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-red-500/30 border-t-red-400 animate-spin flex items-center justify-center">
          <SlidersHorizontal className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-h1 font-bold text-lg">Loading Platform Fee & Policy</h3>
          <p className="text-xs text-[#8A8FA9] mt-1 font-body">Fetching live system parameters from server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Title, Actions & Live Status */}
      <PolicyHeader
        loading={loading}
        updating={updating}
        onRefresh={() => void loadPolicy()}
      />

      {/* 2. Error Banner (if any) */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadPolicy()}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 lg:p-8 space-y-8">
          {/* Section: Fee Slider */}
          <FeeRateSliderCard
            feePercent={formValues.platformFeePercent}
            onChange={(val) => setFieldValue('platformFeePercent', val)}
          />

          {/* Section: Escrow Policy Parameters (3 Column Grid) */}
          <PolicyParametersGrid
            milestoneDays={formValues.milestoneAutoApprovalDays}
            revisionLimit={formValues.defaultFreeRevisionLimit}
            presignedUrlMinutes={formValues.presignedUrlExpirationMinutes}
            onMilestoneDaysChange={(val) => setFieldValue('milestoneAutoApprovalDays', val)}
            onRevisionLimitChange={(val) => setFieldValue('defaultFreeRevisionLimit', val)}
            onPresignedUrlMinutesChange={(val) => setFieldValue('presignedUrlExpirationMinutes', val)}
          />

          {/* Section: Save Changes Action */}
          <PolicyFormActionBar
            lastUpdated={policy?.updatedAt}
            isDirty={isDirty}
            updating={updating}
            policyExists={policy !== null}
          />
        </div>
      </form>
    </div>
  );
}

export default PlatformFeePolicyConsole;
