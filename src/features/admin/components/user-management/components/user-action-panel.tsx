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

const DURATION_PRESETS = [
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

const AVAILABLE_ROLES = [
  {
    id: 'Client',
    name: 'Client',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />,
    description: 'Browse artworks, request commissions, deposit escrow funds.',
  },
  {
    id: 'Creator',
    name: 'Creator',
    badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    icon: <Palette className="w-3.5 h-3.5 text-sky-400" />,
    description: 'Publish illustrations, accept commission orders, manage payouts.',
  },
  {
    id: 'Moderator',
    name: 'Moderator',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
    description: 'Review flagged content, evaluate AI moderation scores, arbitrate disputes.',
  },
  {
    id: 'Administrator',
    name: 'Administrator',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <Shield className="w-3.5 h-3.5 text-red-400" />,
    description: 'Full governance: fee policies, user sanctions, system overview KPIs.',
  },
];

export function UserActionPanel({
  user,
  activeMode,
  isSanctionSubmitting,
  isRolesSubmitting,
  onApplySanction,
  onUpdateRoles,
}: UserActionPanelProps) {
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
    user.isLockedOut ? 'User completed review / appeal granted.' : ''
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
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-5 flex flex-col justify-between h-full">
      <div className="space-y-5">
        {/* Header: Displays solely Apply Sanction or Edit Role centered in the middle */}
        <div className="pb-3 border-b border-white/10 flex items-center justify-center text-center">
          <h3 className="font-h1 font-bold text-white text-base">
            {activeMode === 'sanction' ? 'Apply Sanction' : 'Edit Role'}
          </h3>
        </div>

        {/* 1. APPLY SANCTION MODE */}
        {activeMode === 'sanction' && (
          <form onSubmit={handleSanctionSubmit} className="space-y-4">
            {/* Action Type Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8A8FA9]">
                Disciplinary Action Type
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Warn')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    actionType === 'Warn'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-[#8A8FA9] hover:text-white'
                  }`}
                >
                  Warn
                </button>
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Suspend')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    actionType === 'Suspend'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-[#8A8FA9] hover:text-white'
                  }`}
                >
                  Suspend
                </button>
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Ban')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    actionType === 'Ban'
                      ? 'bg-red-700 text-white shadow-md'
                      : 'text-[#8A8FA9] hover:text-white'
                  }`}
                >
                  Ban
                </button>
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('Unban')}
                  disabled={!user.isLockedOut}
                  title={!user.isLockedOut ? 'Account is active (not locked out)' : undefined}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    actionType === 'Unban'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-[#8A8FA9] hover:text-white'
                  } ${!user.isLockedOut ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Unban
                </button>
              </div>
            </div>

            {/* Duration Selector (Only if ActionType = 'Suspend') */}
            {actionType === 'Suspend' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Suspension Length
                  </label>
                  <span className="text-xs font-bold text-white font-mono">
                    {durationDays} Days
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
                          ? 'bg-red-500/30 text-white border-red-500/60'
                          : 'bg-black/30 text-[#8A8FA9] border-white/10 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-[#8A8FA9]">Custom days:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="e.g. 21"
                    value={customDays}
                    onChange={(e) => handleCustomDaysChange(e.target.value)}
                    className="w-24 px-3 py-1 bg-black/40 rounded-lg border border-white/10 text-white text-xs focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>
            )}

            {/* Explanatory Banner */}
            {actionType === 'Ban' && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-600/40 text-xs text-red-200 flex items-start gap-2">
                <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Permanent Ban locks this user indefinitely and revokes all marketplace access.
                </span>
              </div>
            )}

            {actionType === 'Warn' && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Issues a formal misconduct warning recorded to user history without restricting account.
                </span>
              </div>
            )}

            {actionType === 'Unban' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Restores active status and removes all lockout restrictions for this user.
                </span>
              </div>
            )}

            {/* Violation Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8A8FA9] flex justify-between">
                <span>
                  Violation Reason <span className="text-red-400">*</span>
                </span>
                <span className="text-[11px] text-[#8A8FA9]">{reason.length}/300</span>
              </label>
              <textarea
                rows={3}
                required
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the terms violation or rationale for this action..."
                className="w-full px-3.5 py-2.5 bg-black/40 rounded-xl border border-white/10 text-white placeholder-[#8A8FA9]/60 text-xs focus:outline-none focus:border-red-400/80 transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSanctionSubmitting || !reason.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                actionType === 'Unban'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : actionType === 'Warn'
                  ? 'bg-amber-500 hover:bg-amber-400 text-black'
                  : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSanctionSubmitting ? (
                <span>Processing Action...</span>
              ) : (
                <span>
                  {actionType === 'Unban'
                    ? 'Confirm Lift Sanctions'
                    : actionType === 'Warn'
                    ? 'Issue Warning Notice'
                    : actionType === 'Suspend'
                    ? `Execute ${durationDays}-Day Suspension`
                    : 'Execute Permanent Ban'}
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
                        ? 'bg-white/[0.08] border-red-500/40 shadow-sm'
                        : 'bg-black/30 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-white/20 bg-black/40'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {role.icon}
                          <span className="font-bold text-white text-xs">{role.name}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${role.badge}`}
                        >
                          {role.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8A8FA9] leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-[#8A8FA9]/70 italic">
              * Every account must hold at least one role.
            </p>

            {/* Save Roles Button */}
            <button
              type="submit"
              disabled={isRolesSubmitting || selectedRoles.length === 0}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRolesSubmitting ? 'Saving Roles...' : 'Save Role Assignment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserActionPanel;
