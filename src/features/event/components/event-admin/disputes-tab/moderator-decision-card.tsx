'use client';

import React, { useState } from 'react';
import { ShieldAlert, XCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';

interface ModeratorDecisionCardProps {
  selectedDisputeCode: string;
  onReject?: (notes?: string) => void;
  onApprove?: (notes?: string) => void;
}

export function ModeratorDecisionCard({
  selectedDisputeCode,
  onReject,
  onApprove,
}: ModeratorDecisionCardProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [decisionNotes, setDecisionNotes] = useState(
    isVie
      ? 'Dựa trên việc đối chiếu dữ liệu và xem xét bằng chứng, hội đồng xác nhận tác phẩm thỏa mãn các tiêu chí thể lệ độc lập.'
      : 'Based on cross-referenced telemetry data and evidence review, the committee confirms the artwork satisfies all independent eligibility criteria.'
  );

  const handleReject = () => {
    toast.error(isVie ? `Đã bác bỏ khiếu nại cho tranh chấp ${selectedDisputeCode}` : `Rejected appeal for dispute ${selectedDisputeCode}`);
    if (onReject) onReject(decisionNotes);
  };

  const handleApprove = () => {
    toast.success(isVie ? `Đã chấp thuận giải quyết tranh chấp cho ${selectedDisputeCode}` : `Approved dispute resolution for ${selectedDisputeCode}`);
    if (onApprove) onApprove(decisionNotes);
  };

  return (
    <aside className="glass-container rounded-2xl p-6 h-fit sticky top-24">
      <h2 className="text-xl font-bold font-h1 text-on-surface">
        {isVie ? 'Quyết định kiểm duyệt' : 'Moderator Decision'}
      </h2>
      <p className="text-sm text-outline mt-1 mb-4">
        {isVie ? 'Đang xem xét' : 'Reviewing'} <strong className="text-brand-periwinkle font-mono">{selectedDisputeCode}</strong>{' '}
        · {isVie ? 'Ưu tiên cao' : 'High Priority'}.
      </p>

      <div className="flex flex-col gap-3">
        <textarea
          rows={7}
          value={decisionNotes}
          onChange={(e) => setDecisionNotes(e.target.value)}
          placeholder={isVie ? 'Nhập căn cứ chi tiết, tham chiếu bằng chứng và các điều khoản xử lý...' : 'Enter detailed rationale, evidence reference, and resolution terms...'}
          className="w-full rounded-xl border border-white/10 bg-[#090b12]/70 text-white p-3.5 text-sm focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all resize-y"
        />

        <div className="flex flex-wrap items-center justify-end gap-2.5 mt-2">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2.5 rounded-xl bg-[#e598ad]/15 hover:bg-[#e598ad]/25 text-[#f2b3c4] border border-[#e598ad]/30 text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            {isVie ? 'Bác bỏ khiếu nại' : 'Reject Appeal'}
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            {isVie ? 'Chấp thuận xử lý' : 'Approve Resolution'}
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl border-l-4 border-brand-periwinkle bg-brand-periwinkle/10 text-on-surface-variant text-xs leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-periwinkle shrink-0 mt-0.5" />
          <span>
            {isVie
              ? 'Các quyết định phải bao gồm giải trình thực tế, danh tính người xử lý và dấu thời gian để tuân thủ kiểm toán.'
              : 'Decisions must include empirical justification, handler identity, and timestamp for audit compliance.'}
          </span>
        </div>
      </div>
    </aside>
  );
}
