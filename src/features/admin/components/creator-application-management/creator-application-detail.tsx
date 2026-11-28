import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { CreatorApplicationDetailDto } from '@/features/admin/types/admin.types';

export interface CreatorApplicationDetailProps {
  application: CreatorApplicationDetailDto;
}

export function CreatorApplicationDetail({ application }: CreatorApplicationDetailProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const formatStatus = (status?: string | null) => {
    switch (status) {
      case 'Pending':
        return isVie ? 'Chờ duyệt' : 'Pending';
      case 'Approved':
        return isVie ? 'Đã duyệt' : 'Approved';
      case 'Rejected':
        return isVie ? 'Đã từ chối' : 'Rejected';
      case 'AdditionalProofRequested':
        return isVie ? 'Cần bổ sung' : 'Additional Proof';
      default:
        return status || (isVie ? 'Chờ duyệt' : 'Pending');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            {isVie ? 'Mã đơn đăng ký' : 'Application ID'}
          </span>
          <p className="font-mono text-xs text-[#241F1A] break-all">{application.id || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            {isVie ? 'Trạng thái' : 'Status'}
          </span>
          <div>
            <span className="inline-flex items-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-0.5 text-xs font-medium text-[#B24A26]">
              {formatStatus(application.applicationStatus)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            {isVie ? 'Họ và tên' : 'Full Name'}
          </span>
          <p className="text-sm font-medium text-[#241F1A]">{application.fullName || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            Email
          </span>
          <p className="text-sm text-[#241F1A]">{application.email || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            {isVie ? 'Gửi lúc' : 'Submitted At'}
          </span>
          <p className="text-sm text-[#6E6459]">{application.submittedAt || '—'}</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#221E1A]/10 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
          {isVie ? 'Lời giới thiệu nghệ sĩ' : 'Artist Statement'}
        </span>
        <p className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6]/40 p-4 text-sm leading-relaxed text-[#241F1A] whitespace-pre-line">
          {application.statement || (isVie ? 'Không có lời giới thiệu.' : 'No statement provided.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-[#221E1A]/10 pt-4">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            {isVie ? 'CCCD / Giấy tờ tùy thân' : 'ID Card'}
          </span>
          {application.idCardUrl ? (
            <div className="overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]">
              <Image
                src={application.idCardUrl}
                alt="ID Card"
                width={400}
                height={192}
                unoptimized
                className="h-48 w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#221E1A]/10 text-xs text-[#746A5F]">
              {isVie ? 'Chưa tải lên CCCD' : 'No ID card uploaded'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B24A26]">
            Portfolio
          </span>
          {application.portfolioUrl ? (
            <div className="overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]">
              <Image
                src={application.portfolioUrl}
                alt="Portfolio"
                width={400}
                height={192}
                unoptimized
                className="h-48 w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#221E1A]/10 text-xs text-[#746A5F]">
              {isVie ? 'Chưa có ảnh hồ sơ tác phẩm' : 'No portfolio image uploaded'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatorApplicationDetail;
