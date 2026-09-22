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

export function UserDetailModal({
  isOpen,
  user,
  detail,
  isLoading,
  onClose,
}: UserDetailModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161926] border border-white/15 rounded-[28px] max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#8A8FA9] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-h1 font-bold text-sm shrink-0">
            {user.userName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-h1">
                @{activeData.userName}
              </h3>
              {activeData.isVerified && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A8FA9]">{activeData.fullName}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#8A8FA9]">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Loading complete user dossier...</p>
          </div>
        ) : (
          <>
            {/* User Profile Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email Address
                </span>
                <p className="font-semibold text-white truncate">{activeData.email}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Phone Number
                </span>
                <p className="font-semibold text-white">
                  {activeData.phoneNumber || 'Not provided'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Member Since
                </span>
                <p className="font-semibold text-white">
                  {new Date(activeData.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA9] flex items-center gap-1.5">
                  <User className="w-3 h-3" /> User Identifier
                </span>
                <p className="font-mono text-[11px] text-white/70 truncate">{activeData.id}</p>
              </div>
            </div>

            {/* Wallet & Balance Overview */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Account Financial Balance
                </h4>
                <span className="text-[10px] font-mono text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                  {activeData.wallet?.currency || 'VND'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] text-[#8A8FA9] uppercase font-bold">
                    Available Balance
                  </span>
                  <p className="text-lg font-bold text-white font-mono">
                    {formatVnd(activeData.wallet?.balance ?? 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#8A8FA9] uppercase font-bold">
                    Locked / Escrow In-Transit
                  </span>
                  <p className="text-lg font-bold text-amber-300 font-mono">
                    {formatVnd(activeData.wallet?.lockedBalance ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Sanctions & Violations History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 font-h1">
                  <History className="w-4 h-4 text-red-400" />
                  Disciplinary Sanctions History
                </h4>
                <span className="text-[10px] text-[#8A8FA9]">
                  {activeData.sanctionsHistory.length} incident(s) recorded
                </span>
              </div>

              {activeData.sanctionsHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-[#8A8FA9] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Clean record. No disciplinary sanctions have been issued to this account.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeData.sanctionsHistory.map((sanc) => (
                    <div
                      key={sanc.id}
                      className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs"
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
                          {new Date(sanc.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-white/90 text-[11px] leading-relaxed">
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
          </>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetailModal;
