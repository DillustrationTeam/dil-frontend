'use client';

import React from 'react';
import { Loader2, UserCheck, X } from 'lucide-react';
import {
  ApplyUserSanctionRequest,
  UserAdminDetailDto,
} from '@/features/admin/types/user-management.types';
import { UserDetailCard } from './user-detail-card';
import { UserActionPanel } from './user-action-panel';

export interface UserInspectionSectionProps {
  user: UserAdminDetailDto | null;
  activeActionMode: 'sanction' | 'roles';
  onActionModeChange: (mode: 'sanction' | 'roles') => void;
  isLoading: boolean;
  isSanctionSubmitting: boolean;
  isRolesSubmitting: boolean;
  onApplySanction: (
    userId: string,
    payload: ApplyUserSanctionRequest
  ) => Promise<boolean>;
  onUpdateRoles: (userId: string, roles: string[]) => Promise<boolean>;
  onClose?: () => void;
}

export function UserInspectionSection({
  user,
  activeActionMode,
  onActionModeChange,
  isLoading,
  isSanctionSubmitting,
  isRolesSubmitting,
  onApplySanction,
  onUpdateRoles,
  onClose,
}: UserInspectionSectionProps) {
  if (isLoading && !user) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        <p className="font-h1 font-bold text-white text-sm">
          Loading User Account Details...
        </p>
        <p className="text-xs text-[#8A8FA9]">
          Retrieving wallet balances and sanction history.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-10 flex flex-col items-center justify-center text-center space-y-3">
        <UserCheck className="w-10 h-10 text-[#8A8FA9]/40" />
        <p className="font-h1 font-bold text-white text-base">
          No User Selected for Inspection
        </p>
        <p className="text-xs text-[#8A8FA9] max-w-md">
          Click any user row or action button in the table above to review their detailed profile, wallet funds, and execute sanction or role assignment actions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Console Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-h1 font-bold text-lg text-white">
          Account Governance Console
        </h2>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[#8A8FA9] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Collapse Panel</span>
          </button>
        )}
      </div>

      {/* Grid: Left Column User Detail (7 cols), Right Column Actions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: User Detail, Wallet, and Sanction History */}
        <div className="lg:col-span-7">
          <UserDetailCard user={user} />
        </div>

        {/* RIGHT COLUMN: Action Panel (Apply Sanction / Edit Roles) */}
        <div className="lg:col-span-5">
          <UserActionPanel
            user={user}
            activeMode={activeActionMode}
            onModeChange={onActionModeChange}
            isSanctionSubmitting={isSanctionSubmitting}
            isRolesSubmitting={isRolesSubmitting}
            onApplySanction={onApplySanction}
            onUpdateRoles={onUpdateRoles}
          />
        </div>
      </div>
    </div>
  );
}

export default UserInspectionSection;
