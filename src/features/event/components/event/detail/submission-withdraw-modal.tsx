'use client';

import React from 'react';
import { AlertTriangle, X, Trash2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface SubmissionWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  artworkTitle?: string;
}

export function SubmissionWithdrawModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  artworkTitle,
}: SubmissionWithdrawModalProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/30 bg-[#161926] shadow-2xl transition-all">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-h1 text-base font-bold text-white">
                {isVie ? 'Rút bài dự thi' : 'Withdraw Submission'}
              </h3>
              <p className="text-xs text-[#919099]">
                {isVie ? 'Xác nhận hủy tham gia cuộc thi' : 'Confirm contest entry withdrawal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#919099] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="relative space-y-4 px-6 py-5">
          {artworkTitle && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs">
              <span className="text-[#919099]">{isVie ? 'Tác phẩm:' : 'Artwork:'} </span>
              <span className="font-semibold text-white">{artworkTitle}</span>
            </div>
          )}

          <p className="text-sm leading-relaxed text-[#c7c5cf]">
            {isVie
              ? 'Bạn có chắc chắn muốn rút bài dự thi này khỏi cuộc thi? Tác phẩm sẽ không còn xuất hiện trong danh sách chấm điểm và bình chọn.'
              : 'Are you sure you want to withdraw your submission from this contest? It will no longer be considered for judging or community voting.'}
          </p>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <p className="leading-relaxed">
              {isVie
                ? '💡 Bạn vẫn có thể nộp lại tác phẩm này hoặc một tác phẩm mới bất kỳ lúc nào trước khi thời hạn nhận bài kết thúc.'
                : '💡 You can resubmit this or a different artwork anytime before the submission window closes.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative flex items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{isVie ? 'Giữ lại bài thi' : 'Keep Submission'}</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{isVie ? 'Đang rút bài...' : 'Withdrawing...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isVie ? 'Xác nhận rút bài' : 'Confirm Withdrawal'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
