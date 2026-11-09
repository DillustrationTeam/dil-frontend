'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { ArtTradeDto } from '@/types/art-trade.types';

interface TradeDisputeBannerProps {
  trade: ArtTradeDto;
  className?: string;
}

export function TradeDisputeBanner({ trade, className = '' }: TradeDisputeBannerProps) {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  return (
    <div
      className={`rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-[#1e1522]/70 to-[#171926]/90 p-5 sm:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Decorative accent glow */}
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="size-11 sm:size-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10 animate-pulse">
            <ShieldAlert className="size-6 text-red-400" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                <AlertTriangle className="size-3" />
                {isEng ? 'Under Dispute Arbitration' : 'Đang trong quá trình tranh chấp'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                #{trade.id.substring(0, 8)}
              </span>
            </div>

            <h3 className="font-h1 text-base sm:text-lg font-bold text-white tracking-tight">
              {isEng
                ? 'Art Trade Locked for Administrator Arbitration'
                : 'Phiên trao đổi đang được Quản trị viên phân xử khiếu nại'}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {isEng
                ? 'An official dispute has been filed regarding this trade. All completion and confirmation actions are temporarily frozen under dual-party escrow protection while platform moderators investigate.'
                : 'Giao dịch này đang có hồ sơ khiếu nại đang chờ phân xử. Mọi hành động xác nhận hài lòng hoặc hoàn tất tranh tạm thời bị tạm dừng để bảo vệ quyền lợi và uy tín nghệ thuật của cả hai bên.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-black/30 border border-white/5 text-[11px] text-slate-300 flex items-center gap-2">
            <Clock className="size-3.5 text-amber-300 shrink-0" />
            <span>{isEng ? 'Est. Verdict: 24h - 48h' : 'Thời gian phân xử dự kiến: 24h - 48h'}</span>
          </div>
        </div>
      </div>

      {/* Guidelines footer */}
      <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-red-400" />
          {isEng
            ? 'Artwork authenticity & AI-generation inspection'
            : 'Giám định tính nguyên bản tranh vẽ & phát hiện AI'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          {isEng
            ? 'Comparison against agreed reference notes'
            : 'Đối chiếu với yêu cầu & ảnh mẫu thỏa thuận ban đầu'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          {isEng
            ? 'Decision will be notified automatically upon ruling'
            : 'Kết quả phán quyết sẽ tự động cập nhật và thông báo'}
        </span>
      </div>
    </div>
  );
}

