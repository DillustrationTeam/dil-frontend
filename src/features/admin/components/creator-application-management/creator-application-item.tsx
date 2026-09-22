'use client';

import { CreatorApplicationDto } from '@/features/admin/types/admin.types';

export interface CreatorApplicationItemProps {
  application: CreatorApplicationDto;
  onClick?: () => void;
}

export function CreatorApplicationItem({ application, onClick }: CreatorApplicationItemProps) {
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
      className="glass-container rounded-[28px] p-5 md:p-6 transition-all cursor-pointer hover:border-[#A7ACD9]/40 select-none"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-h1 text-base font-semibold text-white">{application.fullName}</h3>
            <span className="text-xs font-mono text-[#A7ACD9]">(@{application.username})</span>
          </div>
          <p className="text-xs text-[#919099]">
            Applied at {application.submittedAt || '—'}
            <span className="mx-2">•</span>
            {application.email}
          </p>
        </div>

        <div>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[#A7ACD9]">
            {application.applicationStatus || 'Pending'}
          </span>
        </div>
      </div>

      {application.statement ? (
        <p className="line-clamp-2 text-xs text-[#C7C5CF] mt-2">{application.statement}</p>
      ) : null}
    </div>
  );
}

export default CreatorApplicationItem;
