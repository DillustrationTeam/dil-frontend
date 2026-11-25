'use client';

import React from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { usePlatformFee } from '@/features/admin/hooks/use-platform-fee';
import {
  PolicyHeader,
  FeeRateSliderCard,
  PolicyParametersGrid,
  PolicyFormActionBar,
} from './components';

export function PlatformFeePolicyConsole() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

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
      <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-100 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#A8321C]/40 border-t-red-400 animate-spin flex items-center justify-center">
          <SlidersHorizontal className="w-5 h-5 text-[#A8321C]" />
        </div>
        <div>
          <h3 className="text-[#241F1A] font-h1 font-bold text-lg">
            {isVie ? 'Đang tải Biểu phí & Chính sách Nền tảng' : 'Loading Platform Fee & Policy'}
          </h3>
          <p className="text-xs text-[#6E6459] mt-1 font-body">
            {isVie ? 'Đang truy xuất thông số hệ thống từ máy chủ...' : 'Fetching live system parameters from server...'}
          </p>
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
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 text-[#A8321C] text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#A8321C]" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadPolicy()}
            className="px-3 py-1.5 rounded-lg bg-[#A8321C]/20 hover:bg-[#A8321C]/20 text-[#A8321C] font-bold underline cursor-pointer"
          >
            {isVie ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* 3. Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 lg:p-8 space-y-8">
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
