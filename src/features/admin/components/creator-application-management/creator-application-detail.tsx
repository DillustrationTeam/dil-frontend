'use client';

import { CreatorApplicationDetailDto } from '@/features/admin/types/admin.types';

export interface CreatorApplicationDetailProps {
  application: CreatorApplicationDetailDto;
}

export function CreatorApplicationDetail({ application }: CreatorApplicationDetailProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Application ID
          </span>
          <p className="font-mono text-xs text-[#E4E1E5] break-all">{application.id || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Status
          </span>
          <div>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[#A7ACD9]">
              {application.applicationStatus || 'Pending'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Full Name
          </span>
          <p className="text-sm font-medium text-white">{application.fullName || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Email
          </span>
          <p className="text-sm text-[#E4E1E5]">{application.email || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Submitted At
          </span>
          <p className="text-sm text-[#C7C5CF]">{application.submittedAt || '—'}</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
          Artist Statement
        </span>
        <p className="rounded-xl border border-white/10 bg-[#0e0e11]/40 p-4 text-sm leading-relaxed text-[#E4E1E5] whitespace-pre-line">
          {application.statement || 'No statement provided.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-white/10 pt-4">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            ID Card
          </span>
          {application.idCardUrl ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img
                src={application.idCardUrl}
                alt="ID Card"
                className="h-48 w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-[#919099]">
              No ID card uploaded
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Portfolio
          </span>
          {application.portfolioUrl ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img
                src={application.portfolioUrl}
                alt="Portfolio"
                className="h-48 w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-[#919099]">
              No portfolio image uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatorApplicationDetail;
