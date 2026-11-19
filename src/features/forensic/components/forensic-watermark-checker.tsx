'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload,
  Search,
  ShieldCheck,
  ShieldAlert,
  FileArchive,
  Image as ImageIcon,
  FileCode2,
  Loader2,
  Copy,
  Check,
  History,
  Eye,
  Download,
  RefreshCw,
  FlaskConical,
  ExternalLink,
  X,
  LogIn,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { useAuthStore } from '@/store/use-auth-store';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5075/api/v1').replace(/\/api\/v1\/?$/, '');

interface ForensicTraceMatch {
  receiptId: string;
  receiptToken: string;
  numericPayload: number | null;
  artworkId: string | null;
  artworkTitle: string;
  creatorName: string;
  viewerUserId: string | null;
  viewerEmail: string | null;
  viewerName: string | null;
  ipAddress: string;
  userAgent: string | null;
  viewedAt: string;
  status: string;
  commissionId?: string | null;
  milestoneId?: string | null;
  watermarkType?: string | null;
  fileName?: string | null;
  fileSha256?: string | null;
}

interface DecodeResponse {
  found: boolean;
  matchMethod: string;
  extractedPayload?: string | null;
  numericPayload?: number | null;
  fileSha256: string;
  totalMatches: number;
  message?: string;
  matches: ForensicTraceMatch[];
}

const WATERMARK_TYPE_LABELS: Record<string, { label: string; accountLabel: string; badgeClass: string }> = {
  DwtPublish: {
    label: 'Ảnh trưng bày',
    accountLabel: 'Người đăng',
    badgeClass: 'border-[#A7ACD9]/35 bg-[#A7ACD9]/10 text-[#DDE0FF]',
  },
  DwtForensic: {
    label: 'Phiên xem tranh',
    accountLabel: 'Người xem',
    badgeClass: 'border-sky-500/35 bg-sky-500/10 text-sky-300',
  },
  DwtCommissionWip: {
    label: 'Bản nháp WIP',
    accountLabel: 'Khách hàng',
    badgeClass: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
  },
  DwtCommissionFinal: {
    label: 'Bàn giao cuối (ảnh)',
    accountLabel: 'Khách nhận',
    badgeClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  },
  HashCommissionFinal: {
    label: 'Bàn giao cuối (file gốc / ZIP)',
    accountLabel: 'Khách nhận',
    badgeClass: 'border-violet-500/35 bg-violet-500/10 text-violet-300',
  },
};

const SOURCE_LABELS: Record<string, string> = {
  publish: 'Đăng công khai',
  backfill: 'Đồng bộ hệ thống',
  'commission-wip': 'Nộp bản nháp',
  'commission-final': 'Bàn giao đơn',
  'commission-bundle': 'Gói tải về',
};

function isImageFile(file: File | null): boolean {
  if (!file) return false;
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name) || file.type.startsWith('image/');
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { status?: number; data?: { error?: { details?: string[] } } } };
  if (axiosErr?.response?.status === 401) {
    return 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.';
  }
  const details = axiosErr?.response?.data?.error?.details;
  if (details && details.length > 0) {
    return details.join(', ');
  }
  return err instanceof Error ? err.message : fallback;
}

interface ForensicWatermarkCheckerProps {
  mode?: 'user' | 'admin';
}

export function ForensicWatermarkChecker({ mode = 'user' }: ForensicWatermarkCheckerProps = {}) {
  const isAdminMode = mode === 'admin';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const roles = useAuthStore((s) => s.roles);
  const isStaff = roles.includes('Administrator') || roles.includes('Moderator');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [boostScreenshot, setBoostScreenshot] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeResult, setDecodeResult] = useState<DecodeResponse | null>(null);

  const [traceMode, setTraceMode] = useState<'token' | 'artwork' | 'commission'>('token');
  const [traceInput, setTraceInput] = useState('');
  const [tracing, setTracing] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceResults, setTraceResults] = useState<ForensicTraceMatch[] | null>(null);

  const [recentReceipts, setRecentReceipts] = useState<ForensicTraceMatch[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [testingToken, setTestingToken] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);

  const loadRecentReceipts = useCallback(async () => {
    if (!isAuthenticated || !isAdminMode) return;
    setLoadingRecent(true);
    try {
      const res = await apiClient.get<ApiResponse<ForensicTraceMatch[]>>('/artworks/forensic/recent');
      if (res.data?.data) {
        setRecentReceipts(res.data.data);
      }
    } catch {
      // Ignore silently when unauthenticated or network interrupted
    } finally {
      setLoadingRecent(false);
    }
  }, [isAuthenticated, isAdminMode]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !isAdminMode) return;
    let active = true;
    apiClient
      .get<ApiResponse<ForensicTraceMatch[]>>('/artworks/forensic/recent')
      .then((res) => {
        if (active && res.data?.data) {
          setRecentReceipts(res.data.data);
        }
      })
      .catch(() => {
        // Ignore silently when unauthenticated or network interrupted
      });
    return () => {
      active = false;
    };
  }, [hasHydrated, isAuthenticated, isAdminMode]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !isImageFile(selectedFile) || !selectedFile) return;

    const url = URL.createObjectURL(selectedFile);
    const img = new window.Image();
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      const maxW = 900;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);

      if (boostScreenshot) {
        const frame = ctx.getImageData(0, 0, w, h);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const blueExcess = d[i + 2] - (d[i] + d[i + 1]) * 0.5;
          const boosted = Math.min(255, Math.max(0, Math.round(128 + blueExcess * 28)));
          const edge = Math.min(255, Math.max(0, Math.round((d[i + 2] % 8) * 32)));
          d[i] = boosted;
          d[i + 1] = boosted;
          d[i + 2] = Math.min(255, Math.round(boosted * 0.7 + edge * 0.3));
        }
        ctx.putImageData(frame, 0, 0);
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [selectedFile, boostScreenshot]);

  const runDecodeOnFile = async (file: File) => {
    setDecoding(true);
    setDecodeError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<ApiResponse<DecodeResponse>>(
        '/artworks/forensic/decode-image',
        formData
      );
      if (res.data?.error || !res.data?.data) {
        throw new Error(res.data?.error?.details?.join(', ') || 'Không thể kiểm tra tệp này.');
      }
      setDecodeResult(res.data.data);
    } catch (err: unknown) {
      setDecodeError(extractErrorMessage(err, 'Không thể kiểm tra tệp này.'));
    } finally {
      setDecoding(false);
    }
  };

  const handleFilePick = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setDecodeError(null);
    setDecodeResult(null);
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setBoostScreenshot(false);
    setDecodeError(null);
    setDecodeResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDecodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    await runDecodeOnFile(selectedFile);
  };

  const handleQuickTestReceipt = async (receipt: ForensicTraceMatch) => {
    if (!receipt.artworkId) return;
    setTestingToken(receipt.receiptToken);
    try {
      const imgUrl = `${API_ORIGIN}/api/v1/artworks/${receipt.artworkId}/protected-image?token=${encodeURIComponent(
        receipt.receiptToken
      )}`;
      const resp = await fetch(imgUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const testFile = new File([blob], `${receipt.receiptToken}.png`, { type: blob.type || 'image/png' });
      setSelectedFile(testFile);
      setBoostScreenshot(false);
      await runDecodeOnFile(testFile);
    } catch (err: unknown) {
      setDecodeError(extractErrorMessage(err, 'Không tải được ảnh mẫu để kiểm tra.'));
    } finally {
      setTestingToken(null);
    }
  };

  const handleTraceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = traceInput.trim();
    if (!q) return;

    setTracing(true);
    setTraceError(null);
    try {
      const cleanQuery = q;
      const params: Record<string, string> = {};

      // Tự động nhận diện định dạng không cần người dùng chọn dropdown
      if (cleanQuery.toUpperCase().startsWith('#CMD-') || cleanQuery.toUpperCase().startsWith('CMD-')) {
        params.commissionId = cleanQuery;
      } else if (cleanQuery.toUpperCase().startsWith('WR-') || cleanQuery.toUpperCase().startsWith('FIN-') || cleanQuery.toUpperCase().startsWith('WIP-') || cleanQuery.toUpperCase().startsWith('PUB-') || cleanQuery.toUpperCase().startsWith('BND-')) {
        params.receiptToken = cleanQuery;
      } else {
        // Mặc định truyền cả receiptToken và commissionId nếu không rõ
        params.receiptToken = cleanQuery;
        params.commissionId = cleanQuery;
      }

      const res = await apiClient.get<ApiResponse<ForensicTraceMatch[]>>('/artworks/forensic/trace', {
        params,
      });
      if (res.data?.error || !res.data?.data) {
        throw new Error(res.data?.error?.details?.join(', ') || 'Không thể tra cứu biên lai.');
      }
      setTraceResults(res.data.data);
    } catch (err: unknown) {
      setTraceError(extractErrorMessage(err, 'Lỗi tra cứu biên lai.'));
    } finally {
      setTracing(false);
    }
  };

  const handleBackfillPreviews = async () => {
    setBackfilling(true);
    setBackfillMsg(null);
    try {
      const res = await apiClient.post<
        ApiResponse<{ totalPending: number; processed: number; visualHashesUpdated?: number; skippedCount: number }>
      >('/artworks/forensic/backfill-previews', {});
      const d = res.data?.data;
      if (!d) throw new Error('Không nhận được kết quả xử lý.');
      setBackfillMsg(
        `Đã xử lý ${d.processed}/${d.totalPending} tranh chưa có bản xem trước và cập nhật ${d.visualHashesUpdated ?? 0} dấu vân tay ảnh${
          d.skippedCount > 0 ? ` (bỏ qua ${d.skippedCount} tranh không đọc được file gốc)` : ''
        }.`
      );
      await loadRecentReceipts();
    } catch (err: unknown) {
      setBackfillMsg(extractErrorMessage(err, 'Không thể xử lý danh sách tranh cũ.'));
    } finally {
      setBackfilling(false);
    }
  };

  const copyValue = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedSha(val);
      setTimeout(() => setCopiedSha(null), 1500);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const getTypeInfo = (type?: string | null) =>
    (type && WATERMARK_TYPE_LABELS[type]) || {
      label: type || 'Phiên xem tranh',
      accountLabel: 'Tài khoản',
      badgeClass: 'border-white/15 bg-white/[.04] text-[#C7C5CF]',
    };

  const formatSource = (ip: string) => SOURCE_LABELS[ip] || ip;

  const renderMatchesTable = (matches: ForensicTraceMatch[], showActions = false) => {
    if (matches.length === 0) {
      return (
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-5 text-sm text-[#919099]">
          Chưa có biên lai nào khớp.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {matches.map((m) => {
          const typeInfo = getTypeInfo(m.watermarkType);
          const targetHref = m.artworkId
            ? `/artworks/${m.artworkId}`
            : m.commissionId
              ? `/workroom/${m.commissionId}`
              : null;

          const accountDisplay = m.viewerName && m.viewerEmail
            ? `${m.viewerName} (${m.viewerEmail})`
            : m.viewerName || m.viewerEmail || 'Khách vãng lai (chưa đăng nhập)';

          return (
            <div
              key={m.receiptId}
              className="rounded-xl border border-white/10 bg-[#131624] p-4 transition-colors hover:border-white/20"
            >
              {/* Hàng 1: Tên tác phẩm / đơn (bấm mở trang) + Loại + Thời gian */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  {targetHref ? (
                    <Link
                      href={targetHref}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-[#DDE0FF] hover:underline"
                    >
                      <span>{m.artworkTitle}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#A7ACD9]" />
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-white">{m.artworkTitle}</span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${typeInfo.badgeClass}`}
                  >
                    {typeInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {showActions && m.artworkId && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickTestReceipt(m)}
                        disabled={testingToken === m.receiptToken}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 px-2.5 py-1 text-[11px] font-medium text-[#DDE0FF] transition hover:bg-[#A7ACD9]/20 disabled:opacity-50"
                        title="Tải ảnh của biên lai này và chạy kiểm tra ngay"
                      >
                        {testingToken === m.receiptToken ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <FlaskConical className="h-3 w-3" />
                        )}
                        <span>Kiểm tra nhanh</span>
                      </button>
                      <a
                        href={`${API_ORIGIN}/api/v1/artworks/${m.artworkId}/protected-image?token=${encodeURIComponent(
                          m.receiptToken
                        )}`}
                        download={`${m.receiptToken}.png`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[.04] px-2.5 py-1 text-[11px] font-medium text-[#C7C5CF] transition hover:bg-white/10 hover:text-white"
                        title="Tải ảnh PNG đã gắn thuỷ vân"
                      >
                        <Download className="h-3 w-3" />
                        <span>Tải PNG</span>
                      </a>
                    </>
                  )}
                  <span className="text-xs text-[#919099]">
                    {new Date(m.viewedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Hàng 2: Thông tin chính dễ đọc (Tác giả - Tài khoản - Nguồn) */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-[#919099]">Tác giả: </span>
                  <span className="font-medium text-white">{m.creatorName}</span>
                </div>
                <div>
                  <span className="text-[#919099]">{typeInfo.accountLabel}: </span>
                  <span className="font-medium text-[#E4E1E5]">{accountDisplay}</span>
                </div>
                <div>
                  <span className="text-[#919099]">Nguồn: </span>
                  <span className="font-mono text-[#C7C5CF]">{formatSource(m.ipAddress)}</span>
                </div>
              </div>

              {/* Hàng 3: Thông số đối chiếu kỹ thuật (gọn nhẹ ở cuối card) */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-2.5 text-[11px] text-[#919099]">
                <span>
                  Biên lai: <code className="font-mono text-[#C7C5CF]">{m.receiptToken}</code>
                </span>
                {m.fileName && (
                  <span>
                    Tệp: <code className="font-mono text-[#C7C5CF]">{m.fileName}</code>
                  </span>
                )}
                {m.numericPayload != null && (
                  <span>
                    Mã DWT: <code className="font-mono text-[#DDE0FF]">{m.numericPayload}</code>
                  </span>
                )}
                {m.fileSha256 && (
                  <span className="inline-flex items-center gap-1">
                    SHA-256: <code className="font-mono text-[#C7C5CF]">{m.fileSha256.slice(0, 16)}…</code>
                    <button
                      type="button"
                      onClick={() => copyValue(m.fileSha256!)}
                      className="rounded p-0.5 text-[#919099] hover:bg-white/10 hover:text-white"
                      title="Sao chép đủ mã SHA-256"
                    >
                      {copiedSha === m.fileSha256 ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      <header className="space-y-1.5 border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Kiểm tra thuỷ vân và truy vết nguồn gốc
        </h1>
        <p className="max-w-3xl text-sm text-[#919099]">
          Tải lên ảnh nghi bị rò rỉ, file gốc bàn giao hoặc gói .zip để đọc mã thuỷ vân ẩn và đối chiếu biên lai trên hệ thống.
        </p>
      </header>

      {hasHydrated && !isAuthenticated && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/35 bg-amber-950/20 px-5 py-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">Bạn chưa đăng nhập</p>
            <p className="text-xs text-[#C7C5CF]">
              Cần đăng nhập để tải tệp kiểm tra thuỷ vân và xem lịch sử biên lai của bạn.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#A7ACD9] px-4 py-2 text-xs font-semibold text-[#0B0E18] transition hover:bg-[#c2c6eb]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Đăng nhập</span>
          </Link>
        </div>
      )}

      {isAdminMode && isStaff && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#A7ACD9]/25 bg-[#131624] px-5 py-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Cập nhật bản thuỷ vân cho tranh cũ
            </p>
            <p className="text-xs text-[#919099]">
              Tạo bản xem trước giảm độ phân giải kèm mã DWT cho các tranh đã đăng từ trước để không hiển thị file gốc ngoài trang chủ.
            </p>
            {backfillMsg && <p className="pt-1 text-xs text-[#DDE0FF]">{backfillMsg}</p>}
          </div>
          <button
            type="button"
            onClick={handleBackfillPreviews}
            disabled={backfilling}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#A7ACD9]/40 bg-[#A7ACD9]/15 px-4 py-2 text-xs font-semibold text-[#DDE0FF] transition hover:bg-[#A7ACD9]/25 disabled:opacity-50"
          >
            {backfilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span>{backfilling ? 'Đang xử lý...' : 'Chạy cho tranh cũ'}</span>
          </button>
        </section>
      )}

      {/* Panel 1: Decode Suspect File */}
      <section className="rounded-2xl border border-white/10 bg-[#0d101b] p-6">
        <h2 className="text-base font-semibold text-white">1. Kiểm tra tệp tin</h2>
        <p className="mt-1 text-xs text-[#919099]">
          Nhận ảnh (PNG, JPG, WEBP, GIF), file kỹ thuật số (PSD, PSB, CLIP, AI, PDF) và file .zip. Với ảnh chụp màn hình, có thể bật tăng tương phản kênh xanh dương để soi lớp chữ chìm.
        </p>

        <form onSubmit={handleDecodeSubmit} className="mt-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilePick(e.dataTransfer.files?.[0] || null);
            }}
            className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#131624] px-6 py-8 text-center transition-colors hover:border-[#A7ACD9]/60 hover:bg-[#171b2d]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.psd,.psb,.clip,.ai,.pdf,.zip"
              onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
              className="hidden"
            />
            {selectedFile && (
              <button
                type="button"
                onClick={handleClearFile}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[.05] px-2 py-1 text-[11px] text-[#C7C5CF] transition hover:bg-white/10 hover:text-white"
                title="Xoá tệp đã chọn"
              >
                <X className="h-3 w-3" />
                <span>Xoá tệp</span>
              </button>
            )}
            <div className="mb-3 flex items-center gap-2 text-[#A7ACD9]">
              <ImageIcon className="h-5 w-5" />
              <FileCode2 className="h-5 w-5" />
              <FileArchive className="h-5 w-5" />
            </div>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                <p className="text-xs text-[#919099]">
                  {(selectedFile.size / 1024).toFixed(1)} KB, bấm để đổi tệp khác
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#E4E1E5]">
                  Kéo thả hoặc bấm để chọn tệp (tối đa 100 MB)
                </p>
                <p className="text-xs text-[#919099]">
                  PNG, JPG, WEBP, GIF, PSD, CLIP, AI, PDF hoặc ZIP
                </p>
              </div>
            )}
          </div>

          {isImageFile(selectedFile) && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#131624] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#C7C5CF]">
                  Xem trước ảnh
                </span>
                <button
                  type="button"
                  onClick={() => setBoostScreenshot((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    boostScreenshot
                      ? 'border-[#A7ACD9] bg-[#A7ACD9]/20 text-white'
                      : 'border-white/15 bg-white/[.04] text-[#C7C5CF] hover:bg-white/10'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{boostScreenshot ? 'Tắt chế độ soi chữ chìm' : 'Soi chữ chìm ảnh chụp màn hình'}</span>
                </button>
              </div>
              <canvas
                ref={previewCanvasRef}
                className="mx-auto max-h-80 w-auto rounded-lg border border-white/10 object-contain"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!selectedFile || decoding || !isAuthenticated}
              className="inline-flex items-center gap-2 rounded-xl bg-[#A7ACD9] px-5 py-2.5 text-sm font-semibold text-[#0B0E18] transition hover:bg-[#c2c6eb] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {decoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{decoding ? 'Đang kiểm tra...' : 'Kiểm tra thuỷ vân'}</span>
            </button>
          </div>
        </form>

        {decodeError && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
            {decodeError}
          </div>
        )}

        {decodeResult && (
          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <div
              className={`flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4 ${
                decodeResult.found && decodeResult.matches.length > 0
                  ? 'border-emerald-500/35 bg-emerald-950/20'
                  : 'border-amber-500/35 bg-amber-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {decodeResult.found && decodeResult.matches.length > 0 ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {decodeResult.found && decodeResult.matches.length > 0
                      ? `Khớp nguồn gốc (${decodeResult.matchMethod})`
                      : 'Không tìm thấy biên lai nào khớp'}
                  </p>
                  {decodeResult.message && (
                    <p className="text-xs leading-relaxed text-[#C7C5CF]">{decodeResult.message}</p>
                  )}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs text-[#C7C5CF]">
                    {decodeResult.extractedPayload && (
                      <span>
                        DWT đọc được: <code className="font-mono text-[#DDE0FF]">{decodeResult.extractedPayload}</code>
                      </span>
                    )}
                    <span>
                      SHA-256: <code className="font-mono text-[#E4E1E5]">{decodeResult.fileSha256}</code>
                    </span>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/[.05] px-3 py-1 text-xs font-medium text-white">
                {decodeResult.totalMatches} biên lai khớp
              </span>
            </div>

            {decodeResult.matches.length > 0 && renderMatchesTable(decodeResult.matches)}
          </div>
        )}
      </section>

      {/* Panel 2: Trace Receipt + Recent Receipts */}
      <section className="space-y-6 rounded-2xl border border-white/10 bg-[#0d101b] p-6">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#A7ACD9]" />
            <h2 className="text-base font-semibold text-white">2. Tra cứu lịch sử biên lai</h2>
          </div>
          <p className="mt-1 text-xs text-[#919099]">
            Tìm theo mã biên lai (WR-..., PUB-..., WIP-..., FIN-...), mã tác phẩm hoặc mã đơn hàng.
          </p>

          {/* Hộp ghi chú hướng dẫn lấy mã rõ ràng */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-slate-300">
              <span className="font-bold text-white block mb-0.5">📌 Lấy Mã đơn hàng (#CMD-...):</span>
              Vào <strong>Phòng làm việc</strong> hoặc <strong>Đơn vẽ của tôi</strong>, copy mã hiển thị trên đầu đơn (ví dụ: <code className="text-[#A7ACD9] font-mono">#CMD-454C01A4</code>).
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-slate-300">
              <span className="font-bold text-white block mb-0.5">🔍 Lấy Mã biên lai (FIN-... / WIP-...):</span>
              Tự động sinh khi nộp phác thảo hoặc tải file bàn giao. Hoặc kéo ảnh nghi vấn thả vào mục 1 ở trên để quét tự động.
            </div>
          </div>

          <form onSubmit={handleTraceSearch} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={traceInput}
              onChange={(e) => setTraceInput(e.target.value)}
              placeholder="Nhập mã đơn hàng (ví dụ: #CMD-454C01A4) hoặc mã biên lai (FIN-..., WIP-...)..."
              className="flex-1 rounded-xl border border-white/15 bg-[#131624] px-4 py-2.5 text-sm text-white placeholder-[#919099] outline-none focus:border-[#A7ACD9]"
            />

            <button
              type="submit"
              disabled={!traceInput.trim() || tracing || !isAuthenticated}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#A7ACD9] text-[#1F2335] hover:bg-[#B8BCDF] px-6 py-2.5 text-sm font-bold transition shadow disabled:opacity-50"
            >
              {tracing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 stroke-[2.5]" />}
              <span>Tra cứu</span>
            </button>
          </form>

          {traceError && (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
              {traceError}
            </div>
          )}

          {traceResults && <div className="mt-5">{renderMatchesTable(traceResults, isAdminMode)}</div>}
        </div>

        {isAdminMode && (
          <div className="border-t border-white/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Biên lai gần đây trên hệ thống</h3>
                <p className="text-xs text-[#919099]">
                  15 biên lai mới nhất dùng cho quản trị viên kiểm tra nhanh hoặc tải PNG đối chiếu.
                </p>
              </div>
              <button
                type="button"
                onClick={loadRecentReceipts}
                disabled={loadingRecent || !isAuthenticated}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[.04] px-3 py-1.5 text-xs font-medium text-[#C7C5CF] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingRecent ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>
            {renderMatchesTable(recentReceipts, true)}
          </div>
        )}
      </section>
    </div>
  );
}
