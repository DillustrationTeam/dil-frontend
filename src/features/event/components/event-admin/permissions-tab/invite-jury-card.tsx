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
import { useLanguage } from '@/context/language-context';
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

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
      const msg = err instanceof Error ? err.message : (isVie ? 'Không thể tải danh sách người dùng.' : 'Unable to load candidate users.');
      setLoadError(msg);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, debouncedSearch, roleFilter, page, refreshKey, isVie]);

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
      toast.error(isVie ? 'Không thể gửi lời mời khi giai đoạn chấm thi đã bắt đầu.' : 'Cannot send jury invitation once the judging phase has started.');
      return;
    }
    if (!candidate.email) {
      toast.error(isVie ? 'Tài khoản người dùng này không có địa chỉ email.' : 'This user account does not have an email address.');
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
    <aside className="glass-container rounded-2xl p-5 sm:p-6 h-fit border border-[#221E1A]/10 bg-[#FFFCF6]/90 backdrop-blur-xl flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-5 h-5 text-brand-periwinkle" />
          <h2 className="text-xl font-bold font-h1 text-on-surface">
            {isVie ? 'Mời Ban giám khảo' : 'Invite Jury Member'}
          </h2>
        </div>
        <p className="text-xs text-outline leading-relaxed">
          {isVie
            ? 'Duyệt các Tác giả đã xác minh hoặc tìm kiếm tài khoản theo tên/email để gửi lời mời trực tiếp.'
            : 'Browse verified Creators or search platform accounts by name or email to send an invitation directly.'}
        </p>
      </div>

      {/* Role to Invite Toggle */}
      <div className="rounded-xl border border-[#221E1A]/10 bg-[#E5D8C2]/60 p-2.5 flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#746A5F]">
          {isVie ? 'Vai trò mời' : 'Invitation Role'}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setInviteAsHeadJury(false)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              !inviteAsHeadJury
                ? 'border-brand-periwinkle bg-brand-periwinkle/20 text-[#241F1A]'
                : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#F0E7D8]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-brand-periwinkle" />
            {isVie ? 'Giám khảo' : 'Jury'}
          </button>
          <button
            type="button"
            disabled={hasHeadJury}
            onClick={() => setInviteAsHeadJury(true)}
            title={
              hasHeadJury
                ? (isVie ? 'Cuộc thi này đã có Trưởng ban giám khảo' : 'This event already has a Head Jury')
                : (isVie ? 'Mời làm Trưởng ban giám khảo' : 'Invite as Head Jury')
            }
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
              hasHeadJury
                ? 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#241F1A] cursor-not-allowed'
                : inviteAsHeadJury
                  ? 'border-[#8A6A1F]/30 bg-[#8A6A1F]/20 text-[#8A6A1F] cursor-pointer'
                  : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#F0E7D8] cursor-pointer'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#8A6A1F]" />
            {isVie ? 'Trưởng ban' : 'Head Jury'}
          </button>
        </div>
      </div>

      {/* Search + Role Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#746A5F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isVie ? 'Tìm theo tên, username hoặc email...' : 'Search name, username or email...'}
            className="w-full h-9 pl-8 pr-8 rounded-xl border border-[#221E1A]/10 bg-[#E5D8C2]/70 text-xs text-[#241F1A] placeholder:text-[#746A5F] focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#746A5F] hover:text-[#241F1A] cursor-pointer"
              title={isVie ? 'Xóa tìm kiếm' : 'Clear search'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: 'All', label: isVie ? 'Tất cả' : 'All Users' },
            { id: 'Creator', label: isVie ? 'Tác giả' : 'Creators' },
            { id: 'Eligible', label: isVie ? 'Có thể mời' : 'Available to Invite' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                roleFilter === tab.id
                  ? 'border-brand-periwinkle/50 bg-brand-periwinkle/20 text-[#241F1A]'
                  : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8]'
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
          <div className="py-10 text-center text-xs text-[#746A5F] flex flex-col items-center gap-2">
            <Users className="w-5 h-5 text-brand-periwinkle animate-pulse" />
            <span>{isVie ? 'Đang tải người dùng...' : 'Loading platform users...'}</span>
          </div>
        ) : loadError ? (
          <div className="p-3 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 text-xs text-[#A8321C] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loadError}</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-10 text-center text-xs text-outline border border-dashed border-[#221E1A]/10 rounded-xl px-3">
            {isVie ? 'Không tìm thấy người dùng phù hợp với bộ lọc này.' : 'No matching users found for this filter.'}
          </div>
        ) : (
          candidates.map((candidate) => {
            const isCreator = candidate.roles.some((r) => r.toLowerCase() === 'creator') && candidate.hasCreatorProfile;
            const isInviting = invitingUserId === candidate.userId;

            return (
              <div
                key={candidate.userId}
                className="rounded-xl border border-[#221E1A]/10 bg-[#E5D8C2]/60 p-3 flex flex-col gap-2 hover:border-[#221E1A]/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#241F1A] truncate">
                        {candidate.displayName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          isCreator
                            ? 'bg-brand-periwinkle/15 text-brand-periwinkle border-brand-periwinkle/30'
                            : 'bg-[#F0E7D8] text-[#746A5F] border-[#221E1A]/10'
                        }`}
                      >
                        {isCreator ? (isVie ? 'Tác giả' : 'Creator') : candidate.roles[0] || (isVie ? 'Khách hàng' : 'Client')}
                      </span>
                    </div>
                    {candidate.email && (
                      <p className="text-[11px] text-[#746A5F] font-mono truncate mt-0.5">
                        {candidate.email}
                      </p>
                    )}
                  </div>

                  {candidate.isAlreadyJury ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2F6B63]/15 border border-[#2F6B63]/35 text-[10px] font-bold text-[#2F6B63] shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      {isVie ? 'Giám khảo' : 'Jury'}
                    </span>
                  ) : candidate.hasPendingInvitation ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#8A6A1F]/15 border border-[#8A6A1F]/35 text-[10px] font-bold text-[#8A6A1F] shrink-0">
                      <Clock className="w-3 h-3" />
                      {isVie ? 'Chờ xác nhận' : 'Pending'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isJudgingPhaseActive || isInviting || !eventId}
                      onClick={() => void handleInviteCandidate(candidate)}
                      title={candidate.ineligibleReason || (isVie ? 'Gửi lời mời tham gia Ban giám khảo' : 'Send jury invitation')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        candidate.canInvite
                          ? 'bg-gradient-to-r from-[#B24A26] to-[#2F6B63] text-[#241F1A] hover:brightness-110 shadow-[0_0_12px_rgba(167,172,217,0.25)]'
                          : 'border border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#F0E7D8]'
                      }`}
                    >
                      <Send className={`w-3 h-3 ${isInviting ? 'animate-spin' : ''}`} />
                      <span>{isInviting ? (isVie ? 'Đang gửi...' : 'Sending...') : (isVie ? 'Mời' : 'Invite')}</span>
                    </button>
                  )}
                </div>

                {candidate.ineligibleReason && !candidate.isAlreadyJury && !candidate.hasPendingInvitation && (
                  <p className="text-[10px] text-[#8A6A1F] leading-snug">
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
        <div className="pt-2 border-t border-[#221E1A]/10 flex items-center justify-between text-[11px] text-[#746A5F]">
          <span>
            {isVie ? 'Trang' : 'Page'} <strong className="text-[#241F1A]">{page}</strong> / {totalPages} ({totalCount})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
