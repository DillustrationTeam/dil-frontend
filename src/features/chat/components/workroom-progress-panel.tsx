'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BellRing, CalendarClock, CheckCircle2, CircleAlert, RefreshCw, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { deadlineRiskService } from '../services/deadline-risk.service';
import type { DeadlineRiskDto, DeadlineRiskLevel } from '../types/deadline-risk.types';

/** Nhãn + màu theo mức rủi ro do backend chấm (0..1). */
const riskLevels: Record<DeadlineRiskLevel, { label: string; badge: string; bar: string; text: string }> = {
  low: {
    label: 'An toàn',
    badge: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    bar: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  medium: {
    label: 'Trung bình',
    badge: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    bar: 'bg-amber-400',
    text: 'text-amber-300',
  },
  high: {
    label: 'Cao',
    badge: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
    bar: 'bg-orange-400',
    text: 'text-orange-300',
  },
  critical: {
    label: 'Nghiêm trọng',
    badge: 'border-red-400/40 bg-red-500/10 text-red-300',
    bar: 'bg-red-400',
    text: 'text-red-300',
  },
};

function formatDateTime(value: string | null) {
  if (!value) return 'Chưa thiết lập';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Khoảng thời gian còn lại tới deadline, dạng "3 ngày 4 giờ" / "Đã quá hạn 2 giờ". */
function describeCountdown(deadline: string | null) {
  if (!deadline) return null;

  const diffMs = new Date(deadline).getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);

  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0 && days < 30) parts.push(`${hours} giờ`);
  if (days === 0 && hours === 0) parts.push(`${minutes} phút`);

  return { overdue, text: parts.join(' ') || 'dưới 1 phút' };
}

/**
 * Widget tiến độ + AI Deadline Predictor trên Workroom (SCR-46).
 *
 * Hiển thị mức rủi ro trễ hạn do backend chấm dựa trên tiến độ mốc và lịch sử vẽ
 * của Artist; bấm "Chấm lại bằng AI" để yêu cầu dự đoán mới.
 *
 * Chỉ dựng khi phòng gắn với một commission — phòng đấu giá / phòng hỗ trợ không
 * có mốc tiến độ nên `commissionId` là null.
 */
export function WorkroomProgressPanel({
  commissionId,
  onCancelClick,
  allApproved,
  isCancelled,
  totalMilestones,
}: {
  commissionId: string;
  onCancelClick?: () => void;
  allApproved?: boolean;
  isCancelled?: boolean;
  totalMilestones?: number;
}) {
  const [risk, setRisk] = useState<DeadlineRiskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await deadlineRiskService.get(commissionId, signal);
        if (signal?.aborted) return;
        setRisk(data);
        setError(null);
      } catch (err: unknown) {
        if (signal?.aborted) return;
        setRisk(null);
        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu tiến độ.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [commissionId],
  );

  /** Bật lại spinner rồi tải — chỉ gọi từ event handler nên được phép setState đồng bộ. */
  const retry = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      await load(controller.signal);
    })();
    return () => controller.abort();
  }, [load]);

  async function handlePredict() {
    setPredicting(true);
    setError(null);
    try {
      setRisk(await deadlineRiskService.predict(commissionId));
      setExpanded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không chấm lại được rủi ro.');
    } finally {
      setPredicting(false);
    }
  }

  const countdown = useMemo(() => describeCountdown(risk?.deadline ?? null), [risk?.deadline]);

  if (loading) {
    return (
      <div className="glass-container mb-3 flex items-center gap-3 rounded-2xl border border-white/10 p-3 text-xs text-outline">
        <RefreshCw size={14} className="animate-spin" />
        Đang phân tích tiến độ và rủi ro hạn chót…
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="glass-container mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-3 text-xs text-on-surface-variant">
        <CircleAlert size={14} className="text-outline" />
        <span className="flex-1">{error ?? 'Chưa có dữ liệu tiến độ cho đơn hàng này.'}</span>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 font-semibold hover:bg-white/10"
        >
          <RefreshCw size={12} /> Thử lại
        </button>
      </div>
    );
  }

  const isEnded = Boolean(allApproved || isCancelled);
  const effectiveLevel = isEnded ? 'low' : risk.riskLevel;
  const style = riskLevels[effectiveLevel];
  const percent = isEnded ? 0 : Math.round(Math.min(1, Math.max(0, risk.riskScore)) * 100);
  const needsAttention = !isEnded && (risk.riskLevel === 'high' || risk.riskLevel === 'critical');
  const RiskIcon = needsAttention ? TrendingDown : TrendingUp;

  return (
    <section
      aria-label="Tiến độ và rủi ro hạn chót"
      className={`glass-container mb-3 rounded-2xl border p-3 text-xs ${
        needsAttention ? 'border-red-400/30 bg-red-500/5' : 'border-white/10'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
          <Activity size={14} className="text-brand-periwinkle" /> Tiến độ &amp; hạn chót
        </span>

        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${style.badge}`}>
          <RiskIcon size={11} /> Rủi ro trễ hạn: {isEnded ? 'An toàn (Đã kết thúc)' : `${style.label} · ${percent}%`}
        </span>

        {isCancelled ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-300">
            <CircleAlert size={11} /> Đã hủy đơn & Hoàn tiền
          </span>
        ) : allApproved || (totalMilestones && risk.currentStage > totalMilestones) ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 size={11} /> Hoàn tất {totalMilestones ? `${totalMilestones}/${totalMilestones}` : 'các'} mốc
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-on-surface-variant">
            <CalendarClock size={11} /> Mốc #{risk.currentStage}
          </span>
        )}

        {!isEnded && countdown && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              countdown.overdue ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-white/10 text-on-surface-variant'
            }`}
          >
            <CalendarClock size={11} />
            {countdown.overdue ? `Quá hạn ${countdown.text}` : `Còn ${countdown.text}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="rounded-full border border-white/15 px-3 py-1 font-semibold hover:bg-white/10"
          >
            {expanded ? 'Thu gọn' : 'Chi tiết'}
          </button>
          <button
            type="button"
            onClick={handlePredict}
            disabled={predicting || isEnded}
            title={isEnded ? 'Đơn hàng đã kết thúc, không cần chấm lại rủi ro' : 'Chấm lại bằng AI'}
            className="inline-flex items-center gap-1 rounded-full bg-brand-periwinkle px-3 py-1 font-semibold text-brand-navy hover:brightness-110 disabled:opacity-50"
          >
            {predicting ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {predicting ? 'Đang chấm…' : 'Chấm lại bằng AI'}
          </button>

          {!isCancelled && onCancelClick && (
            <button
              type="button"
              onClick={onCancelClick}
              className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 font-semibold text-red-300 hover:bg-red-500/20 transition"
              title="Hủy đơn hàng hoặc mở khiếu nại"
            >
              <CircleAlert size={12} /> Hủy đơn / Khiếu nại
            </button>
          )}
        </div>
      </div>

      {/* Thanh rủi ro trực quan */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${Math.max(4, percent)}%` }} />
      </div>

      {/* Cảnh báo nổi khi mức rủi ro cao */}
      {needsAttention && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-2.5 text-[11px] text-red-200">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            Đơn hàng đang có nguy cơ <strong>trễ hạn</strong> dựa trên tiến độ mốc và lịch sử vẽ của Artist.
            Nên trao đổi ngay với đối tác để dời mốc hoặc bổ sung tiến độ.
          </span>
        </div>
      )}

      {expanded && (
        <div className="mt-3 grid gap-2 text-[11px] text-on-surface-variant sm:grid-cols-2">
          <p className="flex items-center gap-1.5">
            <CalendarClock size={12} className="text-outline" /> Hạn chót: <strong className="text-on-surface">{formatDateTime(risk.deadline)}</strong>
          </p>
          <p className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-outline" /> Chấm lúc:{' '}
            <strong className="text-on-surface">{formatDateTime(risk.predictedAt)}</strong>
            {risk.modelVersion ? ` · ${risk.modelVersion}` : ''}
          </p>
          <p className="flex items-center gap-1.5">
            <BellRing size={12} className="text-outline" /> Nhắc kế tiếp:{' '}
            <strong className="text-on-surface">{formatDateTime(risk.nextRemindAt)}</strong>
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-outline" /> Số nhắc nhở đã đặt:{' '}
            <strong className="text-on-surface">{risk.reminders.length}</strong>
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-[11px] text-red-200">
          <CircleAlert size={12} /> {error}
        </p>
      )}
    </section>
  );
}
