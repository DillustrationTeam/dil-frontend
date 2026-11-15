'use client';

import React, { useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminRecentTransactionDto } from '@/features/admin/types/admin.types';
import { useLanguage } from '@/context/language-context';

interface SystemAuditLogTableProps {
  transactions?: AdminRecentTransactionDto[];
  loading: boolean;
}

export function SystemAuditLogTable({
  transactions = [],
  loading,
}: SystemAuditLogTableProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  // Audit Log Pagination (Max 10 per page)
  const [auditPage, setAuditPage] = useState(0);
  const AUDIT_PAGE_SIZE = 10;

  const totalAuditPages = Math.max(1, Math.ceil(transactions.length / AUDIT_PAGE_SIZE));
  const safeAuditPage = Math.min(auditPage, totalAuditPages - 1);

  const paginatedTransactions = useMemo(() => {
    const start = safeAuditPage * AUDIT_PAGE_SIZE;
    return transactions.slice(start, start + AUDIT_PAGE_SIZE);
  }, [transactions, safeAuditPage]);

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  return (
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#A7ACD9]" />
          <h3 className="font-h1 font-bold text-white text-base">
            {isVie ? 'Nhật ký Kiểm toán Hệ thống (AuditLog)' : 'Recent System Audit Log (AuditLog Table)'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#8A8FA9] font-h1">
            {isVie ? (
              <>
                Hiển thị {transactions.length > 0 ? safeAuditPage * AUDIT_PAGE_SIZE + 1 : 0} -{' '}
                {Math.min((safeAuditPage + 1) * AUDIT_PAGE_SIZE, transactions.length)} trên{' '}
                {transactions.length} bản ghi
              </>
            ) : (
              <>
                Showing {transactions.length > 0 ? safeAuditPage * AUDIT_PAGE_SIZE + 1 : 0} -{' '}
                {Math.min((safeAuditPage + 1) * AUDIT_PAGE_SIZE, transactions.length)} of{' '}
                {transactions.length} logs
              </>
            )}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            {isVie ? 'Nhật ký trực tiếp' : 'Live Audit Trail'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-bold text-[#8A8FA9] border-b border-white/10">
            <tr>
              <th className="py-3 px-4">{isVie ? 'Mã Log' : 'Log ID'}</th>
              <th className="py-3 px-4">{isVie ? 'Thời gian' : 'Timestamp'}</th>
              <th className="py-3 px-4">{isVie ? 'Loại giao dịch' : 'Action Type'}</th>
              <th className="py-3 px-4">{isVie ? 'Người dùng' : 'Actor'}</th>
              <th className="py-3 px-4">{isVie ? 'Mục tiêu / Ghi chú' : 'Resource Target / Note'}</th>
              <th className="py-3 px-4 text-center">{isVie ? 'Chiều / Trạng thái' : 'Direction / Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/90">
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-h1 font-bold text-[#C5C9F8]">
                    #{tx.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="py-3.5 px-4 text-[#8A8FA9] font-h1">
                    {new Date(tx.createdAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-h1 font-bold text-[10px]">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium">{tx.userName || tx.userEmail}</td>
                  <td className="py-3.5 px-4 text-white/70">
                    {tx.note || (isVie ? 'Ký quỹ/Phí nền tảng' : 'Platform Escrow/Fee')} • <span className="font-h1 font-bold text-white">{formatCurrency(tx.amount)}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-h1 font-bold text-[10px] ${
                        tx.direction === 'In' || tx.direction === 'Deposit'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {tx.direction || 'SUCCESS'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#8A8FA9] text-xs">
                  {loading
                    ? (isVie ? 'Đang tải dữ liệu lịch sử giao dịch từ hệ thống...' : 'Loading system audit logs...')
                    : (isVie ? 'Chưa có bản ghi giao dịch hoặc nhật ký hệ thống nào trong cơ sở dữ liệu.' : 'No system audit transactions recorded yet.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (Max 10 per page) */}
      {totalAuditPages > 1 && (
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8A8FA9]">
          <span>
            {isVie ? (
              <>
                Trang <span className="text-white font-bold">{safeAuditPage + 1}</span> /{' '}
                <span className="text-white font-bold">{totalAuditPages}</span> (10 mục / trang)
              </>
            ) : (
              <>
                Page <span className="text-white font-bold">{safeAuditPage + 1}</span> of{' '}
                <span className="text-white font-bold">{totalAuditPages}</span> (10 items / page)
              </>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
              disabled={safeAuditPage === 0}
              className="p-1.5 rounded-lg border border-white/10 bg-black/40 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isVie ? 'Trang trước' : 'Previous page'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-white">
              {safeAuditPage + 1} / {totalAuditPages}
            </span>
            <button
              type="button"
              onClick={() => setAuditPage((p) => Math.min(totalAuditPages - 1, p + 1))}
              disabled={safeAuditPage >= totalAuditPages - 1}
              className="p-1.5 rounded-lg border border-white/10 bg-black/40 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isVie ? 'Trang sau' : 'Next page'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
