'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { artworkAiService, type ScanStatus } from '../services/artwork-ai.service';
import { extractErrorMessage } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';

const labelsVie: Record<ScanStatus['status'], string> = {
  Queued: 'Đang chờ kiểm tra',
  Processing: 'Đang phân tích ảnh',
  Retrying: 'Đang chờ thử lại',
  Failed: 'Kiểm tra thất bại',
  Succeeded: 'Đã có kết quả',
  NotConfigured: 'Chưa cấu hình Sightengine',
  NotRequested: 'Tác phẩm này chưa có yêu cầu kiểm tra AI',
};

const labelsEng: Record<ScanStatus['status'], string> = {
  Queued: 'Queued for inspection',
  Processing: 'Analyzing image',
  Retrying: 'Waiting to retry',
  Failed: 'Inspection failed',
  Succeeded: 'Result available',
  NotConfigured: 'Sightengine not configured',
  NotRequested: 'AI inspection not requested for this artwork',
};

export function ArtworkScanPanel({ artworkId, canRetry = false, compact = false, onCompleted }: {
  artworkId: string;
  canRetry?: boolean;
  compact?: boolean;
  onCompleted?: () => void;
}) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const labels = isVie ? labelsVie : labelsEng;
  const [scan, setScan] = useState<ScanStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const notified = useRef(false);
  useEffect(() => {
    if (!onCompleted || notified.current || !scan || !['Succeeded', 'Failed', 'NotConfigured'].includes(scan.status)) return;
    notified.current = true;
    if (scan.status === 'Succeeded' && scan.score !== null) {
      toast.success(
        isVie
          ? `Đã kiểm tra ảnh AI. Điểm nghi ngờ: ${(scan.score * 100).toFixed(1)}%.`
          : `AI image scan complete. AI Suspicion Score: ${(scan.score * 100).toFixed(1)}%.`
      );
    } else {
      toast.error(
        scan.status === 'NotConfigured'
          ? (isVie ? 'Chưa thể kiểm tra ảnh AI do dịch vụ chưa được cấu hình.' : 'AI image scan unavailable because the service is not configured.')
          : (isVie ? 'Kiểm tra ảnh AI thất bại. Xem trạng thái trong hồ sơ tác phẩm.' : 'AI image scan failed. Check status in the artwork profile.')
      );
    }
    onCompleted();
  }, [scan, onCompleted, isVie]);
  useEffect(() => {
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try { const value = await artworkAiService.scan(artworkId, controller.signal); if (controller.signal.aborted) return; setScan(value); setError(''); if (['Queued', 'Processing', 'Retrying'].includes(value.status)) timer = setTimeout(() => { void load(); }, 5000); }
      catch (cause) { if (!controller.signal.aborted) setError(extractErrorMessage(cause, isVie ? 'Không tải được kết quả kiểm tra.' : 'Failed to load inspection result.')); }
    }; void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [artworkId, attempt, isVie]);
  return <section className="space-y-3 rounded-2xl border border-[#221E1A]/10 p-4 text-sm text-[#746A5F]" aria-label={isVie ? 'Trạng thái kiểm tra ảnh AI' : 'AI image inspection status'}><h3 className="font-h1 font-semibold text-[#241F1A]">{compact ? (isVie ? 'Kiểm tra ảnh AI' : 'AI Image Check') : (isVie ? 'Phát hiện ảnh AI · Sightengine' : 'AI Image Detection · Sightengine')}</h3>
    {error ? <div role="alert" className="text-[#A8321C]">{error} <button type="button" className="underline" onClick={() => setAttempt(v => v + 1)}>{isVie ? 'Tải lại' : 'Retry'}</button></div> : <>
      <p role="status" aria-live="polite">{scan ? labels[scan.status] : (isVie ? 'Đang tải trạng thái…' : 'Loading status…')}</p>
      {scan?.status === 'Succeeded' && scan.score !== null && <><p className="text-xl font-bold text-[#B24A26]">{isVie ? 'Điểm nghi ngờ:' : 'AI Suspicion Score:'} {(scan.score * 100).toFixed(1)}%</p><p className="text-xs text-[#746A5F]">{scan.provider} · {scan.model} · {scan.checkedAt && new Date(scan.checkedAt).toLocaleString(isVie ? 'vi-VN' : 'en-US')}</p></>}
      {scan?.error && <p className="text-[#8A6A1F]">{scan.error}</p>}
      <p className="text-xs leading-5 text-[#746A5F]">{compact ? (isVie ? 'Điểm nghi ngờ AI chỉ hỗ trợ kiểm duyệt, không phải kết luận cuối cùng.' : 'The AI suspicion score is an advisory moderation signal, not a final verdict.') : (isVie ? 'Kết quả là tín hiệu hỗ trợ, có thể nhận nhầm. Moderator quyết định kiểm duyệt; điểm này không phải tỷ lệ phần trăm bức tranh do AI vẽ.' : 'This score is an advisory signal and may produce false positives. Moderators make the final decision; this is not the percentage of the artwork drawn by AI.')}</p>
      {canRetry && scan && !['NotConfigured', 'Queued', 'Processing', 'Retrying'].includes(scan.status) && <button type="button" disabled={busy} className="rounded-xl border border-[#B24A26]/40 px-3 py-2 text-[#B24A26] disabled:opacity-40" onClick={async () => { setBusy(true); try { setScan(await artworkAiService.retry(artworkId)); setAttempt(v => v + 1); } catch (cause) { setError(extractErrorMessage(cause, isVie ? 'Không gửi được yêu cầu kiểm tra lại.' : 'Failed to submit retry request.')); } finally { setBusy(false); } }}>{busy ? (isVie ? 'Đang gửi…' : 'Sending…') : (isVie ? 'Kiểm tra lại ảnh' : 'Re-scan image')}</button>}
    </>}
  </section>;
}
