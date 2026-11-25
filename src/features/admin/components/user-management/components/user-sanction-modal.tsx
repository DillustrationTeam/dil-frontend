'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Clock,
  Ban,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  ApplyUserSanctionRequest,
  UserAdminListItemDto,
  UserSanctionActionType,
} from '@/features/admin/types/user-management.types';
import { useLanguage } from '@/context/language-context';

export interface UserSanctionModalProps {
  isOpen: boolean;
  user: UserAdminListItemDto | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (userId: string, payload: ApplyUserSanctionRequest) => Promise<boolean>;
}

export function UserSanctionModal({
  isOpen,
  user,
  isSubmitting,
  onClose,
  onSubmit,
}: UserSanctionModalProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const DURATION_PRESETS = [
    { label: isVie ? '3 Ngày' : '3 Days', days: 3 },
    { label: isVie ? '7 Ngày' : '7 Days', days: 7 },
    { label: isVie ? '14 Ngày' : '14 Days', days: 14 },
    { label: isVie ? '30 Ngày' : '30 Days', days: 30 },
  ];

  const [prevUserId, setPrevUserId] = useState(user?.id);
  const [prevIsLockedOut, setPrevIsLockedOut] = useState(user?.isLockedOut);

  const [actionType, setActionType] = useState<UserSanctionActionType>(() =>
    user?.isLockedOut ? 'Unban' : 'Suspend'
  );
  const [durationDays, setDurationDays] = useState<number>(7);
  const [reason, setReason] = useState(() =>
    user?.isLockedOut
      ? (isVie ? 'Người dùng đã hoàn thành xem xét / chấp thuận khiếu nại.' : 'User completed review / appeal granted.')
      : ''
  );
  const [customDays, setCustomDays] = useState('');

  const currentUserId = user?.id;
  const currentIsLockedOut = user?.isLockedOut;
  if (currentUserId !== prevUserId || currentIsLockedOut !== prevIsLockedOut) {
    setPrevUserId(currentUserId);
    setPrevIsLockedOut(currentIsLockedOut);
    setActionType(user?.isLockedOut ? 'Unban' : 'Suspend');
    setDurationDays(7);
    setReason(user?.isLockedOut ? 'User completed review / appeal granted.' : '');
    setCustomDays('');
  }

  if (!isOpen || !user) return null;

  const handleDurationPreset = (days: number) => {
    setDurationDays(days);
    setCustomDays('');
  };

  const handleCustomDaysChange = (val: string) => {
    setCustomDays(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDurationDays(parsed);
    }
  };

  const handleActionTypeChange = (type: UserSanctionActionType) => {
    setActionType(type);
    if (type === 'Unban' && !reason.trim()) {
      setReason('User completed review / appeal granted.');
    } else if (type !== 'Unban' && reason === 'User completed review / appeal granted.') {
      setReason('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDays = actionType === 'Suspend' ? durationDays : null;
    await onSubmit(user.id, {
      actionType,
      reason,
      durationDays: effectiveDays,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFFCF6] border border-[#221E1A]/10 rounded-[28px] max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#6E6459] hover:text-[#241F1A] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              actionType === 'Unban'
                ? 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40'
                : actionType === 'Warn'
                ? 'bg-[#8A6A1F]/20 text-[#8A6A1F] border-[#8A6A1F]/40'
                : 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40'
            }`}
          >
            {actionType === 'Unban' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : actionType === 'Warn' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#241F1A] font-h1">
              {actionType === 'Unban'
                ? (isVie ? 'Gỡ bỏ Chế tài & Mở khóa Người dùng' : 'Lift Sanctions & Unlock User')
                : (isVie ? 'Áp dụng Chế tài & Xử lý Vi phạm' : 'Apply Sanction & Penalty')}
            </h3>
            <p className="text-xs text-[#6E6459]">
              {isVie ? 'Tài khoản áp dụng:' : 'Target Account:'}{' '}
              <span className="text-[#241F1A] font-bold">@{user.userName}</span> ({user.email})
            </p>
          </div>
        </div>

        {/* Target User Current State Card */}
        <div className="p-3.5 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 flex items-center justify-between text-xs">
          <div>
            <span className="text-[#6E6459]">{isVie ? 'Trạng thái hiện tại:' : 'Current Status:'}</span>
            <span
              className={`ml-2 font-bold ${
                user.isLockedOut ? 'text-[#A8321C]' : 'text-[#2F6B63]'
              }`}
            >
              {user.isLockedOut
                ? (isVie ? 'Đang bị khóa / Tạm đình chỉ' : 'Locked Out / Suspended')
                : (isVie ? 'Tài khoản hoạt động' : 'Active Account')}
            </span>
          </div>
          <div>
            <span className="text-[#6E6459]">{isVie ? 'Vai trò:' : 'Roles:'}</span>
            <span className="ml-1 text-[#241F1A] font-semibold">{user.roles.join(', ')}</span>
          </div>
        </div>

        {/* Sanction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6E6459]">
              {isVie ? 'Hình thức Xử lý Kỷ luật' : 'Action Type'} <span className="text-[#A8321C]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10">
              <button
                type="button"
                onClick={() => handleActionTypeChange('Warn')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  actionType === 'Warn'
                    ? 'bg-[#8A6A1F]/12 text-[#F7F2E9] shadow-md'
                    : 'text-[#6E6459] hover:text-[#241F1A]'
                }`}
              >
                {isVie ? 'Cảnh cáo' : 'Warn'}
              </button>
              <button
                type="button"
                onClick={() => handleActionTypeChange('Suspend')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  actionType === 'Suspend'
                    ? 'bg-[#A8321C]/12 text-[#241F1A] shadow-md'
                    : 'text-[#6E6459] hover:text-[#241F1A]'
                }`}
              >
                {isVie ? 'Tạm khóa' : 'Suspend'}
              </button>
              <button
                type="button"
                onClick={() => handleActionTypeChange('Ban')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  actionType === 'Ban'
                    ? 'bg-[#A8321C]/12 text-[#241F1A] shadow-md'
                    : 'text-[#6E6459] hover:text-[#241F1A]'
                }`}
              >
                {isVie ? 'Cấm vĩnh viễn' : 'Ban'}
              </button>
              <button
                type="button"
                onClick={() => handleActionTypeChange('Unban')}
                disabled={!user.isLockedOut}
                title={
                  !user.isLockedOut
                    ? (isVie ? 'Tài khoản đang hoạt động (không bị khóa)' : 'Account is active (not locked out)')
                    : undefined
                }
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  actionType === 'Unban'
                    ? 'bg-[#2F6B63]/12 text-[#F7F2E9] shadow-md'
                    : 'text-[#6E6459] hover:text-[#241F1A]'
                } ${!user.isLockedOut ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isVie ? 'Gỡ phạt' : 'Unban'}
              </button>
            </div>
          </div>

          {/* Duration Selector (Only if ActionType = 'Suspend') */}
          {actionType === 'Suspend' && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-[#A8321C]/5 border border-[#A8321C]/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A8321C] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {isVie ? 'Thời hạn tạm khóa' : 'Suspension Duration'}
                </label>
                <span className="text-xs font-bold text-[#241F1A] font-mono">
                  {isVie ? `${durationDays} Ngày` : `${durationDays} Day${durationDays > 1 ? 's' : ''}`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => handleDurationPreset(preset.days)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      durationDays === preset.days && !customDays
                        ? 'bg-[#A8321C]/20 text-[#241F1A] border-[#A8321C]/40'
                        : 'bg-[#F0E7D8] text-[#6E6459] border-[#221E1A]/10 hover:text-[#241F1A]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-[#6E6459]">
                  {isVie ? 'Số ngày tùy chỉnh:' : 'Custom days:'}
                </span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder={isVie ? 'Ví dụ: 21' : 'e.g. 21'}
                  value={customDays}
                  onChange={(e) => handleCustomDaysChange(e.target.value)}
                  className="w-24 px-3 py-1 bg-[#F0E7D8] rounded-lg border border-[#221E1A]/10 text-[#241F1A] text-xs focus:outline-none focus:border-[#A8321C]/30"
                />
              </div>
            </div>
          )}

          {/* Action Explanations */}
          {actionType === 'Ban' && (
            <div className="p-3 rounded-xl bg-[#A8321C]/20 border border-[#A8321C]/40 text-xs text-[#A8321C] flex items-start gap-2">
              <Ban className="w-4 h-4 text-[#A8321C] shrink-0 mt-0.5" />
              <span>
                {isVie
                  ? 'Cấm vĩnh viễn sẽ hạn chế hoàn toàn người dùng này truy cập các tính năng, tạo đơn vẽ hoặc đăng nhập vào hệ thống.'
                  : 'Permanent Ban completely restricts this user from accessing platform features, initiating commissions, or logging in.'}
              </span>
            </div>
          )}

          {actionType === 'Warn' && (
            <div className="p-3 rounded-xl bg-[#8A6A1F]/20 border border-[#8A6A1F]/40 text-xs text-[#8A6A1F] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#8A6A1F] shrink-0 mt-0.5" />
              <span>
                {isVie
                  ? 'Thông báo cảnh cáo chính thức sẽ được ghi vào nhật ký xử phạt của người dùng mà không khóa tài khoản.'
                  : 'Official warning notice is logged to the user\'s permanent sanction audit trail without locking their account.'}
              </span>
            </div>
          )}

          {actionType === 'Unban' && (
            <div className="p-3 rounded-xl bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-xs text-[#2F6B63] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2F6B63] shrink-0 mt-0.5" />
              <span>
                {isVie
                  ? `Thao tác này sẽ gỡ bỏ hạn chế khóa và khôi phục trạng thái hoạt động cho @${user.userName}.`
                  : `This will lift lockout restrictions and restore active status for @${user.userName}.`}
              </span>
            </div>
          )}

          {/* Violation Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6E6459] flex justify-between">
              <span>
                {isVie ? 'Lý do Xử phạt / Vi phạm' : 'Violation / Action Reason'} <span className="text-[#A8321C]">*</span>
              </span>
              <span className="text-[11px] text-[#6E6459] font-normal">
                {reason.length}/300
              </span>
            </label>
            <textarea
              rows={3}
              required
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isVie
                  ? 'Chi tiết điều khoản vi phạm hoặc căn cứ áp dụng biện pháp này...'
                  : 'Detail the policy clause violated or rationale for this action...'
              }
              className="w-full px-3.5 py-2.5 bg-[#F0E7D8] rounded-xl border border-[#221E1A]/10 text-[#241F1A] placeholder-[#6E6459]/60 text-xs focus:outline-none focus:border-[#A8321C]/40 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#6E6459] hover:text-[#241F1A] hover:bg-[#FFFCF6] transition-colors cursor-pointer"
            >
              {isVie ? 'Hủy' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center gap-2 ${
                actionType === 'Unban'
                  ? 'bg-[#2F6B63]/12 hover:bg-[#2F6B63]/10 text-[#F7F2E9]'
                  : actionType === 'Warn'
                  ? 'bg-[#8A6A1F]/12 hover:bg-[#8A6A1F]/10 text-[#F7F2E9]'
                  : 'bg-[#A8321C]/12 hover:bg-[#A8321C]/10 text-[#241F1A] shadow-[#A8321C]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <span>{isVie ? 'Đang xử lý...' : 'Processing...'}</span>
              ) : (
                <span>
                  {actionType === 'Unban'
                    ? (isVie ? 'Xác nhận Khôi phục Tài khoản' : 'Confirm Restore Account')
                    : actionType === 'Warn'
                    ? (isVie ? 'Gửi Cảnh cáo Chính thức' : 'Issue Official Warning')
                    : actionType === 'Suspend'
                    ? (isVie ? `Thực thi Tạm khóa ${durationDays} Ngày` : `Issue ${durationDays}-Day Suspension`)
                    : (isVie ? 'Xác nhận Cấm Vĩnh viễn' : 'Confirm Permanent Ban')}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserSanctionModal;
