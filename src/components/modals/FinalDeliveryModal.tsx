'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Search,
  Grid,
  List,
  Plus,
  Trash2,
  HardDrive,
  FolderOpen,
  Download,
  File,
} from 'lucide-react';
import { commissionService } from '@/services/commission.service';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Commission, CommissionStatus } from '@/types/commission.types';
import DigitalCertificateModal from './DigitalCertificateModal';

export interface DriveFileItem {
  id: string;
  name: string;
  size: number; // bytes
  sha256?: string;
  type: 'psd' | 'image' | 'zip' | 'pdf' | 'other';
  extension: string;
  updatedAt: string;
  isCertificate?: boolean;
}

export interface FinalDeliveryActionResult {
  action: 'delivered' | 'deleted' | 'completed';
  summary?: string;
}

interface FinalDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  isCreator?: boolean;
  commissionStatus?: CommissionStatus;
  commission?: Commission | null;
  onOpenReviewModal?: () => void;
  onSuccess?: (result: FinalDeliveryActionResult) => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const MAX_FINAL_TOTAL_BYTES = 1024 * 1024 * 1024; // 1 GB
const ALLOWED_FINAL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.psd', '.psb', '.pdf', '.ai', '.clip', '.zip'] as const;
const ALLOWED_FINAL_ACCEPT = ALLOWED_FINAL_EXTENSIONS.join(',');

function getFileType(filename: string): 'psd' | 'image' | 'zip' | 'pdf' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['psd', 'psb', 'ai', 'clip', 'sai'].includes(ext)) return 'psd';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

export default function FinalDeliveryModal({
  isOpen,
  onClose,
  commissionId,
  isCreator = true,
  commissionStatus = 'InProgress',
  commission,
  onOpenReviewModal,
  onSuccess,
}: FinalDeliveryModalProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'psd' | 'image' | 'zip' | 'pdf'>('all');
  const [stagedUploads, setStagedUploads] = useState<File[]>([]);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [manifestVersion, setManifestVersion] = useState('');
  const [inspectedConfirmed, setInspectedConfirmed] = useState(false);
  const [downloadedVersion, setDownloadedVersion] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadExpiresAt, setDownloadExpiresAt] = useState<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<{ url: string; fileName: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [, setUploaded] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadDeliverables = isCreator && (commissionStatus === 'InProgress' || commissionStatus === 'Delivered');

  // Derived real data from commission
  const artworkTitle = commission?.title?.trim() || 'Tác phẩm hoa sĩ';
  const fileBaseName = useMemo(() => {
    return (
      artworkTitle
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_') || 'Artwork'
    );
  }, [artworkTitle]);
  const certCode = `COA-2026-${(commission?.id || commissionId || '99824').slice(0, 8).toUpperCase()}`;

  const applyManifestToDrive = React.useCallback(
    (manifest?: {
      version: string;
      files: Array<{ id: string; name: string; sizeBytes: number; sha256: string; uploadedAt: string }>;
    } | null) => {
      const list: DriveFileItem[] = (manifest?.files ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        size: f.sizeBytes,
        sha256: f.sha256,
        type: getFileType(f.name),
        extension: f.name.split('.').pop()?.toLowerCase() || 'file',
        updatedAt: f.uploadedAt,
      }));
      if (commissionStatus === 'Completed') {
        list.push({
          id: `file-cert-${commissionId}`,
          name: `Certificate_${certCode}.pdf`,
          size: 2450000,
          type: 'pdf',
          extension: 'pdf',
          updatedAt: new Date().toISOString(),
          isCertificate: true,
        });
      }
      const nextVer = manifest?.version ?? '';
      setManifestVersion((prev) => {
        if (prev && prev !== nextVer) setInspectedConfirmed(false);
        return nextVer;
      });
      setFiles(list);
      try {
        if (nextVer && localStorage.getItem(`dil_dl_ver_${commissionId}`) === nextVer) {
          setDownloadedVersion(nextVer);
        } else {
          setDownloadedVersion('');
        }
      } catch { }
    },
    [commissionId, certCode, commissionStatus]
  );

  // Hydrate real unbundled deliverables manifest from backend
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    commissionService
      .getDeliverables(commissionId)
      .then((manifest) => {
        if (!cancelled) applyManifestToDrive(manifest);
      })
      .catch(() => {
        if (!cancelled) applyManifestToDrive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, commissionId, commission?.milestones, applyManifestToDrive]);

  useEffect(() => {
    if (!isOpen || !downloadExpiresAt) return;
    const targetMs = new Date(downloadExpiresAt).getTime();
    if (Number.isNaN(targetMs)) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= targetMs) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, downloadExpiresAt]);

  const stageIncomingFiles = (incoming: File[]) => {
    const rejected: string[] = [];
    const oversized: string[] = [];
    const accepted: File[] = [];
    let runningBytes = stagedUploads.reduce((sum, f) => sum + f.size, 0);

    for (const file of incoming) {
      const dotIdx = file.name.lastIndexOf('.');
      const ext = dotIdx >= 0 ? file.name.slice(dotIdx).toLowerCase() : '';
      if (!ext || !(ALLOWED_FINAL_EXTENSIONS as readonly string[]).includes(ext) || file.size <= 0) {
        rejected.push(file.name);
        continue;
      }
      if (runningBytes + file.size > MAX_FINAL_TOTAL_BYTES) {
        oversized.push(file.name);
        continue;
      }
      runningBytes += file.size;
      accepted.push(file);
    }

    const warnings: string[] = [];
    if (rejected.length > 0) {
      warnings.push(`Không hỗ trợ hoặc tệp rỗng (chỉ nhận PNG, JPG, WEBP, PSD, PSB, AI, CLIP, PDF, ZIP): ${rejected.join(', ')}`);
    }
    if (oversized.length > 0) {
      warnings.push(`Tổng dung lượng vượt quá 1 GB: ${oversized.join(', ')}`);
    }
    setDownloadError(warnings.length > 0 ? warnings.join(' • ') : null);

    if (accepted.length > 0) {
      setStagedUploads((prev) => [...prev, ...accepted]);
    }
  };

  // Handle Multi-file Selection by Creator
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadDeliverables) return;
    if (e.target.files && e.target.files.length > 0) {
      stageIncomingFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canUploadDeliverables) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stageIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const markVersionDownloaded = () => {
    if (!manifestVersion) return;
    setDownloadedVersion(manifestVersion);
    try {
      localStorage.setItem(`dil_dl_ver_${commissionId}`, manifestVersion);
    } catch { }
  };

  // Upload all staged files individually (no forced zipping) so Creator can freely add/remove until Client completes
  const handleUploadStagedFiles = async () => {
    if (stagedUploads.length === 0 || !canUploadDeliverables) return;
    setIsUploading(true);
    setDownloadError(null);

    try {
      const summary = stagedUploads.map((f) => `${f.name} (${formatFileSize(f.size)})`).join(', ');
      await commissionService.deliverFinal(commissionId, stagedUploads);
      const updatedManifest = await commissionService.getDeliverables(commissionId);
      applyManifestToDrive(updatedManifest);
      setStagedUploads([]);
      setUploaded(true);

      onSuccess?.({ action: 'delivered', summary: `${stagedUploads.length} tệp: ${summary}` });
    } catch (error) {
      console.error(error);
      setDownloadError(getApiErrorMessage(error, 'Tải lên bàn giao thất bại. Vui lòng kiểm tra định dạng tệp và thử lại.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const deliverableCount = files.filter((f) => !f.isCertificate).length;

  const handleDeleteDriveFile = async (item: DriveFileItem) => {
    if (!canUploadDeliverables || commissionStatus !== 'Delivered' || item.isCertificate) return;
    if (deliverableCount <= 1) {
      setDownloadError('Phải giữ lại ít nhất 1 tệp bàn giao. Hãy tải tệp mới lên trước khi xóa tệp cũ.');
      return;
    }
    setDeletingFileId(item.id);
    setDownloadError(null);
    try {
      const updatedManifest = await commissionService.deleteDeliverable(commissionId, item.id);
      applyManifestToDrive(updatedManifest);
      onSuccess?.({ action: 'deleted', summary: item.name });
    } catch (err) {
      setDownloadError(getApiErrorMessage(err, 'Không thể xóa tệp khỏi kho bàn giao.'));
    } finally {
      setDeletingFileId(null);
    }
  };

  const triggerDownload = (url: string, fileName: string, expiresAt: string) => {
    window.setTimeout(() => setNowMs(Date.now()), 0);
    setDownloadExpiresAt(expiresAt);
    setActiveDownload({ url, fileName });
    setCopiedLink(false);
    markVersionDownloaded();

    // Hidden iframe avoids popup blockers after async await while Content-Disposition: attachment triggers download safely
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    window.setTimeout(() => iframe.remove(), 60_000);
  };

  const handleDownloadFile = async (item: DriveFileItem) => {
    if (item.isCertificate) {
      setShowCertPreview(true);
      return;
    }

    setDownloadingFileId(item.id);
    setDownloadError(null);
    try {
      const { downloadUrl, expiresAt } = await commissionService.getFinalDownloadUrl(commissionId, item.id);
      triggerDownload(downloadUrl, item.name, expiresAt);
    } catch (error) {
      setDownloadExpiresAt(null);
      setActiveDownload(null);
      setDownloadError(
        getApiErrorMessage(
          error,
          'Không thể tạo liên kết tải. Có thể họa sĩ chưa upload tệp lên máy chủ hoặc liên kết hết hạn.'
        )
      );
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDownloadAllZip = async () => {
    setDownloadingFileId('all-zip');
    setDownloadError(null);
    try {
      const { downloadUrl, expiresAt } = await commissionService.getFinalDownloadUrl(commissionId);
      triggerDownload(downloadUrl, `${fileBaseName}_Deliverables.zip`, expiresAt);
    } catch (error) {
      setDownloadExpiresAt(null);
      setActiveDownload(null);
      setDownloadError(
        getApiErrorMessage(error, 'Chưa thể tạo gói tải toàn bộ. Vui lòng thử lại sau.')
      );
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleCompleteCommission = async () => {
    if (!inspectedConfirmed) {
      setDownloadError('Vui lòng tải kiểm tra kỹ toàn bộ tệp và đánh dấu xác nhận trước khi hoàn tất đơn hàng.');
      return;
    }
    setIsCompleting(true);
    setDownloadError(null);
    try {
      await commissionService.complete(commissionId, manifestVersion || undefined);
      onSuccess?.({ action: 'completed' });
    } catch (err) {
      setDownloadError(getApiErrorMessage(err, 'Không thể hoàn tất nghiệm thu. Danh sách tệp có thể vừa được cập nhật.'));
      setInspectedConfirmed(false);
      commissionService.getDeliverables(commissionId).then(applyManifestToDrive).catch(() => null);
    } finally {
      setIsCompleting(false);
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalDriveSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#E5D8C2] backdrop-blur-md animate-fadeIn">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (isCreator) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDropFiles}
        className={`relative w-full max-w-5xl bg-[#FFFCF6] border ${
          isDragOver ? 'border-[#B24A26] shadow-[0_0_30px_rgba(167,172,217,0.3)]' : 'border-[#221E1A]/10'
        } rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all`}
      >
        {/* DRIVE HEADER BAR */}
        <div className="px-5 py-4 border-b border-[#221E1A]/10 flex flex-wrap items-center justify-between gap-3 bg-[#FFFCF6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B24A26]/15 border border-[#B24A26]/30 flex items-center justify-center text-[#B24A26]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#241F1A] flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-[#B24A26]" /> Kho Tệp Bàn giao (Deliverables Drive) </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#2F6B63]/10 border border-[#2F6B63]/35 text-[#2F6B63]">
                  {files.length} tệp • {formatFileSize(totalDriveSize)}
                </span>
              </div>
              <p className="text-xs text-[#746A5F] mt-0.5"> Đơn hàng: <strong className="text-[#6E6459]">{artworkTitle}</strong> • Mã #{commissionId.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F0E7D8] p-1 rounded-xl border border-[#221E1A]/10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-[#B24A26] text-[#F7F2E9]' : 'text-[#746A5F] hover:text-[#241F1A]'
                }`}
                title="Dạng ô lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-[#B24A26] text-[#F7F2E9]' : 'text-[#746A5F] hover:text-[#241F1A]'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Creator Upload Trigger */}
            {canUploadDeliverables && (
              <>
                <input
                  type="file"
                  multiple
                  accept={ALLOWED_FINAL_ACCEPT}
                  ref={fileInputRef}
                  onChange={handleSelectFiles}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Thêm tệp </button>
              </>
            )}

            {/* Download All ZIP */}
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={downloadingFileId === 'all-zip'}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] border border-[#221E1A]/10 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#B24A26]" />
              <span className="hidden sm:inline">Tải toàn bộ (.ZIP)</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] flex items-center justify-center transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DRIVE SEARCH & FILTER TOOLBAR */}
        <div className="px-5 py-3 border-b border-[#221E1A]/10 bg-[#FFFCF6] flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-[#746A5F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm tệp trong drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-xs text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-[#B24A26]"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-[#F0E7D8] text-[#241F1A] border border-[#221E1A]/20'
                  : 'text-[#746A5F] hover:text-[#6E6459]'
              }`}
            >
              Tất cả ({files.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('psd')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'psd'
                  ? 'bg-[#2C6A86]/20 text-[#2C6A86] border border-[#2C6A86]/40'
                  : 'text-[#746A5F] hover:text-[#2C6A86]'
              }`}
            >
              Master PSD/AI ({files.filter((f) => f.type === 'psd').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('image')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'image'
                  ? 'bg-[#2F6B63]/20 text-[#2F6B63] border border-[#2F6B63]/40'
                  : 'text-[#746A5F] hover:text-[#2F6B63]'
              }`}
            >
              Hình ảnh PNG ({files.filter((f) => f.type === 'image').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('zip')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'zip'
                  ? 'bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40'
                  : 'text-[#746A5F] hover:text-[#8A6A1F]'
              }`}
            >
              Nén ZIP ({files.filter((f) => f.type === 'zip').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('pdf')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'pdf'
                  ? 'bg-[#5F3F86]/20 text-[#5F3F86] border border-[#5F3F86]/40'
                  : 'text-[#746A5F] hover:text-[#5F3F86]'
              }`}
            >
              Chứng chỉ PDF ({files.filter((f) => f.type === 'pdf').length})
            </button>
          </div>
        </div>

        {/* DRIVE CONTENT WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Creator Staged Files Banner (If creator dropped/picked new files) */}
          {canUploadDeliverables && stagedUploads.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#B24A26]/10 border border-[#B24A26]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#B24A26] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 animate-bounce" /> Đã chọn {stagedUploads.length} tệp mới để thêm vào Drive
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStagedUploads([])}
                    className="text-xs text-[#746A5F] hover:text-[#A8321C]"
                  > Hủy bỏ </button>
                  <button
                    type="button"
                    onClick={handleUploadStagedFiles}
                    disabled={isUploading}
                    className="px-4 py-1.5 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tải lên... </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lưu &amp; Bàn giao vào Drive
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Staged file chips */}
              <div className="flex flex-wrap gap-2">
                {stagedUploads.map((staged, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0E7D8] border border-[#221E1A]/10 text-xs text-[#241F1A]"
                  >
                    <File className="w-3.5 h-3.5 text-[#B24A26]" />
                    <span className="font-medium truncate max-w-[160px]">{staged.name}</span>
                    <span className="text-[10px] text-[#746A5F]">({formatFileSize(staged.size)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStagedFile(i)}
                      className="text-[#746A5F] hover:text-[#A8321C]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag & Drop Hint for Creator */}
          {canUploadDeliverables && stagedUploads.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl border border-dashed border-[#221E1A]/10 hover:border-[#B24A26]/50 bg-[#FFFCF6] hover:bg-[#FFFCF6] text-center cursor-pointer transition-all"
            >
              <p className="text-xs text-[#746A5F]">
                <span className="text-[#B24A26] font-semibold">{commissionStatus === 'Delivered' ? '+ Tải lên gói tệp mới để cập nhật bản bàn giao' : '+ Kéo thả nhiều tệp gốc vào đây'}</span> hoặc bấm để chọn tệp (PSD, PSB, AI, CLIP, PNG, JPG, WEBP, PDF, ZIP — tổng tối đa 1 GB, không cần tự nén ZIP) </p>
            </div>
          )}

          {/* VIEW: GRID VIEW (Google Drive Style Cards) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((fileItem) => {
                const isDownloadingThis = downloadingFileId === fileItem.id;

                return (
                  <div
                    key={fileItem.id}
                    className="group bg-[#FFFCF6] hover:bg-[#FFFCF6] border border-[#221E1A]/10 hover:border-[#B24A26]/40 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-lg relative"
                  >
                    {/* Top Tag & Delete (if creator) */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                          fileItem.type === 'psd'
                            ? 'bg-[#2C6A86]/15 text-[#2C6A86] border border-[#2C6A86]/35'
                            : fileItem.type === 'image'
                            ? 'bg-[#2F6B63]/15 text-[#2F6B63] border border-[#2F6B63]/35'
                            : fileItem.type === 'zip'
                            ? 'bg-[#8A6A1F]/15 text-[#8A6A1F] border border-[#8A6A1F]/35'
                            : fileItem.type === 'pdf'
                            ? 'bg-[#5F3F86]/15 text-[#5F3F86] border border-[#5F3F86]/35'
                            : 'bg-[#F0E7D8] text-[#746A5F]'
                        }`}
                      >
                        {fileItem.extension.toUpperCase() || 'FILE'}
                      </span>

                      {canUploadDeliverables && commissionStatus === 'Delivered' && !fileItem.isCertificate && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDriveFile(fileItem)}
                          disabled={deletingFileId === fileItem.id || deliverableCount <= 1}
                          className="opacity-70 group-hover:opacity-100 p-1 text-[#746A5F] hover:text-[#A8321C] transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                          title={deliverableCount <= 1 ? 'Phải giữ ít nhất 1 tệp; hãy tải tệp mới trước khi xóa' : 'Gỡ tệp này khỏi kho'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* File Icon & Name */}
                    <div className="space-y-1.5 flex-1">
                      <h4
                        className="text-[#241F1A] font-bold text-xs md:text-sm line-clamp-2 break-all group-hover:text-[#B24A26] transition-colors"
                        title={fileItem.name}
                      >
                        {fileItem.name}
                      </h4>
                      <p className="text-[11px] text-[#746A5F]">
                        {formatFileSize(fileItem.size)} • {new Date(fileItem.updatedAt).toLocaleDateString('vi-VN')}
                      </p>
                      {fileItem.sha256 && (
                        <p className="text-[10px] font-mono text-[#746A5F]">
                          SHA-256: {fileItem.sha256.slice(0, 12)}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-[#221E1A]/10">
                      {fileItem.isCertificate ? (
                        <button
                          type="button"
                          onClick={() => setShowCertPreview(true)}
                          className="w-full py-2 px-3 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#241F1A] border border-[#221E1A]/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#5F3F86]" />
                          Xem &amp; Xuất COA
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(fileItem)}
                          disabled={isDownloadingThis}
                          className="w-full py-2 px-3 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isDownloadingThis ? 'Đang tạo liên kết...' : 'Tải xuống'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: LIST VIEW (Drive Explorer Table) */}
          {viewMode === 'list' && (
            <div className="overflow-x-auto rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFFCF6] text-[#746A5F] uppercase text-[10px] tracking-wider border-b border-[#221E1A]/10">
                  <tr>
                    <th className="py-3 px-4">Tên tệp</th>
                    <th className="py-3 px-4">Loại</th>
                    <th className="py-3 px-4">Kích thước</th>
                    <th className="py-3 px-4">Ngày cập nhật</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221E1A]/10">
                  {filteredFiles.map((fileItem) => {
                    const isDownloadingThis = downloadingFileId === fileItem.id;

                    return (
                      <tr key={fileItem.id} className="hover:bg-[#FFFCF6] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#241F1A] flex items-center gap-2">
                          <File className="w-4 h-4 text-[#B24A26] shrink-0" />
                          <span className="truncate max-w-[280px]" title={fileItem.name}>
                            {fileItem.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] text-[#746A5F]">
                          {fileItem.extension}
                        </td>
                        <td className="py-3 px-4 text-[#746A5F]">{formatFileSize(fileItem.size)}</td>
                        <td className="py-3 px-4 text-[#746A5F]">
                          {new Date(fileItem.updatedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {fileItem.isCertificate ? (
                              <button
                                type="button"
                                onClick={() => setShowCertPreview(true)}
                                className="px-3 py-1 rounded-lg bg-[#F0E7D8] hover:bg-[#F0E7D8] text-[#241F1A] text-xs font-semibold flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" /> Xuất COA </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(fileItem)}
                                disabled={isDownloadingThis}
                                className="px-3 py-1 rounded-lg bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                              >
                                <Download className="w-3.5 h-3.5" />
                                {isDownloadingThis ? 'Đang tạo...' : 'Tải về'}
                              </button>
                            )}

                            {canUploadDeliverables && commissionStatus === 'Delivered' && !fileItem.isCertificate && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDriveFile(fileItem)}
                                disabled={deletingFileId === fileItem.id || deliverableCount <= 1}
                                className="p-1 text-[#746A5F] hover:text-[#A8321C] disabled:opacity-30 disabled:cursor-not-allowed"
                                title={deliverableCount <= 1 ? 'Phải giữ ít nhất 1 tệp; hãy tải tệp mới trước khi xóa' : 'Gỡ tệp này khỏi kho'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {files.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFFCF6] border border-[#221E1A]/10 flex items-center justify-center text-[#746A5F]">
                <FolderOpen className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-[#6E6459]">Kho tệp hiện đang trống</p>
              <p className="text-xs text-[#746A5F] max-w-sm mx-auto">
                {isCreator
                  ? 'Chưa có tệp nào trong kho. Bấm nút "+ Thêm tệp" hoặc kéo thả tệp vào khung để tải lên cho khách hàng.'
                  : 'Họa sĩ chưa tải lên tệp bàn giao nào cho đơn hàng này.'}
              </p>
              {canUploadDeliverables && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B24A26] hover:bg-[#8C3718] text-[#F7F2E9] text-xs font-bold transition-all shadow"
                >
                  <Plus className="w-4 h-4" /> Bắt đầu thêm tệp </button>
              )}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-[#746A5F]" />
              <p className="text-sm font-semibold text-[#746A5F]">Không tìm thấy tệp phù hợp</p>
              <p className="text-xs text-[#746A5F]">Hãy thử tìm từ khóa khác hoặc xóa bộ lọc.</p>
            </div>
          ) : null}

          {/* Security & Expiry Reassurance */}
          {(() => {
            const remainingSec = downloadExpiresAt
              ? Math.max(0, Math.ceil((new Date(downloadExpiresAt).getTime() - nowMs) / 1000))
              : null;
            const mm = remainingSec !== null ? String(Math.floor(remainingSec / 60)).padStart(2, '0') : '00';
            const ss = remainingSec !== null ? String(remainingSec % 60).padStart(2, '0') : '00';
            const pct = remainingSec !== null ? Math.min(100, Math.max(0, (remainingSec / 900) * 100)) : 0;
            const isExpiringSoon = remainingSec !== null && remainingSec > 0 && remainingSec <= 120;
            const isExpired = remainingSec === 0;

            return (
              <div className="relative overflow-hidden space-y-2.5 p-3.5 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-xs text-[#746A5F]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2C6A86] shrink-0" />
                    <span>Mỗi lần tải tệp, hệ thống tạo một liên kết bảo mật có hiệu lực trong 15 phút.</span>
                  </div>
                  {downloadExpiresAt && remainingSec !== null && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#A8321C]/40 bg-[#A8321C]/10 px-2.5 py-1 text-[#A8321C] font-medium"> Liên kết đã hết hạn — bấm Tải xuống để tạo lại </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 font-medium ${
                            isExpiringSoon
                              ? 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F]'
                              : 'border-[#2F6B63]/40 bg-[#2F6B63]/10 text-[#2F6B63]'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full animate-pulse ${
                              isExpiringSoon ? 'bg-[#8A6A1F]/10' : 'bg-[#2F6B63]/10'
                            }`}
                          />
                          <span className="font-mono tabular-nums font-bold">
                            {mm}:{ss}
                          </span>
                          <span className="text-[11px] opacity-80">
                            (đến {new Date(downloadExpiresAt).toLocaleTimeString('vi-VN')})
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {activeDownload && !isExpired && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#221E1A]/10 bg-[#F0E7D8]/25 px-3 py-2 text-[11px]">
                    <span className="text-[#746A5F] truncate max-w-[420px]"> Trình duyệt chưa tự tải <strong className="text-[#241F1A]">{activeDownload.fileName}</strong>?
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={activeDownload.url}
                        download={activeDownload.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-[#B24A26]/20 hover:bg-[#B24A26]/30 border border-[#B24A26]/40 px-2.5 py-1 font-semibold text-[#8C3718] transition-colors"
                      > Bấm tải trực tiếp </a>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(activeDownload.url).then(() => {
                            setCopiedLink(true);
                            window.setTimeout(() => setCopiedLink(false), 2000);
                          });
                        }}
                        className="rounded-md bg-[#FFFCF6] hover:bg-[#F0E7D8] border border-[#221E1A]/10 px-2.5 py-1 text-[#746A5F] transition-colors"
                      >
                        {copiedLink ? 'Đã copy' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                )}
                {downloadExpiresAt && remainingSec !== null && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFCF6]">
                    <div
                      className={`h-full transition-[width] duration-1000 ease-linear ${
                        isExpired ? 'bg-[#A8321C]/10' : isExpiringSoon ? 'bg-[#8A6A1F]/10' : 'bg-[#2F6B63]/10'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {downloadError && (
            <div className="p-3.5 bg-[#A8321C]/10 border border-[#A8321C]/30 rounded-xl text-xs text-[#A8321C]">
              {downloadError}
            </div>
          )}

          {/* CREATOR DELIVERABLE NOTICE (distinct from Client warning) */}
          {isCreator && (commissionStatus === 'InProgress' || commissionStatus === 'Delivered') && (
            <div className="space-y-1.5 border-t border-[#B24A26]/25 bg-[#FFFCF6]/60 p-4 rounded-2xl text-xs">
              <p className="font-bold text-[#8C3718]">Lưu ý dành cho Họa sĩ</p>
              <p className="text-[#746A5F] leading-relaxed">
                {commissionStatus === 'Delivered'
                  ? `Bạn vẫn có thể thêm hoặc gỡ tệp lẻ cho đến khi khách hàng bấm hoàn tất. Mọi thay đổi sẽ tự động cập nhật mã phiên bản bàn giao${manifestVersion ? ` (#${manifestVersion.slice(0, 8)})` : ''} và thông báo cho khách hàng kiểm tra lại — kho tệp sẽ khóa vĩnh viễn ngay khi đơn hoàn tất.`
                  : 'Hãy tải lên đầy đủ các tệp vẽ gốc chất lượng cao (có thể chọn nhiều tệp cùng lúc, không cần tự nén ZIP). Hệ thống tự động kiểm tra chữ ký định dạng và tạo mã kiểm chứng SHA-256 cho từng tệp.'}
              </p>
            </div>
          )}

          {/* CLIENT ACCEPTANCE WORKFLOW */}
          {!isCreator && commissionStatus === 'Delivered' && (
            <div className="space-y-3 border-t border-[#8A6A1F]/35 bg-[#FFFCF6]/60 p-4 rounded-2xl">
              <div className="rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-3 text-xs text-[#8A6A1F] space-y-1.5">
                <p className="font-bold text-[#8A6A1F]">Lưu ý quan trọng dành cho Khách hàng: Kiểm tra kỹ tệp trước khi xác nhận hoàn tất</p>
                <p className="text-[#8A6A1F] leading-relaxed"> Vui lòng tải xuống và mở kiểm tra từng tệp gốc (đúng kích thước, độ phân giải, đầy đủ lớp và không bị lỗi/giả mạo). Sau khi bạn bấm hoàn tất, tiền ký quỹ sẽ được giải ngân cho họa sĩ, kho tệp sẽ khóa chỉnh sửa và giao dịch không thể hoàn tác. </p>
                {manifestVersion && downloadedVersion !== manifestVersion && (
                  <p className="font-semibold text-[#A8321C]">
                    Bạn chưa tải xuống tệp nào từ phiên bản bàn giao mới nhất (#{manifestVersion.slice(0, 8)}).
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-start gap-2.5 text-xs text-[#6E6459] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectedConfirmed}
                    onChange={(e) => setInspectedConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#221E1A]/20 bg-[#F0E7D8] accent-[#2F6B63] shrink-0"
                  />
                  <span>
                    Tôi đã tải xuống, mở kiểm tra kỹ toàn bộ tệp ở phiên bản hiện tại{manifestVersion ? ` (#${manifestVersion.slice(0, 8)})` : ''} và đồng ý giải ngân ký quỹ để hoàn tất dịch vụ.
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleCompleteCommission}
                  disabled={isCompleting || !inspectedConfirmed}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2F6B63]/12 hover:bg-[#2F6B63]/10 text-[#241F1A] font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2F6B63] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompleting ? 'Đang hoàn tất...' : 'Xác nhận hoàn tất & Nghiệm thu'}
                </button>
              </div>
            </div>
          )}

          {!isCreator && commissionStatus === 'Completed' && onOpenReviewModal && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#221E1A]/10">
              <p className="text-xs text-[#2F6B63] flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Đơn hàng đã hoàn tất nghiệm thu và lưu trữ an toàn trong Drive. </p>
              {commission?.review ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] font-semibold text-xs md:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2F6B63]" />
                    Đã đánh giá ({commission.review.rating}★)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReviewModal();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 hover:bg-[#8A6A1F]/20 text-[#8A6A1F] font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    🎁 Gửi Tip họa sĩ
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReviewModal();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#B24A26]/30 bg-[#B24A26]/10 hover:bg-[#B24A26]/20 text-[#B24A26] font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  ⭐ Đánh giá &amp; Tip Creator
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CERTIFICATE VIEWER / PRINT SUB-MODAL */}
      <DigitalCertificateModal
        isOpen={showCertPreview}
        onClose={() => setShowCertPreview(false)}
        commission={commission ?? null}
        masterSha256={manifestVersion || files.find((f) => !f.isCertificate)?.sha256}
      />
    </div>
  );
}
