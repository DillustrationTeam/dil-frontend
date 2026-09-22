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
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
    description: 'Browse artworks, request commissions, deposit escrow funds.',
  },
  {
    id: 'Creator',
    name: 'Creator',
    badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    icon: <Palette className="w-4 h-4 text-sky-400" />,
    description: 'Publish illustrations, accept commission orders, manage payouts.',
  },
  {
    id: 'Moderator',
    name: 'Moderator',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
    description: 'Review flagged content, evaluate AI moderation scores, arbitrate disputes.',
  },
  {
    id: 'Administrator',
    name: 'Administrator',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <Shield className="w-4 h-4 text-red-400" />,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161926] border border-white/15 rounded-[28px] max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#8A8FA9] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/15 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-h1">Edit User Roles</h3>
            <p className="text-xs text-[#8A8FA9]">
              Assign system permissions for{' '}
              <span className="text-white font-bold">@{user.userName}</span>
            </p>
          </div>
        </div>

        {/* Role Toggles */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            {AVAILABLE_ROLES.map((role) => {
              const isChecked = selectedRoles.includes(role.id);

              return (
                <div
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-white/[0.08] border-red-500/40 shadow-sm'
                      : 'bg-black/30 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                      isChecked
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-white/20 bg-black/40'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {role.icon}
                        <span className="font-bold text-white text-xs">{role.name}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${role.badge}`}
                      >
                        {role.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8A8FA9] leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#8A8FA9]/70 italic">
            * Note: Every account must hold at least one assigned role.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#8A8FA9] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedRoles.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Role Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserRolesModal;
