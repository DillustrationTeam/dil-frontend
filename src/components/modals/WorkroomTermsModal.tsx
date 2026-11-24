'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, FileText, Scale, ShieldCheck } from 'lucide-react';
import type { Commission } from '@/types/commission.types';
import { CreatorTermsOverview } from '@/components/terms/CreatorTermsOverview';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F0E7D8]/85 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workroom-terms-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] shadow-2xl"
      >
        <header className="border-b border-[#221E1A]/10 bg-[#FFFCF6] px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#3B4C86]/40 bg-[#3B4C86]/10 text-[#3B4C86]">
              <FileText size={20} />
            </div>
            <div>
              <h1 id="workroom-terms-title" className="font-space-grotesk text-lg font-bold text-[#241F1A]"> Điều khoản sử dụng phòng làm việc </h1>
              <p className="mt-1 text-xs leading-5 text-[#746A5F]"> Vui lòng đọc trước khi thanh toán hoặc bắt đầu thực hiện đặt vẽ. </p>
            </div>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-5 sm:px-8">
          <div className="grid gap-3 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-xs text-[#746A5F] sm:grid-cols-2">
            <p><span className="text-[#746A5F]">Đơn hàng:</span> <strong className="text-[#241F1A]">{commission.title}</strong></p>
            <p><span className="text-[#746A5F]">Giá trị hợp đồng:</span> <strong className="text-[#241F1A]">{(commission.finalPrice ?? commission.totalPrice ?? 0).toLocaleString('vi-VN')}đ</strong>{commission.isStagedEscrow && (commission.nextEscrowDepositAmount ?? 0) > 0 ? <span className="ml-1.5 text-[#3B4C86]">(Đợt này: {(commission.nextEscrowDepositAmount ?? 0).toLocaleString('vi-VN')}đ)</span> : null}</p>
            <p><span className="text-[#746A5F]">Giấy phép:</span> <strong className="text-[#241F1A]">{commission.licenseType === 'Commercial' ? 'Thương mại' : 'Cá nhân'}</strong></p>
            <p><span className="text-[#746A5F]">Hạn bàn giao:</span> <strong className="text-[#241F1A]">{commission.deadlineAt ? new Date(commission.deadlineAt).toLocaleString('vi-VN') : 'Chưa xác định'}</strong></p>
          </div>

          <div className="mt-5 space-y-5 text-sm leading-6 text-[#746A5F]">
            <TermsSection title="Thanh toán và nghiệm thu" icon={<ShieldCheck size={17} />}>
              Với đơn dưới 2.000.000đ, Client ký quỹ 100% giá trị đơn ngay từ đầu. Với đơn từ 2.000.000đ trở lên, Client ký quỹ theo từng mốc (nạp trước Mốc #1, và nạp tiếp mỗi mốc kế tiếp sau khi duyệt mốc trước). Creator nhận tiền theo từng giai đoạn sau khi Client phê duyệt. Tệp gửi trong phần trò chuyện chỉ dùng để trao đổi; sản phẩm cần được nộp bằng chức năng bàn giao của từng giai đoạn.
            </TermsSection>

            <TermsSection title="Chỉnh sửa và bàn giao" icon={<Check size={17} />}>
              Khách hàng có thể phê duyệt hoặc yêu cầu chỉnh sửa bản nộp. Mỗi giai đoạn được yêu cầu chỉnh sửa tối đa {revisionLimit} lần. Sau 72 giờ kể từ khi họa sĩ nộp bản WIP của giai đoạn mà khách hàng chưa phản hồi hoặc yêu cầu chỉnh sửa, hệ thống tự động nghiệm thu và giải ngân cho giai đoạn đó. Sau khi hoàn tất, liên kết tải tệp gốc có hiệu lực 15 phút và có thể được tạo lại.
            </TermsSection>

            <TermsSection title="Hủy đơn" icon={<Scale size={17} />}>
              Khi đơn chưa được chấp nhận, mỗi bên có thể tự hủy. Sau khi đơn được chấp nhận, bên còn lại phải phản hồi yêu cầu hủy trong 48 giờ. Nếu họa sĩ yêu cầu và khách hàng không phản hồi, đơn tự động hủy. Nếu khách hàng yêu cầu và họa sĩ không phản hồi, yêu cầu hết hạn và khách hàng có thể khiếu nại.
            </TermsSection>

            <TermsSection title="Quá hạn và tranh chấp" icon={<Scale size={17} />}>
              Khi quá hạn bàn giao, họa sĩ có thêm 24 giờ để hoàn thành. Sau thời gian này, khách hàng có thể yêu cầu hủy và nhận lại phần ký quỹ chưa giải ngân. Khi hai bên không thống nhất, quản trị viên sẽ xem xét brief, lịch sử trao đổi, tệp bàn giao và dữ liệu thanh toán để quyết định cách xử lý số tiền còn giữ.
            </TermsSection>

            {commission.creatorTermsSnapshot && (
              <div className="rounded-2xl border border-[#3B4C86]/30 bg-[#FFFCF6] p-4">
                <CreatorTermsOverview terms={commission.creatorTermsSnapshot} creatorName={commission.creatorName} compact />
              </div>
            )}

            <div className="rounded-2xl border border-[#8A6A1F]/30 bg-[#8A6A1F]/10/[0.07] p-4 text-xs leading-5 text-[#8A6A1F]">
              <strong className="text-[#8A6A1F]">Lưu ý:</strong> Giấy phép thương mại ghi nhận mục đích sử dụng và mức phí áp dụng. Phạm vi quyền tác giả, quyền đăng hồ sơ tác phẩm hoặc thỏa thuận bảo mật cần được hai bên thống nhất riêng trong đề bài. </div>
          </div>
        </div>

        <footer className="border-t border-[#221E1A]/10 bg-[#FFFCF6] px-6 py-5 sm:px-8">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#746A5F]">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 size-4 accent-[#3B4C86]"
            />
            <span>Tôi đã đọc, hiểu và đồng ý với quy trình làm việc, quy định thanh toán, hủy đơn, giải quyết tranh chấp của Dillustration{commission.creatorTermsSnapshot ? ' và Điều khoản dịch vụ (ToS) riêng của họa sĩ cho đơn hàng này' : ''}.</span>
          </label>
          {error ? <p role="alert" className="mt-3 text-xs text-[#A8321C]">{error}</p> : null}
          <button
            type="button"
            disabled={!accepted || isSubmitting}
            onClick={onConfirm}
            className="mt-4 w-full rounded-xl bg-[#3B4C86]/10 px-5 py-3 text-sm font-bold text-[#241F1A] transition hover:bg-[#3B4C86]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? 'Đang ghi nhận…'
              : role === 'client' && commission.escrowStatus === 'Pending'
              ? 'Đồng ý và tiếp tục ký quỹ'
              : 'Đồng ý và vào phòng làm việc'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function TermsSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-space-grotesk text-sm font-bold text-[#241F1A]">
        <span className="text-[#3B4C86]">{icon}</span>
        {title}
      </h2>
      <p className="mt-1.5 text-xs leading-5 text-[#746A5F]">{children}</p>
    </section>
  );
}
