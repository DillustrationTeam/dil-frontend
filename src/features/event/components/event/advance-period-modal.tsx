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
  const statusColor = eventStatusBadgeStyles[statusStr] || 'border-[#221E1A]/10 bg-[#FFFCF6] text-outline';
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
        ? 'Mở cổng nộp bài, cho phép họa sĩ tải tranh dự thi lên hệ thống.'
        : 'Opens submission window for creators to submit entries.',
      icon: <FileText className="w-4 h-4 text-[#2F6B63]" />,
      color: 'border-[#2F6B63]/40 bg-[#2F6B63]/10 text-[#2F6B63] hover:bg-[#2F6B63]/20 hover:border-[#2F6B63]/30',
      activeBadge: currentPhaseName === 'Submission',
      range: `${formatDate(event.submissionStartAt)} → ${formatDate(event.submissionEndAt)}`,
    },
    {
      id: 'judging',
      label: isVie ? 'Giai đoạn 2: Giám khảo chấm điểm' : 'Period 2: Jury Evaluation',
      desc: isVie
        ? 'Đóng nhận bài, Ban giám khảo và Trưởng ban chấm điểm theo các tiêu chí Rubric.'
        : 'Closes submissions; panel and head jury evaluate entries based on rubric criteria.',
      icon: <Scale className="w-4 h-4 text-[#8A6A1F]" />,
      color: 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F] hover:bg-[#8A6A1F]/20 hover:border-[#8A6A1F]/30',
      activeBadge: currentPhaseName === 'Judging',
      range: `${formatDate(event.judgingStartAt)} → ${formatDate(event.judgingEndAt)}`,
    },
    {
      id: 'voting',
      label: isVie ? 'Giai đoạn 3: Cộng đồng bình chọn' : 'Period 3: Community Voting',
      desc: isVie
        ? 'Khóa điểm chấm của hội đồng, mở cổng bình chọn cho người dùng trên sàn.'
        : 'Locks jury scores; opens community voting for platform users.',
      icon: <Vote className="w-4 h-4 text-[#2C6A86]" />,
      color: 'border-[#2C6A86]/40 bg-[#2C6A86]/10 text-[#2C6A86] hover:bg-[#2C6A86]/20 hover:border-[#2C6A86]/30',
      activeBadge: currentPhaseName === 'Voting',
      range: `${formatDate(event.votingStartAt)} → ${formatDate(event.votingEndAt)}`,
    },
    {
      id: 'ended',
      label: isVie ? 'Giai đoạn 4: Công bố & Kết thúc' : 'Period 4: Results & Ended',
      desc: isVie
        ? 'Đóng toàn bộ bình chọn, cố định bảng xếp hạng chung cuộc và trao giải.'
        : 'Concludes contest; finalizes leaderboard and award allocations.',
      icon: <Trophy className="w-4 h-4 text-[#5F3F86]" />,
      color: 'border-[#5F3F86]/40 bg-[#5F3F86]/10 text-[#5F3F86] hover:bg-[#5F3F86]/20 hover:border-[#5F3F86]/30',
      activeBadge: currentPhaseName === 'Ended',
      range: `Công bố lúc: ${formatDate(event.resultAnnouncementAt)}`,
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F0E7D8]/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-[#5F3F86]/40 bg-[#FFFCF6] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left space-y-5 m-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#221E1A]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#5F3F86] to-brand-periwinkle/20 border border-[#5F3F86]/40 text-[#5F3F86] shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <FastForward className="w-6 h-6 text-[#5F3F86]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#5F3F86] bg-[#5F3F86]/15 border border-[#5F3F86]/40 px-2 py-0.5 rounded-full">
                  DEMO TESTING TOOL
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#241F1A] font-h1 mt-1 line-clamp-1">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loadingPeriod !== null}
            className="flex size-8 items-center justify-center rounded-xl bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Period Status Banner */}
        <div className="p-4 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#6E6459] font-medium block">
              {isVie ? 'Giai đoạn hiện tại:' : 'Current Active Period:'}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-h1 font-bold text-base text-[#241F1A]">
                {isVie ? countdown.phaseLabelVie : countdown.phaseLabel}
              </span>
              <span className="font-mono text-xs text-[#5F3F86] bg-[#5F3F86]/10 border border-[#5F3F86]/30 px-2 py-0.5 rounded-md">
                {isVie ? countdown.formattedVie : countdown.formatted}
              </span>
            </div>
          </div>

          <Clock className="w-5 h-5 text-[#5F3F86] animate-pulse shrink-0" />
        </div>

        {/* Primary Action Button: End Current Period & Advance to Next */}
        <div>
          <button
            type="button"
            disabled={loadingPeriod !== null}
            onClick={() => handleAdvance()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#5F3F86] via-[#3B4C86] to-[#2F6B63] text-[#241F1A] font-bold text-sm shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingPeriod === 'next' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#241F1A]" />
                <span>{isVie ? 'Đang chuyển giai đoạn...' : 'Advancing Period...'}</span>
              </>
            ) : (
              <>
                <FastForward className="w-4 h-4 text-[#5F3F86]" />
                <span>
                  {isVie
                    ? '▶ Kết thúc giai đoạn hiện tại & Chuyển sang giai đoạn kế tiếp'
                    : '▶ End Current Period & Advance to Next'}
                </span>
              </>
            )}
          </button>
          <p className="text-[11px] text-[#6E6459] text-center mt-2">
            {isVie
              ? 'Tự động rút ngắn hạn chót hiện tại và mở ngay giai đoạn tiếp theo để kiểm thử.'
              : 'Automatically shortens current deadline and opens the next phase for testing.'}
          </p>
        </div>

        {/* Specific Period Selection Grid */}
        <div className="space-y-2.5 pt-2 border-t border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6459] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5F3F86]" />
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
                    p.activeBadge ? 'ring-2 ring-[#5F3F86]/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {p.icon}
                      <span className="font-h1 font-bold text-xs text-[#241F1A]">
                        {p.label}
                      </span>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5F3F86]" />
                    ) : p.activeBadge ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#2F6B63] bg-[#2F6B63]/20 border border-[#2F6B63]/40 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 size={10} />
                        {isVie ? 'Đang chạy' : 'Active'}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-[#746A5F] leading-snug line-clamp-2">
                    {p.desc}
                  </p>

                  <div className="text-[10px] font-mono text-[#6E6459] pt-1 border-t border-[#221E1A]/10">
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
            className="px-4 py-2 rounded-xl border border-[#221E1A]/10 text-xs font-semibold text-[#746A5F] hover:bg-[#FFFCF6] transition-all cursor-pointer disabled:opacity-50"
          >
            {isVie ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
