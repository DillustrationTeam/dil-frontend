'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface PolicyHeaderProps {
  loading: boolean;
  updating: boolean;
  onRefresh: () => void;
}

export function PolicyHeader({ loading, updating, onRefresh }: PolicyHeaderProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-h1 text-2xl lg:text-3xl font-extrabold text-[#241F1A] tracking-tight">
            {isVie ? 'Biểu phí & Chính sách Nền tảng' : 'Platform Fee Rate & Policy Console'}
          </h1>
        </div>
        <p className="text-xs text-[#6E6459] mt-1 font-body">
          {isVie
            ? 'Cấu hình tỷ lệ hoa hồng nền tảng (5% - 15%), chính sách giải ngân ký quỹ và giới hạn chỉnh sửa.'
            : 'Configure global platform commission fee rates (5% - 15%), escrow release policies, and revision rules.'}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || updating}
          className="p-2.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] transition-all cursor-pointer disabled:opacity-50"
          title={isVie ? 'Làm mới từ máy chủ' : 'Refresh from server'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2F6B63]/10 border border-[#2F6B63]/30 text-[#2F6B63] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#2F6B63]/10 animate-pulse" />
          <span>{isVie ? 'Chính sách đang áp dụng' : 'Live Policy Active'}</span>
        </div>
      </div>
    </div>
  );
}
