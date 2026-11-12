'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Send,
  Search,
  UserPlus,
  Users,
  Crown,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { juryService } from '../../../services/jury.service';
import type { InvitationCandidateItem } from '../../../types/jury.types';

interface InviteJuryCardProps {
  eventId: string;
  onInviteSent?: (email: string, isHeadJury?: boolean) => Promise<boolean> | boolean | void;
  isJudgingPhaseActive?: boolean;
  refreshKey?: number;
  hasHeadJury?: boolean;
}

type CandidateFilter = 'All' | 'Creator' | 'Eligible';

export function InviteJuryCard({
  eventId,
  onInviteSent,
  isJudgingPhaseActive = false,
  refreshKey = 0,
  hasHeadJury = false,
}: InviteJuryCardProps) {
  const [candidates, setCandidates] = useState<InvitationCandidateItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<CandidateFilter>('All');
  const [page, setPage] = useState(1);
  const [inviteAsHeadJury, setInviteAsHeadJury] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pageSize = 8;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [eventId, roleFilter]);

  const fetchCandidates = useCallback(async () => {
    if (!eventId) {
      setCandidates([]);
      setTotalCount(0);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await juryService.getInvitationCandidates(eventId, {
        search: debouncedSearch,
        roleFilter,
        page,
        pageSize,
      });
      setCandidates(res.items);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load candidate users.';
      setLoadError(msg);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, debouncedSearch, roleFilter, page, refreshKey]);

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    if (hasHeadJury && inviteAsHeadJury) {
      setInviteAsHeadJury(false);
    }
  }, [hasHeadJury, inviteAsHeadJury]);

  const handleInviteCandidate = async (candidate: InvitationCandidateItem) => {
    if (isJudgingPhaseActive) {
      toast.error('Cannot send jury invitation once the judging phase has started.');
      return;
    }
    if (!candidate.email) {
      toast.error('This user account does not have an email address.');
      return;
    }

    setInvitingUserId(candidate.userId);
    try {
      if (onInviteSent) {
        const result = await onInviteSent(candidate.email, inviteAsHeadJury);
        if (result !== false) {
          await fetchCandidates();
        }
      }
    } finally {
      setInvitingUserId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <aside className="glass-container rounded-2xl p-5 sm:p-6 h-fit border border-white/10 bg-[#161926]/90 backdrop-blur-xl flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-5 h-5 text-brand-periwinkle" />
          <h2 className="text-xl font-bold font-h1 text-on-surface">Invite Jury Member</h2>
        </div>
        <p className="text-xs text-outline leading-relaxed">
          Browse verified Creators or search platform accounts by name or email to send an invitation directly.
        </p>
      </div>

      {/* Role to Invite Toggle */}
      <div className="rounded-xl border border-white/10 bg-[#090b12]/60 p-2.5 flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Invitation Role
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setInviteAsHeadJury(false)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              !inviteAsHeadJury
                ? 'border-brand-periwinkle bg-brand-periwinkle/20 text-white'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-brand-periwinkle" />
            Jury
          </button>
          <button
            type="button"
            disabled={hasHeadJury}
            onClick={() => setInviteAsHeadJury(true)}
            title={hasHeadJury ? 'This event already has a Head Jury' : 'Invite as Head Jury'}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
              hasHeadJury
                ? 'border-white/5 bg-white/[0.02] text-slate-600 cursor-not-allowed'
                : inviteAsHeadJury
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 cursor-pointer'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            Head Jury
          </button>
        </div>
      </div>

      {/* Search + Role Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username or email..."
            className="w-full h-9 pl-8 pr-8 rounded-xl border border-white/10 bg-[#090b12]/70 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: 'All', label: 'All Users' },
            { id: 'Creator', label: 'Creators' },
            { id: 'Eligible', label: 'Available to Invite' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                roleFilter === tab.id
                  ? 'border-brand-periwinkle/50 bg-brand-periwinkle/20 text-white'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Directory List */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Users className="w-5 h-5 text-brand-periwinkle animate-pulse" />
            <span>Loading platform users...</span>
          </div>
        ) : loadError ? (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loadError}</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-10 text-center text-xs text-outline border border-dashed border-white/10 rounded-xl px-3">
            No matching users found for this filter.
          </div>
        ) : (
          candidates.map((candidate) => {
            const isCreator = candidate.roles.some((r) => r.toLowerCase() === 'creator') && candidate.hasCreatorProfile;
            const isInviting = invitingUserId === candidate.userId;

            return (
              <div
                key={candidate.userId}
                className="rounded-xl border border-white/10 bg-[#090b12]/60 p-3 flex flex-col gap-2 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">
                        {candidate.displayName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          isCreator
                            ? 'bg-brand-periwinkle/15 text-brand-periwinkle border-brand-periwinkle/30'
                            : 'bg-slate-800/80 text-slate-400 border-white/10'
                        }`}
                      >
                        {isCreator ? 'Creator' : candidate.roles[0] || 'Client'}
                      </span>
                    </div>
                    {candidate.email && (
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {candidate.email}
                      </p>
                    )}
                  </div>

                  {candidate.isAlreadyJury ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Jury
                    </span>
                  ) : candidate.hasPendingInvitation ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-300 shrink-0">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isJudgingPhaseActive || isInviting || !eventId}
                      onClick={() => void handleInviteCandidate(candidate)}
                      title={candidate.ineligibleReason || 'Send jury invitation'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        candidate.canInvite
                          ? 'bg-gradient-to-r from-[#a7acd9] to-[#7fd5e8] text-brand-navy hover:brightness-110 shadow-[0_0_12px_rgba(167,172,217,0.25)]'
                          : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Send className={`w-3 h-3 ${isInviting ? 'animate-spin' : ''}`} />
                      <span>{isInviting ? 'Sending...' : 'Invite'}</span>
                    </button>
                  )}
                </div>

                {candidate.ineligibleReason && !candidate.isAlreadyJury && !candidate.hasPendingInvitation && (
                  <p className="text-[10px] text-amber-300/90 leading-snug">
                    {candidate.ineligibleReason}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > pageSize && (
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Page <strong className="text-white">{page}</strong> / {totalPages} ({totalCount})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
