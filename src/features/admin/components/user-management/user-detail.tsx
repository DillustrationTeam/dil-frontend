'use client';

import { AdminUserDto } from '@/features/admin/types/admin.types';

export interface UserDetailProps {
  user: AdminUserDto;
}

export function UserDetail({ user }: UserDetailProps) {
  const formattedCreatedAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            User ID
          </span>
          <p className="font-mono text-xs text-[#E4E1E5] break-all">{user.id || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Role
          </span>
          <div>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[#A7ACD9]">
              {user.role || 'Client'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Full Name
          </span>
          <p className="text-sm font-medium text-white">{user.fullName || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Email
          </span>
          <p className="text-sm text-[#E4E1E5]">{user.email || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Status
          </span>
          <div>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[#A7ACD9]">
              {user.status || 'Active'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A7ACD9]">
            Created At
          </span>
          <p className="text-sm text-[#C7C5CF]">{formattedCreatedAt}</p>
        </div>
      </div>
    </div>
  );
}

export default UserDetail;
