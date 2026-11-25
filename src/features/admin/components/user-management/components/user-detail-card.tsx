'use client';

import React from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';
import { UserAdminDetailDto } from '@/features/admin/types/user-management.types';
import { useLanguage } from '@/context/language-context';

export interface UserDetailCardProps {
  user: UserAdminDetailDto;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getSanctionBadge(actionType: string, isVie: boolean) {
  switch (actionType.toLowerCase()) {
    case 'ban':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#A8321C]/20 text-[#A8321C] border border-[#A8321C]/40 text-[10px] font-bold">
          <Lock className="w-2.5 h-2.5" />
          {isVie ? 'Cấm vĩnh viễn' : 'Permanent Ban'}
        </span>
      );
    case 'suspend':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40 text-[10px] font-bold">
          <Clock className="w-2.5 h-2.5" />
          {isVie ? 'Tạm đình chỉ' : 'Suspension'}
        </span>
      );
    case 'warn':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40 text-[10px] font-bold">
          <AlertTriangle className="w-2.5 h-2.5" />
          {isVie ? 'Cảnh cáo' : 'Warning'}
        </span>
      );
    case 'unban':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40 text-[10px] font-bold">
          <Unlock className="w-2.5 h-2.5" />
          {isVie ? 'Gỡ phạt' : 'Lift Sanction'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0E7D8] text-[#241F1A]/80 text-[10px] font-bold">
          {actionType}
        </span>
      );
  }
}

export function UserDetailCard({ user }: UserDetailCardProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const isPermanentBan = user.isLockedOut && user.lockoutEnd && new Date(user.lockoutEnd).getFullYear() > 2050;

  return (
    <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-6">
      {/* 1. Profile Header Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-[#221E1A]/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border select-none ${
              user.isLockedOut
                ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40'
                : 'bg-[#F0E7D8] text-[#241F1A] border-[#221E1A]/20'
            }`}
          >
            {user.userName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#241F1A] font-h1">
                @{user.userName}
              </h3>
              {user.isVerified && (
                <span className="text-[10px] text-[#2F6B63] font-bold bg-[#2F6B63]/10 px-2 py-0.5 rounded-full border border-[#2F6B63]/30">
                  {isVie ? 'Đã xác minh' : 'Verified'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6E6459]">
              {user.fullName || (isVie ? 'Chưa đặt tên hiển thị' : 'No display name')}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {user.isLockedOut ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                isPermanentBan
                  ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40'
                  : 'bg-[#8A6A1F]/20 text-[#8A6A1F] border-[#8A6A1F]/40'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {isPermanentBan ? (isVie ? 'BỊ CẤM' : 'BANNED') : (isVie ? 'TẠM KHÓA' : 'SUSPENDED')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40 text-xs font-bold">
              <Unlock className="w-3.5 h-3.5" />
              {isVie ? 'HOẠT ĐỘNG' : 'ACTIVE'}
            </span>
          )}
        </div>
      </div>

      {/* 2. User Info Attributes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> Email
          </span>
          <p className="font-semibold text-[#241F1A] truncate">{user.email}</p>
        </div>

        <div className="p-3 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> {isVie ? 'Số điện thoại' : 'Phone Number'}
          </span>
          <p className="font-semibold text-[#241F1A]">
            {user.phoneNumber || (isVie ? 'Chưa cung cấp' : 'Not provided')}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> {isVie ? 'Ngày đăng ký' : 'Registered Date'}
          </span>
          <p className="font-semibold text-[#241F1A]">
            {new Date(user.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
            <User className="w-3 h-3" /> {isVie ? 'Mã người dùng' : 'User ID'}
          </span>
          <p className="font-mono text-[11px] text-[#241F1A]/70 truncate">{user.id}</p>
        </div>
      </div>

      {/* 3. Financial Wallet Overview Card */}
      <div className="p-4 rounded-2xl bg-[#2F6B63]/5 border border-[#2F6B63]/30 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#2F6B63] flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {isVie ? 'Ví & Ký quỹ Nền tảng' : 'Wallet & Platform Escrow'}
          </h4>
          <span className="text-[10px] font-mono text-[#2F6B63] font-bold px-2 py-0.5 rounded bg-[#2F6B63]/10">
            {user.wallet?.currency || 'VND'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-[#6E6459] uppercase font-bold">
              {isVie ? 'Số dư khả dụng' : 'Available Balance'}
            </span>
            <p className="text-lg font-bold text-[#241F1A] font-mono">
              {formatVnd(user.wallet?.balance ?? 0)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-[#6E6459] uppercase font-bold">
              {isVie ? 'Tạm giữ / Ký quỹ' : 'Locked / Escrow'}
            </span>
            <p className="text-lg font-bold text-[#8A6A1F] font-mono">
              {formatVnd(user.wallet?.lockedBalance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Sanctions & Disciplinary History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#241F1A] flex items-center gap-2 font-h1">
            <History className="w-4 h-4 text-[#A8321C]" />
            {isVie ? 'Lịch sử Xử lý & Vi phạm' : 'Sanctions & Disciplinary History'}
          </h4>
          <span className="text-[10px] text-[#6E6459]">
            {isVie ? `${user.sanctionsHistory.length} vi phạm` : `${user.sanctionsHistory.length} incident(s)`}
          </span>
        </div>

        {user.sanctionsHistory.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 text-center text-xs text-[#6E6459] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2F6B63]" />
            <span>
              {isVie
                ? 'Hồ sơ sạch. Tài khoản chưa có vi phạm hoặc cảnh cáo nào.'
                : 'Clean record. No prior sanctions or warnings on this account.'}
            </span>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {user.sanctionsHistory.map((sanc) => (
              <div
                key={sanc.id}
                className="p-3 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSanctionBadge(sanc.actionType, isVie)}
                    {sanc.durationDays && (
                      <span className="text-[10px] text-[#6E6459]">
                        ({isVie ? `${sanc.durationDays} ngày` : `${sanc.durationDays} days`})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6E6459]">
                    {new Date(sanc.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <p className="text-[#241F1A]/90 text-[11px] leading-relaxed pt-0.5">
                  {sanc.reason}
                </p>

                <div className="text-[10px] text-[#6E6459] flex items-center justify-between pt-1 border-t border-[#221E1A]/10">
                  <span>
                    {isVie
                      ? `Người xử lý: ${sanc.actionByAdminName || 'Quản trị viên'}`
                      : `Issued by: ${sanc.actionByAdminName || 'Administrator'}`}
                  </span>
                  {sanc.expiresAt && (
                    <span>
                      {isVie
                        ? `Hết hạn: ${new Date(sanc.expiresAt).toLocaleDateString('vi-VN')}`
                        : `Expires: ${new Date(sanc.expiresAt).toLocaleDateString('vi-VN')}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDetailCard;
