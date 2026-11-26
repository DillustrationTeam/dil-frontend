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
import { useLanguage } from '@/context/language-context';

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

function getWatermarkTypeInfo(type: string | null | undefined, isVie: boolean) {
  switch (type) {
    case 'DwtPublish':
      return {
        label: isVie ? 'Ảnh trưng bày' : 'Gallery Artwork',
        accountLabel: isVie ? 'Người đăng' : 'Publisher',
        badgeClass: 'border-[#B24A26]/35 bg-[#B24A26]/10 text-[#A8321C]',
      };
    case 'DwtForensic':
      return {
        label: isVie ? 'Phiên xem tranh' : 'Viewing Session',
        accountLabel: isVie ? 'Người xem' : 'Viewer',
        badgeClass: 'border-[#2C6A86]/40 bg-[#2C6A86]/10 text-[#2C6A86]',
      };
    case 'DwtCommissionWip':
      return {
        label: isVie ? 'Bản nháp WIP' : 'WIP Draft',
        accountLabel: isVie ? 'Khách hàng' : 'Client',
        badgeClass: 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F]',
      };
    case 'DwtCommissionFinal':
      return {
        label: isVie ? 'Bàn giao cuối (ảnh)' : 'Final Delivery (Image)',
        accountLabel: isVie ? 'Khách nhận' : 'Recipient',
        badgeClass: 'border-[#2F6B63]/40 bg-[#2F6B63]/10 text-[#2F6B63]',
      };
    case 'HashCommissionFinal':
      return {
        label: isVie ? 'Bàn giao cuối (tệp gốc / ZIP)' : 'Final Delivery (Source / ZIP)',
        accountLabel: isVie ? 'Khách nhận' : 'Recipient',
        badgeClass: 'border-[#5F3F86]/40 bg-[#5F3F86]/10 text-[#5F3F86]',
      };
    default:
      return {
        label: type || (isVie ? 'Phiên xem tranh' : 'Viewing Session'),
        accountLabel: isVie ? 'Tài khoản' : 'Account',
        badgeClass: 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459]',
      };
  }
}

function getSourceLabel(ip: string, isVie: boolean): string {
  switch (ip) {
    case 'publish':
      return isVie ? 'Đăng công khai' : 'Public Publish';
    case 'backfill':
      return isVie ? 'Đồng bộ hệ thống' : 'System Backfill';
    case 'commission-wip':
      return isVie ? 'Nộp bản nháp' : 'WIP Submission';
    case 'commission-final':
      return isVie ? 'Bàn giao đơn' : 'Commission Delivery';
    case 'commission-bundle':
      return isVie ? 'Gói tải về' : 'Download Bundle';
    default:
      return ip;
  }
}

function isImageFile(file: File | null): boolean {
  if (!file) return false;
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name) || file.type.startsWith('image/');
}

function extractErrorMessage(err: unknown, fallback: string, isVie: boolean): string {
  const axiosErr = err as { response?: { status?: number; data?: { error?: { details?: string[] } } } };
  if (axiosErr?.response?.status === 401) {
    return isVie
      ? 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.'
      : 'Your session has expired or you are not signed in.';
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
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
        throw new Error(res.data?.error?.details?.join(', ') || (isVie ? 'Không thể kiểm tra tệp này.' : 'Unable to inspect this file.'));
      }
      setDecodeResult(res.data.data);
    } catch (err: unknown) {
      setDecodeError(extractErrorMessage(err, isVie ? 'Không thể kiểm tra tệp này.' : 'Unable to inspect this file.', isVie));
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
      setDecodeError(extractErrorMessage(err, isVie ? 'Không tải được ảnh mẫu để kiểm tra.' : 'Failed to load sample image for inspection.', isVie));
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
        throw new Error(res.data?.error?.details?.join(', ') || (isVie ? 'Không thể tra cứu biên lai.' : 'Unable to trace receipt.'));
      }
      setTraceResults(res.data.data);
    } catch (err: unknown) {
      setTraceError(extractErrorMessage(err, isVie ? 'Lỗi tra cứu biên lai.' : 'Error tracing receipt.', isVie));
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
      if (!d) throw new Error(isVie ? 'Không nhận được kết quả xử lý.' : 'No processing result returned.');
      setBackfillMsg(
        isVie
          ? `Đã xử lý ${d.processed}/${d.totalPending} tranh chưa có bản xem trước và cập nhật ${d.visualHashesUpdated ?? 0} dấu vân tay ảnh${
              d.skippedCount > 0 ? ` (bỏ qua ${d.skippedCount} tranh không đọc được tệp gốc)` : ''
            }.`
          : `Processed ${d.processed}/${d.totalPending} artworks without previews and updated ${d.visualHashesUpdated ?? 0} image fingerprints${
              d.skippedCount > 0 ? ` (skipped ${d.skippedCount} artworks with unreadable source files)` : ''
            }.`
      );
      await loadRecentReceipts();
    } catch (err: unknown) {
      setBackfillMsg(extractErrorMessage(err, isVie ? 'Không thể xử lý danh sách tranh cũ.' : 'Unable to process legacy artworks.', isVie));
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

  const getTypeInfo = (type?: string | null) => getWatermarkTypeInfo(type, isVie);

  const formatSource = (ip: string) => getSourceLabel(ip, isVie);

  const renderMatchesTable = (matches: ForensicTraceMatch[], showActions = false) => {
    if (matches.length === 0) {
      return (
        <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 text-sm text-[#746A5F]">
          {isVie ? 'Chưa có biên lai nào khớp.' : 'No matching receipts found.'}
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
            : m.viewerName || m.viewerEmail || (isVie ? 'Khách vãng lai (chưa đăng nhập)' : 'Guest (not signed in)');

          return (
            <div
              key={m.receiptId}
              className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 transition-colors hover:border-[#221E1A]/20"
            >
              {/* Hàng 1: Tên tác phẩm / đơn (bấm mở trang) + Loại + Thời gian */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  {targetHref ? (
                    <Link
                      href={targetHref}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#241F1A] hover:text-[#A8321C] hover:underline"
                    >
                      <span>{m.artworkTitle}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#B24A26]" />
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-[#241F1A]">{m.artworkTitle}</span>
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#B24A26]/30 bg-[#B24A26]/10 px-2.5 py-1 text-[11px] font-medium text-[#A8321C] transition hover:bg-[#B24A26]/20 disabled:opacity-50"
                        title={isVie ? 'Tải ảnh của biên lai này và chạy kiểm tra ngay' : 'Download this receipt image and run inspection now'}
                      >
                        {testingToken === m.receiptToken ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <FlaskConical className="h-3 w-3" />
                        )}
                        <span>{isVie ? 'Kiểm tra nhanh' : 'Quick Test'}</span>
                      </button>
                      <a
                        href={`${API_ORIGIN}/api/v1/artworks/${m.artworkId}/protected-image?token=${encodeURIComponent(
                          m.receiptToken
                        )}`}
                        download={`${m.receiptToken}.png`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-[11px] font-medium text-[#6E6459] transition hover:bg-[#F0E7D8] hover:text-[#241F1A]"
                        title={isVie ? 'Tải ảnh PNG đã gắn thuỷ vân' : 'Download watermarked PNG'}
                      >
                        <Download className="h-3 w-3" />
                        <span>{isVie ? 'Tải PNG' : 'Download PNG'}</span>
                      </a>
                    </>
                  )}
                  <span className="text-xs text-[#746A5F]">
                    {new Date(m.viewedAt).toLocaleString(isVie ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
              </div>

              {/* Hàng 2: Thông tin chính dễ đọc (Tác giả - Tài khoản - Nguồn) */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-[#746A5F]">{isVie ? 'Tác giả: ' : 'Creator: '}</span>
                  <span className="font-medium text-[#241F1A]">{m.creatorName}</span>
                </div>
                <div>
                  <span className="text-[#746A5F]">{typeInfo.accountLabel}: </span>
                  <span className="font-medium text-[#241F1A]">{accountDisplay}</span>
                </div>
                <div>
                  <span className="text-[#746A5F]">{isVie ? 'Nguồn: ' : 'Source: '}</span>
                  <span className="font-mono text-[#6E6459]">{formatSource(m.ipAddress)}</span>
                </div>
              </div>

              {/* Hàng 3: Thông số đối chiếu kỹ thuật (gọn nhẹ ở cuối card) */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#221E1A]/10 pt-2.5 text-[11px] text-[#746A5F]">
                <span> {isVie ? 'Biên lai: ' : 'Receipt: '}<code className="font-mono text-[#6E6459]">{m.receiptToken}</code>
                </span>
                {m.fileName && (
                  <span> {isVie ? 'Tệp: ' : 'File: '}<code className="font-mono text-[#6E6459]">{m.fileName}</code>
                  </span>
                )}
                {m.numericPayload != null && (
                  <span> {isVie ? 'Mã DWT: ' : 'DWT ID: '}<code className="font-mono text-[#A8321C]">{m.numericPayload}</code>
                  </span>
                )}
                {m.fileSha256 && (
                  <span className="inline-flex items-center gap-1">
                    SHA-256: <code className="font-mono text-[#6E6459]">{m.fileSha256.slice(0, 16)}…</code>
                    <button
                      type="button"
                      onClick={() => copyValue(m.fileSha256!)}
                      className="rounded p-0.5 text-[#746A5F] hover:bg-[#F0E7D8] hover:text-[#241F1A]"
                      title={isVie ? 'Sao chép đủ mã SHA-256' : 'Copy full SHA-256 hash'}
                    >
                      {copiedSha === m.fileSha256 ? (
                        <Check className="h-3 w-3 text-[#2F6B63]" />
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
      <header className="space-y-1.5 border-b border-[#221E1A]/10 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#241F1A]">
          {isVie ? 'Kiểm tra thuỷ vân và truy vết nguồn gốc' : 'Watermark Inspection & Provenance Tracing'}
        </h1>
        <p className="max-w-3xl text-sm text-[#746A5F]">
          {isVie
            ? 'Tải lên ảnh nghi bị rò rỉ, tệp gốc bàn giao hoặc gói .zip để đọc mã thuỷ vân ẩn và đối chiếu biên lai trên hệ thống.'
            : 'Upload a suspected leaked image, deliverable source file, or .zip archive to extract hidden watermark payloads and match system receipts.'}
        </p>
      </header>

      {hasHydrated && !isAuthenticated && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/20 px-5 py-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-[#241F1A]">
              {isVie ? 'Bạn chưa đăng nhập' : 'You are not signed in'}
            </p>
            <p className="text-xs text-[#6E6459]">
              {isVie
                ? 'Cần đăng nhập để tải tệp kiểm tra thuỷ vân và xem lịch sử biên lai của bạn.'
                : 'Sign in to upload files for watermark inspection and view your receipt history.'}
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#B24A26] px-4 py-2 text-xs font-semibold text-[#FFFCF6] transition hover:bg-[#c2c6eb]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{isVie ? 'Đăng nhập' : 'Sign In'}</span>
          </Link>
        </div>
      )}

      {isAdminMode && isStaff && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#B24A26]/25 bg-[#FFFCF6] px-5 py-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#241F1A]">
              {isVie ? 'Cập nhật bản thuỷ vân cho tranh cũ' : 'Backfill Watermarks for Legacy Artworks'}
            </p>
            <p className="text-xs text-[#746A5F]">
              {isVie
                ? 'Tạo bản xem trước giảm độ phân giải kèm mã DWT cho các tranh đã đăng từ trước để không hiển thị tệp gốc ngoài trang chủ.'
                : 'Generate lower-resolution previews with DWT payloads for previously published artworks so original files are not exposed on the gallery.'}
            </p>
            {backfillMsg && <p className="pt-1 text-xs text-[#A8321C]">{backfillMsg}</p>}
          </div>
          <button
            type="button"
            onClick={handleBackfillPreviews}
            disabled={backfilling}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#B24A26]/40 bg-[#B24A26]/15 px-4 py-2 text-xs font-semibold text-[#A8321C] transition hover:bg-[#B24A26]/25 disabled:opacity-50"
          >
            {backfilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span>
              {backfilling
                ? (isVie ? 'Đang xử lý...' : 'Processing...')
                : (isVie ? 'Chạy cho tranh cũ' : 'Run for Legacy Artworks')}
            </span>
          </button>
        </section>
      )}

      {/* Panel 1: Decode Suspect File */}
      <section className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6">
        <h2 className="text-base font-semibold text-[#241F1A]">
          {isVie ? '1. Kiểm tra tệp tin' : '1. Inspect File'}
        </h2>
        <p className="mt-1 text-xs text-[#746A5F]">
          {isVie
            ? 'Nhận ảnh (PNG, JPG, WEBP, GIF), tệp kỹ thuật số (PSD, PSB, CLIP, AI, PDF) và tệp .zip. Với ảnh chụp màn hình, có thể bật tăng tương phản kênh xanh dương để soi lớp chữ chìm.'
            : 'Accepts images (PNG, JPG, WEBP, GIF), digital source files (PSD, PSB, CLIP, AI, PDF), and .zip archives. For screenshots, enable blue-channel contrast boost to inspect faint watermark layers.'}
        </p>

        <form onSubmit={handleDecodeSubmit} className="mt-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilePick(e.dataTransfer.files?.[0] || null);
            }}
            className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#221E1A]/20 bg-[#FFFCF6] px-6 py-8 text-center transition-colors hover:border-[#B24A26]/60 hover:bg-[#FFFCF6]"
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
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2 py-1 text-[11px] text-[#6E6459] transition hover:bg-[#F0E7D8] hover:text-[#241F1A]"
                title={isVie ? 'Xoá tệp đã chọn' : 'Remove selected file'}
              >
                <X className="h-3 w-3" />
                <span>{isVie ? 'Xoá tệp' : 'Remove File'}</span>
              </button>
            )}
            <div className="mb-3 flex items-center gap-2 text-[#B24A26]">
              <ImageIcon className="h-5 w-5" />
              <FileCode2 className="h-5 w-5" />
              <FileArchive className="h-5 w-5" />
            </div>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#241F1A]">{selectedFile.name}</p>
                <p className="text-xs text-[#746A5F]">
                  {(selectedFile.size / 1024).toFixed(1)} KB, {isVie ? 'bấm để đổi tệp khác' : 'click to choose another file'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#241F1A]">
                  {isVie ? 'Kéo thả hoặc bấm để chọn tệp (tối đa 100 MB)' : 'Drag and drop or click to select a file (max 100 MB)'}
                </p>
                <p className="text-xs text-[#746A5F]">
                  {isVie ? 'PNG, JPG, WEBP, GIF, PSD, CLIP, AI, PDF hoặc ZIP' : 'PNG, JPG, WEBP, GIF, PSD, CLIP, AI, PDF, or ZIP'}
                </p>
              </div>
            )}
          </div>

          {isImageFile(selectedFile) && (
            <div className="space-y-3 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#6E6459]">
                  {isVie ? 'Xem trước ảnh' : 'Image Preview'}
                </span>
                <button
                  type="button"
                  onClick={() => setBoostScreenshot((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    boostScreenshot
                      ? 'border-[#B24A26] bg-[#B24A26]/20 text-[#241F1A]'
                      : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#6E6459] hover:bg-[#F0E7D8]'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>
                    {boostScreenshot
                      ? (isVie ? 'Tắt chế độ soi chữ chìm' : 'Disable Watermark Boost')
                      : (isVie ? 'Soi chữ chìm ảnh chụp màn hình' : 'Boost Screenshot Watermark')}
                  </span>
                </button>
              </div>
              <canvas
                ref={previewCanvasRef}
                className="mx-auto max-h-80 w-auto rounded-lg border border-[#221E1A]/10 object-contain"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!selectedFile || decoding || !isAuthenticated}
              className="inline-flex items-center gap-2 rounded-xl bg-[#B24A26] px-5 py-2.5 text-sm font-semibold text-[#FFFCF6] transition hover:bg-[#c2c6eb] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {decoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>
                {decoding
                  ? (isVie ? 'Đang kiểm tra...' : 'Inspecting...')
                  : (isVie ? 'Kiểm tra thuỷ vân' : 'Inspect Watermark')}
              </span>
            </button>
          </div>
        </form>

        {decodeError && (
          <div className="mt-4 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/20 p-4 text-sm text-[#A8321C]">
            {decodeError}
          </div>
        )}

        {decodeResult && (
          <div className="mt-6 space-y-4 border-t border-[#221E1A]/10 pt-5">
            <div
              className={`flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4 ${
                decodeResult.found && decodeResult.matches.length > 0
                  ? 'border-[#2F6B63]/40 bg-[#2F6B63]/20'
                  : 'border-[#8A6A1F]/40 bg-[#8A6A1F]/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {decodeResult.found && decodeResult.matches.length > 0 ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6B63]" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6A1F]" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#241F1A]">
                    {decodeResult.found && decodeResult.matches.length > 0
                      ? (isVie ? `Khớp nguồn gốc (${decodeResult.matchMethod})` : `Origin Matched (${decodeResult.matchMethod})`)
                      : (isVie ? 'Không tìm thấy biên lai nào khớp' : 'No matching receipt found')}
                  </p>
                  {decodeResult.message && (
                    <p className="text-xs leading-relaxed text-[#6E6459]">{decodeResult.message}</p>
                  )}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs text-[#6E6459]">
                    {decodeResult.extractedPayload && (
                      <span>
                        {isVie ? 'DWT đọc được: ' : 'Extracted DWT: '}
                        <code className="font-mono text-[#A8321C]">{decodeResult.extractedPayload}</code>
                      </span>
                    )}
                    <span>
                      SHA-256: <code className="font-mono text-[#241F1A]">{decodeResult.fileSha256}</code>
                    </span>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1 text-xs font-medium text-[#241F1A]">
                {isVie
                  ? `${decodeResult.totalMatches} biên lai khớp`
                  : `${decodeResult.totalMatches} matching receipt${decodeResult.totalMatches === 1 ? '' : 's'}`}
              </span>
            </div>

            {decodeResult.matches.length > 0 && renderMatchesTable(decodeResult.matches)}
          </div>
        )}
      </section>

      {/* Panel 2: Trace Receipt + Recent Receipts */}
      <section className="space-y-6 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#B24A26]" />
            <h2 className="text-base font-semibold text-[#241F1A]">
              {isVie ? '2. Tra cứu lịch sử biên lai' : '2. Trace Receipt History'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#746A5F]">
            {isVie
              ? 'Tìm theo mã biên lai (WR-..., PUB-..., WIP-..., FIN-...), mã tác phẩm hoặc mã đơn hàng.'
              : 'Search by receipt token (WR-..., PUB-..., WIP-..., FIN-...), artwork ID, or commission ID.'}
          </p>

          {/* Hộp ghi chú hướng dẫn lấy mã rõ ràng */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-[#746A5F]">
              <span className="font-bold text-[#241F1A] block mb-0.5">
                {isVie ? '📌 Lấy Mã đơn hàng (#CMD-...):' : '📌 Finding Commission ID (#CMD-...):'}
              </span>{' '}
              {isVie ? (
                <>Vào <strong>Phòng làm việc</strong> hoặc <strong>Đơn vẽ của tôi</strong>, copy mã hiển thị trên đầu đơn (ví dụ: <code className="text-[#B24A26] font-mono">#CMD-454C01A4</code>).</>
              ) : (
                <>Open <strong>Workroom</strong> or <strong>My Commissions</strong> and copy the code shown at the top of the order (e.g. <code className="text-[#B24A26] font-mono">#CMD-454C01A4</code>).</>
              )}
            </div>
            <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-[#746A5F]">
              <span className="font-bold text-[#241F1A] block mb-0.5">
                {isVie ? '🔍 Lấy Mã biên lai (FIN-... / WIP-...):' : '🔍 Finding Receipt Token (FIN-... / WIP-...):'}
              </span>{' '}
              {isVie
                ? 'Tự động sinh khi nộp phác thảo hoặc tải tệp bàn giao. Hoặc kéo ảnh nghi vấn thả vào mục 1 ở trên để quét tự động.'
                : 'Automatically generated when submitting WIP drafts or downloading deliverable files. Or drag a suspect image into Section 1 above to scan automatically.'}
            </div>
          </div>

          <form onSubmit={handleTraceSearch} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={traceInput}
              onChange={(e) => setTraceInput(e.target.value)}
              placeholder={
                isVie
                  ? 'Nhập mã đơn hàng (ví dụ: #CMD-454C01A4) hoặc mã biên lai (FIN-..., WIP-...)...'
                  : 'Enter commission ID (e.g. #CMD-454C01A4) or receipt token (FIN-..., WIP-...)...'
              }
              className="flex-1 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2.5 text-sm text-[#241F1A] placeholder-[#746A5F] outline-none focus:border-[#B24A26]"
            />

            <button
              type="submit"
              disabled={!traceInput.trim() || tracing || !isAuthenticated}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#B24A26] text-[#F7F2E9] hover:bg-[#8C3718] px-6 py-2.5 text-sm font-bold transition shadow disabled:opacity-50"
            >
              {tracing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 stroke-[2.5]" />}
              <span>{isVie ? 'Tra cứu' : 'Trace'}</span>
            </button>
          </form>

          {traceError && (
            <div className="mt-4 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/20 p-4 text-sm text-[#A8321C]">
              {traceError}
            </div>
          )}

          {traceResults && <div className="mt-5">{renderMatchesTable(traceResults, isAdminMode)}</div>}
        </div>

        {isAdminMode && (
          <div className="border-t border-[#221E1A]/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#241F1A]">
                  {isVie ? 'Biên lai gần đây trên hệ thống' : 'Recent System Receipts'}
                </h3>
                <p className="text-xs text-[#746A5F]">
                  {isVie
                    ? '15 biên lai mới nhất dùng cho quản trị viên kiểm tra nhanh hoặc tải PNG đối chiếu.'
                    : 'Latest 15 receipts for administrators to quick-test or download PNGs for verification.'}
                </p>
              </div>
              <button
                type="button"
                onClick={loadRecentReceipts}
                disabled={loadingRecent || !isAuthenticated}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1.5 text-xs font-medium text-[#6E6459] transition hover:bg-[#F0E7D8] hover:text-[#241F1A] disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingRecent ? 'animate-spin' : ''}`} />
                <span>{isVie ? 'Làm mới' : 'Refresh'}</span>
              </button>
            </div>
            {renderMatchesTable(recentReceipts, true)}
          </div>
        )}
      </section>
    </div>
  );
}
