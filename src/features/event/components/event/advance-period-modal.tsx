'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FastForward,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  Scale,
  Vote,
  Trophy,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { EventListItemDto, EventDetailDto } from '../../types/event.types';
import { normalizeEventStatus, eventStatusBadgeStyles, getEventStatusLabel } from '../../types/event.types';
import { useEventCountdown } from '../../hooks/use-event-countdown';
import { eventService } from '../../services/event.service';
import { useLanguage } from '@/context/language-context';

interface AdvancePeriodModalProps {
  event: EventListItemDto | EventDetailDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: EventDetailDto) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function AdvancePeriodModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: AdvancePeriodModalProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const countdown = useEventCountdown(event);
  const [loadingPeriod, setLoadingPeriod] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const statusStr = normalizeEventStatus(event.status);
  const statusColor = eventStatusBadgeStyles[statusStr] || 'border-white/10 bg-white/5 text-outline';
  const statusLabel = getEventStatusLabel(statusStr, isVie);

  const handleAdvance = async (targetPeriod?: string) => {
    const key = targetPeriod || 'next';
    setLoadingPeriod(key);
    try {
      const res = await eventService.advancePeriod(event.id, targetPeriod);
      toast.success(res.message || (isVie ? 'Chuyển giai đoạn thành công!' : 'Period advanced successfully!'));
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVie ? 'Lỗi khi chuyển giai đoạn.' : 'Failed to advance period.');
      toast.error(msg);
    } finally {
      setLoadingPeriod(null);
    }
  };

  const currentPhaseName = countdown.phase;

  const periodsList = [
    {
      id: 'submission',
      label: isVie ? 'Giai đoạn 1: Nộp bài thi (Submission)' : 'Period 1: Submission Open',
      desc: isVie
        ? 'Mở cổng nộp bài, cho phép Creator tải tranh dự thi lên hệ thống.'
        : 'Opens submission window for creators to submit entries.',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-400',
      activeBadge: currentPhaseName === 'Submission',
      range: `${formatDate(event.submissionStartAt)} → ${formatDate(event.submissionEndAt)}`,
    },
    {
      id: 'judging',
      label: isVie ? 'Giai đoạn 2: Giám khảo chấm điểm (Judging)' : 'Period 2: Jury Evaluation',
      desc: isVie
        ? 'Đóng nhận bài, Ban giám khảo và Trưởng ban chấm điểm theo các tiêu chí Rubric.'
        : 'Closes submissions; panel and head jury evaluate entries based on rubric criteria.',
      icon: <Scale className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400',
      activeBadge: currentPhaseName === 'Judging',
      range: `${formatDate(event.judgingStartAt)} → ${formatDate(event.judgingEndAt)}`,
    },
    {
      id: 'voting',
      label: isVie ? 'Giai đoạn 3: Cộng đồng bình chọn (Voting)' : 'Period 3: Community Voting',
      desc: isVie
        ? 'Khóa điểm chấm của hội đồng, mở cổng bình chọn cho người dùng trên sàn.'
        : 'Locks jury scores; opens community voting for platform users.',
      icon: <Vote className="w-4 h-4 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400',
      activeBadge: currentPhaseName === 'Voting',
      range: `${formatDate(event.votingStartAt)} → ${formatDate(event.votingEndAt)}`,
    },
    {
      id: 'ended',
      label: isVie ? 'Giai đoạn 4: Công bố & Kết thúc (Ended)' : 'Period 4: Results & Ended',
      desc: isVie
        ? 'Đóng toàn bộ bình chọn, cố định bảng xếp hạng chung cuộc và trao giải.'
        : 'Concludes contest; finalizes leaderboard and award allocations.',
      icon: <Trophy className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400',
      activeBadge: currentPhaseName === 'Ended',
      range: `Công bố lúc: ${formatDate(event.resultAnnouncementAt)}`,
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-purple-500/30 bg-[#161926] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left space-y-5 m-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-brand-periwinkle/20 border border-purple-400/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <FastForward className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  DEMO TESTING TOOL
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-h1 mt-1 line-clamp-1">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loadingPeriod !== null}
            className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Period Status Banner */}
        <div className="p-4 rounded-2xl border border-white/10 bg-[#0f121d] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#8A8FA9] font-medium block">
              {isVie ? 'Giai đoạn hiện tại:' : 'Current Active Period:'}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-h1 font-bold text-base text-white">
                {isVie ? countdown.phaseLabelVie : countdown.phaseLabel}
              </span>
              <span className="font-mono text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                {isVie ? countdown.formattedVie : countdown.formatted}
              </span>
            </div>
          </div>

          <Clock className="w-5 h-5 text-purple-300 animate-pulse shrink-0" />
        </div>

        {/* Primary Action Button: End Current Period & Advance to Next */}
        <div>
          <button
            type="button"
            disabled={loadingPeriod !== null}
            onClick={() => handleAdvance()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#7fd5e8] text-white font-bold text-sm shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingPeriod === 'next' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isVie ? 'Đang chuyển giai đoạn...' : 'Advancing Period...'}</span>
              </>
            ) : (
              <>
                <FastForward className="w-4 h-4 text-purple-200" />
                <span>
                  {isVie
                    ? '▶ Kết thúc giai đoạn hiện tại & Chuyển sang giai đoạn kế tiếp'
                    : '▶ End Current Period & Advance to Next'}
                </span>
              </>
            )}
          </button>
          <p className="text-[11px] text-[#8A8FA9] text-center mt-2">
            {isVie
              ? 'Tự động rút ngắn hạn chót hiện tại và mở ngay giai đoạn tiếp theo để kiểm thử.'
              : 'Automatically shortens current deadline and opens the next phase for testing.'}
          </p>
        </div>

        {/* Specific Period Selection Grid */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8FA9] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{isVie ? 'Hoặc chọn trực tiếp giai đoạn cần test:' : 'Or jump directly to a period to test:'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {periodsList.map((p) => {
              const isLoading = loadingPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={loadingPeriod !== null}
                  onClick={() => handleAdvance(p.id)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2 cursor-pointer disabled:opacity-50 ${p.color} ${
                    p.activeBadge ? 'ring-2 ring-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {p.icon}
                      <span className="font-h1 font-bold text-xs text-white">
                        {p.label}
                      </span>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                    ) : p.activeBadge ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 size={10} />
                        {isVie ? 'Đang chạy' : 'Active'}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                    {p.desc}
                  </p>

                  <div className="text-[10px] font-mono text-[#8A8FA9] pt-1 border-t border-white/10">
                    {p.range}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingPeriod !== null}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isVie ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
