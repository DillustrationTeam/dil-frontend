'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  ShoppingBag,
  Palette,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import {
  UserAdminListItemDto,
  UserAdminDetailDto,
} from '@/features/admin/types/user-management.types';

export interface UserRolesModalProps {
  isOpen: boolean;
  user: UserAdminListItemDto | UserAdminDetailDto | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (userId: string, roles: string[]) => Promise<boolean>;
}

const AVAILABLE_ROLES = [
  {
    id: 'Client',
    name: 'Client',
    badge: 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40',
    icon: <ShoppingBag className="w-4 h-4 text-[#2F6B63]" />,
    description: 'Browse artworks, request commissions, deposit escrow funds.',
  },
  {
    id: 'Creator',
    name: 'Creator',
    badge: 'bg-[#2C6A86]/20 text-[#2C6A86] border-[#2C6A86]/40',
    icon: <Palette className="w-4 h-4 text-[#2C6A86]" />,
    description: 'Publish illustrations, accept commission orders, manage payouts.',
  },
  {
    id: 'Moderator',
    name: 'Moderator',
    badge: 'bg-[#5F3F86]/20 text-[#5F3F86] border-[#5F3F86]/40',
    icon: <ShieldCheck className="w-4 h-4 text-[#5F3F86]" />,
    description: 'Review flagged content, evaluate AI moderation scores, arbitrate disputes.',
  },
  {
    id: 'Administrator',
    name: 'Administrator',
    badge: 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40',
    icon: <Shield className="w-4 h-4 text-[#A8321C]" />,
    description: 'Full governance: platform fee policies, user sanctioning, financial KPI analytics.',
  },
];

export function UserRolesModal({
  isOpen,
  user,
  isSubmitting,
  onClose,
  onSubmit,
}: UserRolesModalProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const availableRoles = [
    {
      id: 'Client',
      name: isVie ? 'Khách hàng' : 'Client',
      badge: 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40',
      icon: <ShoppingBag className="w-4 h-4 text-[#2F6B63]" />,
      description: isVie
        ? 'Khám phá tác phẩm, đặt vẽ hoa hồng, nạp tiền ký quỹ.'
        : 'Browse artworks, request commissions, deposit escrow funds.',
    },
    {
      id: 'Creator',
      name: isVie ? 'Tác giả' : 'Creator',
      badge: 'bg-[#2C6A86]/20 text-[#2C6A86] border-[#2C6A86]/40',
      icon: <Palette className="w-4 h-4 text-[#2C6A86]" />,
      description: isVie
        ? 'Đăng tải tranh, nhận đơn hoa hồng, quản lý rút tiền.'
        : 'Publish illustrations, accept commission orders, manage payouts.',
    },
    {
      id: 'Moderator',
      name: isVie ? 'Kiểm duyệt viên' : 'Moderator',
      badge: 'bg-[#5F3F86]/20 text-[#5F3F86] border-[#5F3F86]/40',
      icon: <ShieldCheck className="w-4 h-4 text-[#5F3F86]" />,
      description: isVie
        ? 'Kiểm duyệt nội dung bị gắn cờ, đánh giá điểm AI, xử lý khiếu nại/tranh chấp.'
        : 'Review flagged content, evaluate AI moderation scores, arbitrate disputes.',
    },
    {
      id: 'Administrator',
      name: isVie ? 'Quản trị viên' : 'Administrator',
      badge: 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40',
      icon: <Shield className="w-4 h-4 text-[#A8321C]" />,
      description: isVie
        ? 'Toàn quyền quản trị: chính sách biểu phí, xử phạt người dùng, phân tích tài chính.'
        : 'Full governance: platform fee policies, user sanctioning, financial KPI analytics.',
    },
  ];

  const [prevUserId, setPrevUserId] = useState(user?.id);
  const [prevRolesKey, setPrevRolesKey] = useState(() => user?.roles?.join(',') ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => (user ? [...user.roles] : []));

  const currentUserId = user?.id;
  const currentRolesKey = user?.roles?.join(',') ?? '';
  if (currentUserId !== prevUserId || currentRolesKey !== prevRolesKey) {
    setPrevUserId(currentUserId);
    setPrevRolesKey(currentRolesKey);
    setSelectedRoles(user ? [...user.roles] : []);
  }

  if (!isOpen || !user) return null;

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      // Prevent unselecting all roles
      if (selectedRoles.length === 1) return;
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return;
    await onSubmit(user.id, selectedRoles);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFFCF6] border border-[#221E1A]/10 rounded-[28px] max-w-md w-full p-6 space-y-5 shadow-2xl relative">
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
          <div className="w-10 h-10 rounded-2xl bg-[#F0E7D8] flex items-center justify-center text-[#241F1A] border border-[#221E1A]/10 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#241F1A] font-h1">
              {isVie ? 'Chỉnh sửa vai trò người dùng' : 'Edit User Roles'}
            </h3>
            <p className="text-xs text-[#6E6459]">
              {isVie ? 'Phân quyền hệ thống cho' : 'Assign system permissions for'}{' '}
              <span className="text-[#241F1A] font-bold">@{user.userName}</span>
            </p>
          </div>
        </div>

        {/* Role Toggles */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            {availableRoles.map((role) => {
              const isChecked = selectedRoles.includes(role.id);

              return (
                <div
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-[#FFFCF6] border-[#A8321C]/40 shadow-sm'
                      : 'bg-[#F0E7D8] border-[#221E1A]/10 hover:border-[#221E1A]/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                      isChecked
                        ? 'bg-[#A8321C]/12 border-[#A8321C]/30 text-[#241F1A]'
                        : 'border-[#221E1A]/20 bg-[#F0E7D8]'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {role.icon}
                        <span className="font-bold text-[#241F1A] text-xs">{role.name}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${role.badge}`}
                      >
                        {role.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6459] leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#6E6459]/70 italic">
            {isVie
              ? '* Lưu ý: Mỗi tài khoản phải giữ ít nhất một vai trò được phân công.'
              : '* Note: Every account must hold at least one assigned role.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E6459] hover:text-[#241F1A] hover:bg-[#FFFCF6] transition-colors cursor-pointer"
            >
              {isVie ? 'Hủy' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedRoles.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#A8321C]/12 hover:bg-[#A8321C]/10 text-[#241F1A] shadow-lg shadow-[#A8321C] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (isVie ? 'Đang lưu...' : 'Saving Changes...')
                : (isVie ? 'Lưu phân quyền' : 'Save Role Assignment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserRolesModal;
