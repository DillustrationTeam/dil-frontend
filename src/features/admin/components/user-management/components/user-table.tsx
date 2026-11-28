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
import { useLanguage } from '@/context/language-context';

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

function getRoleBadge(roles: string[], isVie: boolean = false) {
  const isCreator = roles.includes('Creator');
  const isClient = roles.includes('Client');
  const isAdmin = roles.includes('Administrator');
  const isMod = roles.includes('Moderator');

  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#A8321C]/20 text-[#A8321C] border border-[#A8321C]/40 font-bold text-[10px]">
        <Shield className="w-3 h-3" />
        {isVie ? 'Quản trị viên' : 'Administrator'}
      </span>
    );
  }

  if (isCreator && isClient) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40 font-bold text-[10px]">
        {isVie ? 'Hai vai trò' : 'Dual-Role'}
      </span>
    );
  }

  if (isCreator) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2C6A86]/20 text-[#2C6A86] border border-[#2C6A86]/40 font-bold text-[10px]">
        {isVie ? 'Họa sĩ' : 'Creator'}
      </span>
    );
  }

  if (isMod) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5F3F86]/20 text-[#5F3F86] border border-[#5F3F86]/40 font-bold text-[10px]">
        {isVie ? 'Kiểm duyệt viên' : 'Moderator'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40 font-bold text-[10px]">
      {isVie ? 'Khách hàng' : 'Client'}
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  if (error) {
    return (
      <div className="bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#A8321C]/40 rounded-[28px] p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#A8321C] mx-auto" />
        <h4 className="text-[#241F1A] font-bold text-sm">
          {isVie ? 'Không thể tải danh sách tài khoản' : 'Failed to Load User Accounts'}
        </h4>
        <p className="text-xs text-[#A8321C]">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-bold text-[#6E6459] border-b border-[#221E1A]/10">
            <tr>
              <th className="py-3 px-4">{isVie ? 'Tài khoản' : 'User'}</th>
              <th className="py-3 px-4">{isVie ? 'Email' : 'Email'}</th>
              <th className="py-3 px-4">{isVie ? 'Vai trò đã gán' : 'Assigned Roles'}</th>
              <th className="py-3 px-4">{isVie ? 'Số dư ví' : 'Wallet Balance'}</th>
              <th className="py-3 px-4">{isVie ? 'Trạng thái' : 'Status'}</th>
              <th className="py-3 px-4 text-right">{isVie ? 'Thao tác' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#221E1A]/10 text-[#241F1A]/90">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F0E7D8]"></div>
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-[#F0E7D8] rounded"></div>
                        <div className="w-16 h-2 bg-[#FFFCF6] rounded"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><div className="w-28 h-3 bg-[#F0E7D8] rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="w-16 h-5 bg-[#F0E7D8] rounded-full"></div></td>
                  <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#F0E7D8] rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="w-16 h-5 bg-[#F0E7D8] rounded-full"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="w-36 h-7 bg-[#F0E7D8] rounded-lg ml-auto"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#6E6459]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UserCheck className="w-8 h-8 text-[#6E6459]" />
                    <span className="text-sm font-semibold">
                      {isVie ? 'Không tìm thấy tài khoản người dùng' : 'No user accounts found'}
                    </span>
                    <span className="text-xs text-[#6E6459]/70">
                      {isVie ? 'Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.' : 'Try adjusting your search keywords or filter criteria.'}
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
                        ? 'admin-user-row-selected bg-[#A8321C]/15 border-l-4 border-l-red-500'
                        : 'hover:bg-[#FFFCF6]'
                    }`}
                  >
                    {/* 1. User (@username & FullName) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs select-none border ${
                            user.isLockedOut
                              ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40'
                              : 'bg-[#F0E7D8] text-[#241F1A] border-[#221E1A]/20'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#241F1A] group-hover:text-[#A8321C] transition-colors">
                            @{user.userName}
                          </p>
                          <p className="text-[11px] text-[#6E6459] truncate">
                            {user.fullName || (isVie ? 'Chưa đặt tên hiển thị' : 'No display name')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Email */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-[#8C3718]">{user.email}</p>
                        <span className="text-[10px] text-[#6E6459]">
                          {user.isVerified ? (isVie ? '✓ Đã xác thực' : '✓ Verified') : (isVie ? 'Chưa xác thực' : 'Unverified')}
                        </span>
                      </div>
                    </td>

                    {/* 3. Assigned Roles */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(user.roles, isVie)}
                    </td>

                    {/* 4. Wallet Balance */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-[#2F6B63]">
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
                                ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40'
                                : 'bg-[#8A6A1F]/20 text-[#8A6A1F] border-[#8A6A1F]/40'
                            }`}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            {isPermanentBan ? (isVie ? 'BỊ CẤM' : 'BANNED') : (isVie ? 'TẠM KHÓA' : 'SUSPENDED')}
                          </span>
                          {!isPermanentBan && user.lockoutEnd && (
                            <p className="text-[9px] text-[#6E6459]">
                              {isVie
                                ? `Đến ${new Date(user.lockoutEnd).toLocaleDateString('vi-VN')}`
                                : `until ${new Date(user.lockoutEnd).toLocaleDateString('vi-VN')}`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40 font-bold text-[10px]">
                          <Unlock className="w-2.5 h-2.5" />
                          {isVie ? 'HOẠT ĐỘNG' : 'ACTIVE'}
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
                              ? 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40 hover:bg-[#2F6B63]/20'
                              : 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40 hover:bg-[#A8321C]/20'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>
                            {user.isLockedOut
                              ? (isVie ? 'Gỡ phạt' : 'Lift Sanction')
                              : (isVie ? 'Xử phạt' : 'Apply Sanctions')}
                          </span>
                        </button>

                        {/* Edit Roles Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspect(user.id, 'roles');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A]/90 border border-[#221E1A]/10 transition-colors cursor-pointer"
                          title={isVie ? 'Sửa vai trò người dùng' : 'Edit User Roles'}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isVie ? 'Sửa vai trò' : 'Edit Roles'}</span>
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
      <div className="flex items-center justify-between pt-4 border-t border-[#221E1A]/10 text-xs">
        <div className="text-[#6E6459] text-[11px]">
          {isVie ? (
            <> Hiển thị trang <span className="text-[#241F1A] font-bold">{meta.page}</span> trên{' '}
              <span className="text-[#241F1A] font-bold">{Math.max(1, meta.totalPages)}</span>
              <span className="ml-1 text-[#6E6459]/70">({meta.totalCount} tài khoản)</span>
            </>
          ) : (
            <>
              Showing page <span className="text-[#241F1A] font-bold">{meta.page}</span> of{' '}
              <span className="text-[#241F1A] font-bold">{Math.max(1, meta.totalPages)}</span>
              <span className="ml-1 text-[#6E6459]/70">({meta.totalCount} accounts)</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1 || isLoading}
            onClick={() => onPageChange(meta.page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isVie ? 'Trước' : 'Previous'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg bg-[#F0E7D8] border border-[#221E1A]/10 text-[#241F1A] font-semibold text-xs">
            {isVie ? (
              <>
                Trang <span className="font-bold text-[#A8321C]">{meta.page}</span> / {Math.max(1, meta.totalPages)}
              </>
            ) : (
              <>
                Page <span className="font-bold text-[#A8321C]">{meta.page}</span> of {Math.max(1, meta.totalPages)}
              </>
            )}
          </span>

          <button
            type="button"
            disabled={meta.page >= meta.totalPages || isLoading}
            onClick={() => onPageChange(meta.page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <span>{isVie ? 'Sau' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserTable;
