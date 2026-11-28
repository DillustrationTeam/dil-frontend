'use client';

import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Wallet,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import {
  UserAdminDetailDto,
  UserAdminListItemDto,
} from '@/features/admin/types/user-management.types';
import { useLanguage } from '@/context/language-context';

export interface UserDetailModalProps {
  isOpen: boolean;
  user: UserAdminListItemDto | null;
  detail: UserAdminDetailDto | null;
  isLoading: boolean;
  onClose: () => void;
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

export function UserDetailModal({
  isOpen,
  user,
  detail,
  isLoading,
  onClose,
}: UserDetailModalProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  if (!isOpen || !user) return null;

  const activeData = detail || {
    id: user.id,
    email: user.email,
    userName: user.userName,
    fullName: user.fullName,
    phoneNumber: null,
    roles: user.roles,
    isVerified: user.isVerified,
    isLockedOut: user.isLockedOut,
    lockoutEnd: user.lockoutEnd,
    createdAt: user.createdAt,
    updatedAt: null,
    wallet: {
      balance: user.walletBalance,
      lockedBalance: user.walletLockedBalance,
      currency: 'VND',
    },
    sanctionsHistory: [],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFFCF6] border border-[#221E1A]/10 rounded-[28px] max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#A8321C]/20 text-[#A8321C] border border-[#A8321C]/40 flex items-center justify-center font-h1 font-bold text-sm shrink-0">
            {user.userName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#241F1A] font-h1">
                @{activeData.userName}
              </h3>
              {activeData.isVerified && (
                <span className="text-[10px] text-[#2F6B63] font-bold bg-[#2F6B63]/10 px-2 py-0.5 rounded-full border border-[#2F6B63]/30">
                  {isVie ? 'Đã xác minh' : 'Verified'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6E6459]">{activeData.fullName || (isVie ? 'Chưa đặt tên hiển thị' : 'No display name')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#6E6459]">
            <div className="w-6 h-6 border-2 border-[#A8321C]/30 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">{isVie ? 'Đang tải hồ sơ người dùng...' : 'Loading complete user dossier...'}</p>
          </div>
        ) : (
          <>
            {/* User Profile Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email Address
                </span>
                <p className="font-semibold text-[#241F1A] truncate">{activeData.email}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {isVie ? 'Số điện thoại' : 'Phone Number'}
                </span>
                <p className="font-semibold text-[#241F1A]">
                  {activeData.phoneNumber || (isVie ? 'Chưa cung cấp' : 'Not provided')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {isVie ? 'Ngày tham gia' : 'Member Since'}
                </span>
                <p className="font-semibold text-[#241F1A]">
                  {new Date(activeData.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6E6459] flex items-center gap-1.5">
                  <User className="w-3 h-3" /> {isVie ? 'Mã người dùng' : 'User Identifier'}
                </span>
                <p className="font-mono text-[11px] text-[#241F1A]/70 truncate">{activeData.id}</p>
              </div>
            </div>

            {/* Wallet & Balance Overview */}
            <div className="p-4 rounded-2xl bg-[#2F6B63]/5 border border-[#2F6B63]/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#2F6B63] flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {isVie ? 'Số dư Tài chính Tài khoản' : 'Account Financial Balance'}
                </h4>
                <span className="text-[10px] font-mono text-[#2F6B63] font-bold px-2 py-0.5 rounded bg-[#2F6B63]/10">
                  {activeData.wallet?.currency || 'VND'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] text-[#6E6459] uppercase font-bold">
                    {isVie ? 'Số dư khả dụng' : 'Available Balance'}
                  </span>
                  <p className="text-lg font-bold text-[#241F1A] font-mono">
                    {formatVnd(activeData.wallet?.balance ?? 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6459] uppercase font-bold">
                    {isVie ? 'Tạm giữ / Ký quỹ' : 'Locked / Escrow In-Transit'}
                  </span>
                  <p className="text-lg font-bold text-[#8A6A1F] font-mono">
                    {formatVnd(activeData.wallet?.lockedBalance ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Sanctions & Violations History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#241F1A] flex items-center gap-2 font-h1">
                  <History className="w-4 h-4 text-[#A8321C]" />
                  {isVie ? 'Lịch sử Xử lý & Vi phạm' : 'Disciplinary Sanctions History'}
                </h4>
                <span className="text-[10px] text-[#6E6459]">
                  {isVie ? `${activeData.sanctionsHistory.length} vi phạm ghi nhận` : `${activeData.sanctionsHistory.length} incident(s) recorded`}
                </span>
              </div>

              {activeData.sanctionsHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 text-center text-xs text-[#6E6459] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F6B63]" />
                  <span>
                    {isVie
                      ? 'Hồ sơ sạch. Tài khoản chưa có tiền án xử phạt hoặc cảnh cáo nào.'
                      : 'Clean record. No disciplinary sanctions have been issued to this account.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeData.sanctionsHistory.map((sanc) => (
                    <div
                      key={sanc.id}
                      className="p-3 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-1.5 text-xs"
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
                          {new Date(sanc.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-[#241F1A]/90 text-[11px] leading-relaxed">
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
          </>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F0E7D8] hover:bg-[#F0E7D8] text-[#241F1A] transition-colors cursor-pointer"
          >
            {isVie ? 'Đóng' : 'Close Dossier'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetailModal;
