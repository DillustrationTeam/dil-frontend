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

export interface UserSanctionModalProps {
  isOpen: boolean;
  user: UserAdminListItemDto | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (userId: string, payload: ApplyUserSanctionRequest) => Promise<boolean>;
}

const DURATION_PRESETS = [
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

export function UserSanctionModal({
  isOpen,
  user,
  isSubmitting,
  onClose,
  onSubmit,
}: UserSanctionModalProps) {
  const [prevUserId, setPrevUserId] = useState(user?.id);
  const [prevIsLockedOut, setPrevIsLockedOut] = useState(user?.isLockedOut);

  const [actionType, setActionType] = useState<UserSanctionActionType>(() =>
    user?.isLockedOut ? 'Unban' : 'Suspend'
  );
  const [durationDays, setDurationDays] = useState<number>(7);
  const [reason, setReason] = useState(() =>
    user?.isLockedOut ? 'User completed review / appeal granted.' : ''
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161926] border border-white/15 rounded-[28px] max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
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
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              actionType === 'Unban'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : actionType === 'Warn'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
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
            <h3 className="text-lg font-bold text-white font-h1">
              {actionType === 'Unban'
                ? 'Lift Sanctions & Unlock User'
                : 'Apply Sanction & Penalty'}
            </h3>
            <p className="text-xs text-[#8A8FA9]">
              Target Account:{' '}
              <span className="text-white font-bold">@{user.userName}</span> ({user.email})
            </p>
          </div>
        </div>

        {/* Target User Current State Card */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[#8A8FA9]">Current Status:</span>
            <span
              className={`ml-2 font-bold ${
                user.isLockedOut ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {user.isLockedOut ? 'Locked Out / Suspended' : 'Active Account'}
            </span>
          </div>
          <div>
            <span className="text-[#8A8FA9]">Roles:</span>
            <span className="ml-1 text-white font-semibold">{user.roles.join(', ')}</span>
          </div>
        </div>

        {/* Sanction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8A8FA9]">
              Action Type <span className="text-red-400">*</span>
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
                  Suspension Duration
                </label>
                <span className="text-xs font-bold text-white font-mono">
                  {durationDays} Day{durationDays > 1 ? 's' : ''}
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

          {/* Action Explanations */}
          {actionType === 'Ban' && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-600/40 text-xs text-red-200 flex items-start gap-2">
              <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                Permanent Ban completely restricts this user from accessing platform features, initiating commissions, or logging in.
              </span>
            </div>
          )}

          {actionType === 'Warn' && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Official warning notice is logged to the user&apos;s permanent sanction audit trail without locking their account.
              </span>
            </div>
          )}

          {actionType === 'Unban' && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                This will lift lockout restrictions and restore active status for @{user.userName}.
              </span>
            </div>
          )}

          {/* Violation Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8A8FA9] flex justify-between">
              <span>
                Violation / Action Reason <span className="text-red-400">*</span>
              </span>
              <span className="text-[11px] text-[#8A8FA9] font-normal">
                {reason.length}/300
              </span>
            </label>
            <textarea
              rows={3}
              required
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the policy clause violated or rationale for this action..."
              className="w-full px-3.5 py-2.5 bg-black/40 rounded-xl border border-white/10 text-white placeholder-[#8A8FA9]/60 text-xs focus:outline-none focus:border-red-400/80 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8A8FA9] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center gap-2 ${
                actionType === 'Unban'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : actionType === 'Warn'
                  ? 'bg-amber-500 hover:bg-amber-400 text-black'
                  : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <span>
                  {actionType === 'Unban'
                    ? 'Confirm Restore Account'
                    : actionType === 'Warn'
                    ? 'Issue Official Warning'
                    : actionType === 'Suspend'
                    ? `Issue ${durationDays}-Day Suspension`
                    : 'Confirm Permanent Ban'}
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
