'use client';

import React, { useState } from 'react';
import {
  Clock,
  Ban,
  AlertTriangle,
  CheckCircle2,
  Check,
  ShoppingBag,
  Palette,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import {
  ApplyUserSanctionRequest,
  UserAdminDetailDto,
  UserSanctionActionType,
} from '@/features/admin/types/user-management.types';
import { useLanguage } from '@/context/language-context';

export interface UserActionPanelProps {
  user: UserAdminDetailDto;
  activeMode: 'sanction' | 'roles';
  onModeChange?: (mode: 'sanction' | 'roles') => void;
  isSanctionSubmitting: boolean;
  isRolesSubmitting: boolean;
  onApplySanction: (
    userId: string,
    payload: ApplyUserSanctionRequest
  ) => Promise<boolean>;
  onUpdateRoles: (userId: string, roles: string[]) => Promise<boolean>;
}

export function UserActionPanel({
  user,
  activeMode,
  isSanctionSubmitting,
  isRolesSubmitting,
  onApplySanction,
  onUpdateRoles,
}: UserActionPanelProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const DURATION_PRESETS = [
    { label: isVie ? '3 Ngày' : '3 Days', days: 3 },
    { label: isVie ? '7 Ngày' : '7 Days', days: 7 },
    { label: isVie ? '14 Ngày' : '14 Days', days: 14 },
    { label: isVie ? '30 Ngày' : '30 Days', days: 30 },
  ];

  const AVAILABLE_ROLES = [
    {
      id: 'Client',
      name: isVie ? 'Khách hàng' : 'Client',
      badge: 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40',
      icon: <ShoppingBag className="w-3.5 h-3.5 text-[#2F6B63]" />,
      description: isVie
        ? 'Duyệt tác phẩm, đặt vẽ tranh, nạp tiền ký quỹ.'
        : 'Browse artworks, request commissions, deposit escrow funds.',
    },
    {
      id: 'Creator',
      name: isVie ? 'Họa sĩ' : 'Creator',
      badge: 'bg-[#2C6A86]/20 text-[#2C6A86] border-[#2C6A86]/40',
      icon: <Palette className="w-3.5 h-3.5 text-[#2C6A86]" />,
      description: isVie
        ? 'Đăng tải tranh, nhận đơn đặt vẽ, quản lý rút tiền.'
        : 'Publish illustrations, accept commission orders, manage payouts.',
    },
    {
      id: 'Moderator',
      name: isVie ? 'Kiểm duyệt viên' : 'Moderator',
      badge: 'bg-[#5F3F86]/20 text-[#5F3F86] border-[#5F3F86]/40',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#5F3F86]" />,
      description: isVie
        ? 'Kiểm duyệt nội dung gắn cờ, đánh giá điểm AI, phân xử khiếu nại.'
        : 'Review flagged content, evaluate AI moderation scores, arbitrate disputes.',
    },
    {
      id: 'Administrator',
      name: isVie ? 'Quản trị viên' : 'Administrator',
      badge: 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40',
      icon: <Shield className="w-3.5 h-3.5 text-[#A8321C]" />,
      description: isVie
        ? 'Quản trị toàn diện: chính sách phí, xử phạt người dùng, chỉ số hệ thống.'
        : 'Full governance: fee policies, user sanctions, system overview KPIs.',
    },
  ];

  // Track previous user state to sync form state without an effect (React 19 / Next.js recommended pattern)
  const [prevUserId, setPrevUserId] = useState(user.id);
  const [prevIsLockedOut, setPrevIsLockedOut] = useState(user.isLockedOut);
  const [prevRolesKey, setPrevRolesKey] = useState(() => user.roles.join(','));

  // Sanction form state
  const [actionType, setActionType] = useState<UserSanctionActionType>(() =>
    user.isLockedOut ? 'Unban' : 'Suspend'
  );
  const [durationDays, setDurationDays] = useState<number>(7);
  const [customDays, setCustomDays] = useState('');
  const [reason, setReason] = useState(() =>
    user.isLockedOut
      ? (isVie ? 'Người dùng đã hoàn thành xem xét / chấp thuận khiếu nại.' : 'User completed review / appeal granted.')
      : ''
  );

  // Roles form state
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => [...user.roles]);

  // Adjust state during render when user identity or lockout status changes
  const currentRolesKey = user.roles.join(',');
  if (user.id !== prevUserId || user.isLockedOut !== prevIsLockedOut) {
    setPrevUserId(user.id);
    setPrevIsLockedOut(user.isLockedOut);
    setPrevRolesKey(currentRolesKey);
    setActionType(user.isLockedOut ? 'Unban' : 'Suspend');
    setDurationDays(7);
    setCustomDays('');
    setReason(user.isLockedOut ? 'User completed review / appeal granted.' : '');
    setSelectedRoles([...user.roles]);
  } else if (currentRolesKey !== prevRolesKey) {
    setPrevRolesKey(currentRolesKey);
    setSelectedRoles([...user.roles]);
  }

  const handleActionTypeChange = (type: UserSanctionActionType) => {
    setActionType(type);
    if (type === 'Unban' && !reason.trim()) {
      setReason('User completed review / appeal granted.');
    } else if (type !== 'Unban' && reason === 'User completed review / appeal granted.') {
      setReason('');
    }
  };

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

  const handleSanctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDays = actionType === 'Suspend' ? durationDays : null;
    const success = await onApplySanction(user.id, {
      actionType,
      reason,
      durationDays: effectiveDays,
    });
    if (success && actionType !== 'Unban') {
      setReason('');
    }
  };

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length === 1) return;
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return;
    await onUpdateRoles(user.id, selectedRoles);
  };

  return (
    <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-5 flex flex-col justify-between h-full">
      <div className="space-y-5">
        {/* Header: Displays solely Apply Sanction or Edit Role centered in the middle */}
        <div className="pb-3 border-b border-[#221E1A]/10 flex items-center justify-center text-center">
          <h3 className="font-h1 font-bold text-[#241F1A] text-base">
            {activeMode === 'sanction'
              ? (isVie ? 'Áp dụng Chế tài Xử phạt' : 'Apply Sanction')
              : (isVie ? 'Chỉnh sửa Phân quyền' : 'Edit Role')}
          </h3>
        </div>

        {/* 1. APPLY SANCTION MODE */}
        {activeMode === 'sanction' && (
          <form onSubmit={handleSanctionSubmit} className="space-y-4">
            {/* Action Type Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6E6459]">
                {isVie ? 'Hình thức Xử lý Kỷ luật' : 'Disciplinary Action Type'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10">
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Warn')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    actionType === 'Warn'
                      ? 'sanction-theme-warn'
                      : 'text-[#6E6459] hover:text-[#241F1A] border border-transparent'
                  }`}
                >
                  {isVie ? 'Cảnh cáo' : 'Warn'}
                </button>
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Suspend')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    actionType === 'Suspend'
                      ? 'sanction-theme-suspend'
                      : 'text-[#6E6459] hover:text-[#241F1A] border border-transparent'
                  }`}
                >
                  {isVie ? 'Tạm khóa' : 'Suspend'}
                </button>
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Ban')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    actionType === 'Ban'
                      ? 'sanction-theme-ban'
                      : 'text-[#6E6459] hover:text-[#241F1A] border border-transparent'
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
                  className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                    actionType === 'Unban'
                      ? 'sanction-theme-unban'
                      : 'text-[#6E6459] hover:text-[#241F1A] border border-transparent'
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
                    {isVie ? 'Thời hạn tạm khóa' : 'Suspension Length'}
                  </label>
                  <span className="text-xs font-bold text-[#241F1A] font-mono">
                    {isVie ? `${durationDays} Ngày` : `${durationDays} Days`}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handleDurationPreset(preset.days)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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

            {/* Explanatory Banner */}
            {actionType === 'Ban' && (
              <div className="p-3 rounded-xl bg-[#A8321C]/20 border border-[#A8321C]/40 text-xs text-[#A8321C] flex items-start gap-2">
                <Ban className="w-4 h-4 text-[#A8321C] shrink-0 mt-0.5" />
                <span>
                  {isVie
                    ? 'Cấm vĩnh viễn sẽ khóa tài khoản này vô thời hạn và thu hồi toàn bộ quyền truy cập sàn.'
                    : 'Permanent Ban locks this user indefinitely and revokes all marketplace access.'}
                </span>
              </div>
            )}

            {actionType === 'Warn' && (
              <div className="p-3 rounded-xl bg-[#8A6A1F]/20 border border-[#8A6A1F]/40 text-xs text-[#8A6A1F] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#8A6A1F] shrink-0 mt-0.5" />
                <span>
                  {isVie
                    ? 'Gửi cảnh cáo vi phạm chính thức được ghi vào lịch sử người dùng mà không giới hạn tài khoản.'
                    : 'Issues a formal misconduct warning recorded to user history without restricting account.'}
                </span>
              </div>
            )}

            {actionType === 'Unban' && (
              <div className="p-3 rounded-xl bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-xs text-[#2F6B63] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2F6B63] shrink-0 mt-0.5" />
                <span>
                  {isVie
                    ? 'Khôi phục trạng thái hoạt động và gỡ bỏ toàn bộ hạn chế khóa tài khoản cho người dùng này.'
                    : 'Restores active status and removes all lockout restrictions for this user.'}
                </span>
              </div>
            )}

            {/* Violation Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6E6459] flex justify-between">
                <span>
                  {isVie ? 'Lý do Vi phạm' : 'Violation Reason'} <span className="text-[#A8321C]">*</span>
                </span>
                <span className="text-[11px] text-[#6E6459]">{reason.length}/300</span>
              </label>
              <textarea
                rows={3}
                required
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isVie
                    ? 'Nêu rõ điều khoản vi phạm hoặc căn cứ áp dụng biện pháp xử phạt này...'
                    : 'State the terms violation or rationale for this action...'
                }
                className="w-full px-3.5 py-2.5 bg-[#F0E7D8] rounded-xl border border-[#221E1A]/10 text-[#241F1A] placeholder-[#6E6459]/60 text-xs focus:outline-none focus:border-[#A8321C]/40 transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSanctionSubmitting || !reason.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                actionType === 'Unban'
                  ? 'sanction-theme-unban'
                  : actionType === 'Warn'
                  ? 'sanction-theme-warn'
                  : actionType === 'Suspend'
                  ? 'sanction-theme-suspend'
                  : 'sanction-theme-ban'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSanctionSubmitting ? (
                <span>{isVie ? 'Đang xử lý...' : 'Processing Action...'}</span>
              ) : (
                <span>
                  {actionType === 'Unban'
                    ? (isVie ? 'Xác nhận Gỡ phạt' : 'Confirm Lift Sanctions')
                    : actionType === 'Warn'
                    ? (isVie ? 'Gửi Thông báo Cảnh cáo' : 'Issue Warning Notice')
                    : actionType === 'Suspend'
                    ? (isVie ? `Thực thi Tạm khóa ${durationDays} Ngày` : `Execute ${durationDays}-Day Suspension`)
                    : (isVie ? 'Thực thi Cấm Vĩnh viễn' : 'Execute Permanent Ban')}
                </span>
              )}
            </button>
          </form>
        )}

        {/* 2. EDIT ROLE MODE */}
        {activeMode === 'roles' && (
          <form onSubmit={handleRolesSubmit} className="space-y-3.5">
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((role) => {
                const isChecked = selectedRoles.includes(role.id);

                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start gap-2.5 select-none ${
                      isChecked
                        ? 'bg-[#FFFCF6] border-[#A8321C]/40 shadow-sm'
                        : 'bg-[#F0E7D8] border-[#221E1A]/10 hover:border-[#221E1A]/10'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-[#A8321C]/12 border-[#A8321C]/30 text-[#241F1A]'
                          : 'border-[#221E1A]/20 bg-[#F0E7D8]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {role.icon}
                          <span className="font-bold text-[#241F1A] text-xs">{role.name}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${role.badge}`}
                        >
                          {role.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6E6459] leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-[#6E6459]/70 italic">
              {isVie
                ? '* Mỗi tài khoản phải giữ ít nhất một vai trò.'
                : '* Every account must hold at least one role.'}
            </p>

            {/* Save Roles Button */}
            <button
              type="submit"
              disabled={isRolesSubmitting || selectedRoles.length === 0}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#A8321C]/12 hover:bg-[#A8321C]/10 text-[#241F1A] shadow-lg shadow-[#A8321C] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRolesSubmitting
                ? (isVie ? 'Đang lưu vai trò...' : 'Saving Roles...')
                : (isVie ? 'Lưu Phân quyền Vai trò' : 'Save Role Assignment')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserActionPanel;
