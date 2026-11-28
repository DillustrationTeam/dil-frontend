'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, FileCheck, Image as ImageIcon, CreditCard } from 'lucide-react';
import { AdminActionRequiredQueueDto } from '@/features/admin/types/admin.types';
import { useLanguage } from '@/context/language-context';

interface ActionRequiredQueueProps {
  queue?: AdminActionRequiredQueueDto | null;
}

export function ActionRequiredQueue({ queue }: ActionRequiredQueueProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  if (!queue) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <Link
        href="/admin/disputes"
        className="glass-container bg-[#FFFCF6]/70 border border-[#221E1A]/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-[#A8321C]/40 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#A8321C]/10 text-[#A8321C] shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#6E6459] uppercase font-bold">{isVie ? 'Khiếu nại' : 'Disputes'}</p>
            <p className="font-h1 font-bold text-[#241F1A] text-sm">
              <span className="font-h1 font-extrabold text-[#241F1A]">{queue.pendingDisputesCount}</span>{' '}
              {isVie ? 'Chờ xử lý' : 'Pending'}
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/admin/creator-verifications"
        className="glass-container bg-[#FFFCF6]/70 border border-[#221E1A]/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-[#5F3F86]/40 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#5F3F86]/10 text-[#5F3F86] shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#6E6459] uppercase font-bold">{isVie ? 'Hồ sơ Họa sĩ' : 'Creators'}</p>
            <p className="font-h1 font-bold text-[#241F1A] text-sm">
              <span className="font-h1 font-extrabold text-[#241F1A]">{queue.pendingCreatorApplicationsCount}</span>{' '}
              {isVie ? 'Chờ duyệt' : 'Pending'}
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/admin/moderation"
        className="glass-container bg-[#FFFCF6]/70 border border-[#221E1A]/10 rounded-2xl p-3.5 flex items-center justify-between hover:border-[#8A6A1F]/40 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#8A6A1F]/10 text-[#8A6A1F] shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#6E6459] uppercase font-bold">{isVie ? 'Cảnh báo AI' : 'AI Flagged'}</p>
            <p className="font-h1 font-bold text-[#241F1A] text-sm">
              <span className="font-h1 font-extrabold text-[#241F1A]">{queue.flaggedArtworksCount}</span>{' '}
              {isVie ? 'Tác phẩm' : 'Artworks'}
            </p>
          </div>
        </div>
      </Link>

      <div className="glass-container bg-[#FFFCF6]/70 border border-[#221E1A]/10 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#2F6B63]/10 text-[#2F6B63] shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-[#6E6459] uppercase font-bold">{isVie ? 'Rút tiền' : 'Payouts'}</p>
            <p className="font-h1 font-bold text-[#241F1A] text-sm">
              <span className="font-h1 font-extrabold text-[#241F1A]">{queue.pendingPayoutsCount}</span>{' '}
              {isVie ? 'Trong hàng đợi' : 'In Queue'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
