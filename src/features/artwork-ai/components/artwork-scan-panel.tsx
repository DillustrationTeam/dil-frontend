 'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { artworkAiService, type ScanStatus } from '../services/artwork-ai.service';
import { extractErrorMessage } from '@/lib/api-client';
const labels: Record<ScanStatus['status'], string> = { Queued: 'Đang chờ kiểm tra', Processing: 'Đang phân tích ảnh', Retrying: 'Đang chờ thử lại', Failed: 'Kiểm tra thất bại', Succeeded: 'Đã có kết quả', NotConfigured: 'Chưa cấu hình Sightengine', NotRequested: 'Tác phẩm này chưa có yêu cầu kiểm tra AI' };
export function ArtworkScanPanel({ artworkId, canRetry = false, compact = false, onCompleted }: {
  artworkId: string;
  canRetry?: boolean;
  compact?: boolean;
  onCompleted?: () => void;
}) {
  const [scan, setScan] = useState<ScanStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const notified = useRef(false);
  useEffect(() => {
    if (!onCompleted || notified.current || !scan || !['Succeeded', 'Failed', 'NotConfigured'].includes(scan.status)) return;
    notified.current = true;
    if (scan.status === 'Succeeded' && scan.score !== null) toast.success(`Đã kiểm tra ảnh AI. Điểm nghi ngờ: ${(scan.score * 100).toFixed(1)}%.`);
    else toast.error(scan.status === 'NotConfigured' ? 'Chưa thể kiểm tra ảnh AI do dịch vụ chưa được cấu hình.' : 'Kiểm tra ảnh AI thất bại. Xem trạng thái trong portfolio.');
    onCompleted();
  }, [scan, onCompleted]);
  useEffect(() => {
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try { const value = await artworkAiService.scan(artworkId, controller.signal); if (controller.signal.aborted) return; setScan(value); setError(''); if (['Queued', 'Processing', 'Retrying'].includes(value.status)) timer = setTimeout(() => { void load(); }, 5000); }
      catch (cause) { if (!controller.signal.aborted) setError(extractErrorMessage(cause, 'Không tải được kết quả kiểm tra.')); }
    }; void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [artworkId, attempt]);
  return <section className="space-y-3 rounded-2xl border border-white/10 p-4 text-sm text-slate-300" aria-label="Trạng thái kiểm tra ảnh AI"><h3 className="font-h1 font-semibold text-white">{compact ? 'Kiểm tra ảnh AI' : 'Phát hiện ảnh AI · Sightengine'}</h3>
    {error ? <div role="alert" className="text-red-300">{error} <button type="button" className="underline" onClick={() => setAttempt(v => v + 1)}>Tải lại</button></div> : <>
      <p role="status" aria-live="polite">{scan ? labels[scan.status] : 'Đang tải trạng thái…'}</p>
      {scan?.status === 'Succeeded' && scan.score !== null && <><p className="text-xl font-bold text-[#A7ACD9]">Điểm nghi ngờ: {(scan.score * 100).toFixed(1)}%</p><p className="text-xs text-slate-400">{scan.provider} · {scan.model} · {scan.checkedAt && new Date(scan.checkedAt).toLocaleString('vi-VN')}</p></>}
      {scan?.error && <p className="text-amber-300">{scan.error}</p>}
      <p className="text-xs leading-5 text-slate-400">{compact ? 'Điểm nghi ngờ AI chỉ hỗ trợ kiểm duyệt, không phải kết luận cuối cùng.' : 'Kết quả là tín hiệu hỗ trợ, có thể nhận nhầm. Moderator quyết định kiểm duyệt; điểm này không phải tỷ lệ phần trăm bức tranh do AI vẽ.'}</p>
      {canRetry && scan && !['NotConfigured', 'Queued', 'Processing', 'Retrying'].includes(scan.status) && <button type="button" disabled={busy} className="rounded-xl border border-[#A7ACD9]/40 px-3 py-2 text-[#A7ACD9] disabled:opacity-40" onClick={async () => { setBusy(true); try { setScan(await artworkAiService.retry(artworkId)); setAttempt(v => v + 1); } catch (cause) { setError(extractErrorMessage(cause, 'Không gửi được yêu cầu kiểm tra lại.')); } finally { setBusy(false); } }}>{busy ? 'Đang gửi…' : 'Kiểm tra lại ảnh'}</button>}
    </>}
  </section>;
}
