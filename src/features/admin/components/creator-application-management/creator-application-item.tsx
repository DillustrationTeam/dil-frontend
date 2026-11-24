'use client';

import { useLanguage } from '@/context/language-context';
import { CreatorApplicationDto } from '@/features/admin/types/admin.types';

export interface CreatorApplicationItemProps {
  application: CreatorApplicationDto;
  onClick?: () => void;
}

export function CreatorApplicationItem({ application, onClick }: CreatorApplicationItemProps) {
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
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="glass-container rounded-[28px] p-5 md:p-6 transition-all cursor-pointer hover:border-[#B24A26]/40 select-none"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-h1 text-base font-semibold text-[#241F1A]">{application.fullName}</h3>
            <span className="text-xs font-mono text-[#B24A26]">(@{application.username})</span>
          </div>
          <p className="text-xs text-[#746A5F]">
            {isVie ? 'Gửi lúc' : 'Applied at'} {application.submittedAt || '—'}
            <span className="mx-2">•</span>
            {application.email}
          </p>
        </div>

        <div>
          <span className="inline-flex items-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-0.5 text-xs font-medium text-[#B24A26]">
            {formatStatus(application.applicationStatus)}
          </span>
        </div>
      </div>

      {application.statement ? (
        <p className="line-clamp-2 text-xs text-[#6E6459] mt-2">{application.statement}</p>
      ) : null}
    </div>
  );
}

export default CreatorApplicationItem;
