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

function getSanctionBadge(actionType: string) {
  switch (actionType.toLowerCase()) {
    case 'ban':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
          <Lock className="w-2.5 h-2.5" />
          Permanent Ban
        </span>
      );
    case 'suspend':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
          <Clock className="w-2.5 h-2.5" />
          Suspension
        </span>
      );
    case 'warn':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-bold">
          <AlertTriangle className="w-2.5 h-2.5" />
          Warning
        </span>
      );
    case 'unban':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
          <Unlock className="w-2.5 h-2.5" />
          Lift Sanction
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
          {actionType}
        </span>
      );
  }
}

export function UserDetailCard({ user }: UserDetailCardProps) {
  const isPermanentBan = user.isLockedOut && user.lockoutEnd && new Date(user.lockoutEnd).getFullYear() > 2050;

  return (
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-6">
      {/* 1. Profile Header Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border select-none ${
              user.isLockedOut
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            {user.userName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-h1">
                @{user.userName}
              </h3>
              {user.isVerified && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A8FA9]">{user.fullName || 'No display name'}</p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {user.isLockedOut ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                isPermanentBan
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {isPermanentBan ? 'BANNED' : 'SUSPENDED'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Unlock className="w-3.5 h-3.5" />
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* 2. User Info Attributes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> Email
          </span>
          <p className="font-semibold text-white truncate">{user.email}</p>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Phone Number
          </span>
          <p className="font-semibold text-white">
            {user.phoneNumber || 'Not provided'}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Registered Date
          </span>
          <p className="font-semibold text-white">
            {new Date(user.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
            <User className="w-3 h-3" /> User ID
          </span>
          <p className="font-mono text-[11px] text-white/70 truncate">{user.id}</p>
        </div>
      </div>

      {/* 3. Financial Wallet Overview Card */}
      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet & Platform Escrow
          </h4>
          <span className="text-[10px] font-mono text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
            {user.wallet?.currency || 'VND'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-[#8A8FA9] uppercase font-bold">
              Available Balance
            </span>
            <p className="text-lg font-bold text-white font-mono">
              {formatVnd(user.wallet?.balance ?? 0)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-[#8A8FA9] uppercase font-bold">
              Locked / Escrow
            </span>
            <p className="text-lg font-bold text-amber-300 font-mono">
              {formatVnd(user.wallet?.lockedBalance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Sanctions & Disciplinary History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-2 font-h1">
            <History className="w-4 h-4 text-red-400" />
            Sanctions & Disciplinary History
          </h4>
          <span className="text-[10px] text-[#8A8FA9]">
            {user.sanctionsHistory.length} incident(s)
          </span>
        </div>

        {user.sanctionsHistory.length === 0 ? (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-[#8A8FA9] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Clean record. No prior sanctions or warnings on this account.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {user.sanctionsHistory.map((sanc) => (
              <div
                key={sanc.id}
                className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSanctionBadge(sanc.actionType)}
                    {sanc.durationDays && (
                      <span className="text-[10px] text-[#8A8FA9]">
                        ({sanc.durationDays} days)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8A8FA9]">
                    {new Date(sanc.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <p className="text-white/90 text-[11px] leading-relaxed pt-0.5">
                  {sanc.reason}
                </p>

                <div className="text-[10px] text-[#8A8FA9] flex items-center justify-between pt-1 border-t border-white/5">
                  <span>Issued by: {sanc.actionByAdminName || 'Administrator'}</span>
                  {sanc.expiresAt && (
                    <span>
                      Expires: {new Date(sanc.expiresAt).toLocaleDateString('vi-VN')}
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
