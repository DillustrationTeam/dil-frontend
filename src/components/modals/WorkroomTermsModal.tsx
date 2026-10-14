'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, FileText, Scale, ShieldCheck } from 'lucide-react';
import type { Commission } from '@/types/commission.types';

interface WorkroomTermsModalProps {
  isOpen: boolean;
  role: 'client' | 'creator';
  commission: Commission;
  isSubmitting?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
}

export default function WorkroomTermsModal({
  isOpen,
  role,
  commission,
  isSubmitting = false,
  error,
  onConfirm,
}: WorkroomTermsModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const milestones = commission.milestones ?? [];
  const revisionLimit = milestones[0]?.maxRevisions ?? 3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workroom-terms-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#131522] shadow-2xl"
      >
        <header className="border-b border-white/10 bg-[#181b2a] px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/30 bg-indigo-300/10 text-indigo-200">
              <FileText size={20} />
            </div>
            <div>
              <h1 id="workroom-terms-title" className="font-space-grotesk text-lg font-bold text-white">
                Điều khoản sử dụng Workroom
              </h1>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Vui lòng đọc trước khi thanh toán hoặc bắt đầu thực hiện commission.
              </p>
            </div>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-5 sm:px-8">
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs text-slate-300 sm:grid-cols-2">
            <p><span className="text-slate-500">Đơn hàng:</span> <strong className="text-white">{commission.title}</strong></p>
            <p><span className="text-slate-500">Giá trị:</span> <strong className="text-white">{(commission.finalPrice ?? commission.totalPrice ?? 0).toLocaleString('vi-VN')}đ</strong></p>
            <p><span className="text-slate-500">Giấy phép:</span> <strong className="text-white">{commission.licenseType === 'Commercial' ? 'Thương mại' : 'Cá nhân'}</strong></p>
            <p><span className="text-slate-500">Hạn bàn giao:</span> <strong className="text-white">{commission.deadlineAt ? new Date(commission.deadlineAt).toLocaleString('vi-VN') : 'Chưa xác định'}</strong></p>
          </div>

          <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300">
            <TermsSection title="Thanh toán và nghiệm thu" icon={<ShieldCheck size={17} />}>
              Client thanh toán toàn bộ giá trị đơn vào Escrow. Creator nhận tiền theo từng giai đoạn sau khi Client phê duyệt. Tệp gửi trong phần trò chuyện chỉ dùng để trao đổi; sản phẩm cần được nộp bằng chức năng bàn giao của từng giai đoạn.
            </TermsSection>

            <TermsSection title="Chỉnh sửa và bàn giao" icon={<Check size={17} />}>
              Client có thể phê duyệt hoặc yêu cầu chỉnh sửa bản nộp. Mỗi giai đoạn được yêu cầu chỉnh sửa tối đa {revisionLimit} lần. Dillustration hiện không tự động phê duyệt khi Client chưa phản hồi. Sau khi hoàn tất, liên kết tải tệp gốc có hiệu lực 15 phút và có thể được tạo lại.
            </TermsSection>

            <TermsSection title="Hủy đơn" icon={<Scale size={17} />}>
              Khi đơn chưa được chấp nhận, mỗi bên có thể tự hủy. Sau khi đơn được chấp nhận, bên còn lại phải phản hồi yêu cầu hủy trong 48 giờ. Nếu Creator yêu cầu và Client không phản hồi, đơn tự động hủy. Nếu Client yêu cầu và Creator không phản hồi, yêu cầu hết hạn và Client có thể khiếu nại.
            </TermsSection>

            <TermsSection title="Quá hạn và tranh chấp" icon={<Scale size={17} />}>
              Khi quá hạn bàn giao, Creator có thêm 24 giờ để hoàn thành. Sau thời gian này, Client có thể yêu cầu hủy và nhận lại phần Escrow chưa giải ngân. Khi hai bên không thống nhất, Admin sẽ xem xét brief, lịch sử trao đổi, tệp bàn giao và dữ liệu thanh toán để quyết định cách xử lý số tiền còn giữ.
            </TermsSection>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-xs leading-5 text-amber-100/85">
              <strong className="text-amber-200">Lưu ý:</strong> Giấy phép thương mại ghi nhận mục đích sử dụng và mức phí áp dụng. Phạm vi quyền tác giả, quyền đăng portfolio hoặc thỏa thuận bảo mật cần được hai bên thống nhất riêng trong brief.
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 bg-[#181b2a] px-6 py-5 sm:px-8">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-300">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 size-4 accent-indigo-400"
            />
            <span>Tôi đã đọc, hiểu và đồng ý với quy trình làm việc, quy định thanh toán, hủy đơn và giải quyết tranh chấp của Dillustration.</span>
          </label>
          {error ? <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p> : null}
          <button
            type="button"
            disabled={!accepted || isSubmitting}
            onClick={onConfirm}
            className="mt-4 w-full rounded-xl bg-indigo-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? 'Đang ghi nhận…'
              : role === 'client' && commission.escrowStatus === 'Pending'
              ? 'Đồng ý và tiếp tục ký quỹ'
              : 'Đồng ý và vào Workroom'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function TermsSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-space-grotesk text-sm font-bold text-white">
        <span className="text-indigo-200">{icon}</span>
        {title}
      </h2>
      <p className="mt-1.5 text-xs leading-5 text-slate-400">{children}</p>
    </section>
  );
}
