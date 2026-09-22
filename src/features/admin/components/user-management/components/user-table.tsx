'use client';

import React from 'react';
import {
  Shield,
  Sliders,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  UserAdminListItemDto,
  UserManagementMeta,
} from '@/features/admin/types/user-management.types';

export interface UserTableProps {
  items: UserAdminListItemDto[];
  meta: UserManagementMeta;
  selectedUserId: string | null;
  isLoading: boolean;
  error: string | null;
  onInspect: (userId: string, targetMode?: 'sanction' | 'roles') => void;
  onPageChange: (page: number) => void;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRoleBadge(roles: string[]) {
  const isCreator = roles.includes('Creator');
  const isClient = roles.includes('Client');
  const isAdmin = roles.includes('Administrator');
  const isMod = roles.includes('Moderator');

  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-[10px]">
        <Shield className="w-3 h-3" />
        Administrator
      </span>
    );
  }

  if (isCreator && isClient) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
        Dual-Role
      </span>
    );
  }

  if (isCreator) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-[10px]">
        Creator
      </span>
    );
  }

  if (isMod) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px]">
        Moderator
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
      Client
    </span>
  );
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserTable({
  items,
  meta,
  selectedUserId,
  isLoading,
  error,
  onInspect,
  onPageChange,
}: UserTableProps) {
  if (error) {
    return (
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-red-500/30 rounded-[28px] p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h4 className="text-white font-bold text-sm">Failed to Load User Accounts</h4>
        <p className="text-xs text-red-300/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-bold text-[#8A8FA9] border-b border-white/10">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Assigned Roles</th>
              <th className="py-3 px-4">Wallet Balance</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/90">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10"></div>
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-white/10 rounded"></div>
                        <div className="w-16 h-2 bg-white/5 rounded"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><div className="w-28 h-3 bg-white/10 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="w-16 h-5 bg-white/10 rounded-full"></div></td>
                  <td className="py-3.5 px-4"><div className="w-20 h-3 bg-white/10 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="w-16 h-5 bg-white/10 rounded-full"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="w-36 h-7 bg-white/10 rounded-lg ml-auto"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8A8FA9]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UserCheck className="w-8 h-8 text-[#8A8FA9]/40" />
                    <span className="text-sm font-semibold">No user accounts found</span>
                    <span className="text-xs text-[#8A8FA9]/70">
                      Try adjusting your search keywords or filter criteria.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((user) => {
                const isSelected = selectedUserId === user.id;
                const initials = getUserInitials(user.fullName || user.userName);
                const isPermanentBan =
                  user.isLockedOut &&
                  user.lockoutEnd &&
                  new Date(user.lockoutEnd).getFullYear() > 2050;

                return (
                  <tr
                    key={user.id}
                    onClick={() => onInspect(user.id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-red-500/15 border-l-4 border-l-red-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* 1. User (@username & FullName) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs select-none border ${
                            user.isLockedOut
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-white/10 text-white border-white/20'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white group-hover:text-red-300 transition-colors">
                            @{user.userName}
                          </p>
                          <p className="text-[11px] text-[#8A8FA9] truncate">
                            {user.fullName || 'No display name'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Email */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-[#C5C9F8]">{user.email}</p>
                        <span className="text-[10px] text-[#8A8FA9]">
                          {user.isVerified ? '✓ Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>

                    {/* 3. Assigned Roles */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(user.roles)}
                    </td>

                    {/* 4. Wallet Balance */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-emerald-300">
                        {formatVnd(user.walletBalance)}
                      </span>
                    </td>

                    {/* 5. Status Badge */}
                    <td className="py-3.5 px-4">
                      {user.isLockedOut ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              isPermanentBan
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            {isPermanentBan ? 'BANNED' : 'SUSPENDED'}
                          </span>
                          {!isPermanentBan && user.lockoutEnd && (
                            <p className="text-[9px] text-[#8A8FA9]">
                              until {new Date(user.lockoutEnd).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                          <Unlock className="w-2.5 h-2.5" />
                          ACTIVE
                        </span>
                      )}
                    </td>

                    {/* 6. Action Buttons: Apply Sanctions & Edit Roles */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Apply Sanctions Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspect(user.id, 'sanction');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            user.isLockedOut
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{user.isLockedOut ? 'Lift Sanction' : 'Apply Sanctions'}</span>
                        </button>

                        {/* Edit Roles Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspect(user.id, 'roles');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors cursor-pointer"
                          title="Edit User Roles"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Edit Roles</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar (Always visible with page size = 10) */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
        <div className="text-[#8A8FA9] text-[11px]">
          Showing page <span className="text-white font-bold">{meta.page}</span> of{' '}
          <span className="text-white font-bold">{Math.max(1, meta.totalPages)}</span>
          <span className="ml-1 text-[#8A8FA9]/70">({meta.totalCount} accounts)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1 || isLoading}
            onClick={() => onPageChange(meta.page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-semibold text-xs">
            Page <span className="font-bold text-red-300">{meta.page}</span> of {Math.max(1, meta.totalPages)}
          </span>

          <button
            type="button"
            disabled={meta.page >= meta.totalPages || isLoading}
            onClick={() => onPageChange(meta.page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserTable;
