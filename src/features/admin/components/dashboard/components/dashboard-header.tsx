'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface DashboardHeaderProps {
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
}

export function DashboardHeader({ loading, error, onRefresh }: DashboardHeaderProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#221E1A]/10 pb-6">
        <div>
          <h1 className="font-h1 text-2xl sm:text-3xl font-extrabold text-[#241F1A] tracking-tight">
            {isVie ? 'Tổng quan Hệ thống & Chỉ số Tài chính' : 'System Overview & Financial KPIs'}
          </h1>
          <p className="text-xs text-[#6E6459] mt-1.5 max-w-2xl">
            {isVie
              ? 'Số liệu vận hành thời gian thực, tổng GMV, quỹ ký quỹ, doanh thu sàn và nhật ký hệ thống.'
              : 'Real-time operational metrics, total GMV, escrow liquidity, platform revenue, and live administrative audit trails.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/fee-policy"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10"
            title={isVie ? 'Cấu hình phí & chính sách sàn' : 'Configure Platform Fee & Policies'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B24A26]" />
            <span>{isVie ? 'Chính sách phí' : 'Fee Policy'}</span>
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 cursor-pointer"
            title={isVie ? 'Làm mới số liệu' : 'Refresh dashboard metrics'}
            aria-label={isVie ? 'Làm mới số liệu' : 'Refresh dashboard metrics'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B24A26]' : 'text-[#B24A26]'}`} />
            <span>{isVie ? 'Làm mới' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Backend Error Notice Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#A8321C]/10 border border-[#A8321C]/30 text-[#A8321C] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#A8321C] shrink-0" />
            <span>
              <strong>{isVie ? 'Lỗi kết nối máy chủ:' : 'Backend connection error:'}</strong> {error}{' '}
              {isVie
                ? '(Hãy đảm bảo backend API.NET đang chạy và bạn đã đăng nhập tài khoản có quyền quản trị viên).'
                : '(Ensure the .NET backend API is running and you are logged in as Admin).'}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-[#A8321C]/20 hover:bg-[#A8321C]/20 text-[#241F1A] font-medium transition-colors cursor-pointer shrink-0"
          >
            {isVie ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
}
