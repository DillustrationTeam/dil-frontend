'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Gavel,
  Image as ImageIcon,
  Loader2,
  Plus,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { artTradeService } from '@/services/art-trade.service';
import { ArtTradeDto } from '@/types/art-trade.types';

interface TradeDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: ArtTradeDto;
  onDisputeSuccess: (updatedTrade?: ArtTradeDto) => void;
}

const DISPUTE_CATEGORIES = [
  {
    id: 'AiArt',
    labelEn: 'AI-Generated Artwork (AI Art)',
    labelVi: 'Tranh tạo bằng AI / Không phải vẽ thủ công',
  },
  {
    id: 'Plagiarism',
    labelEn: 'Plagiarism / Art Theft',
    labelVi: 'Đạo nhái / Sao chép từ họa sĩ khác',
  },
  {
    id: 'AgreementBreach',
    labelEn: 'Severe Breach of Agreed Character/Prompt',
    labelVi: 'Vẽ sai lệch hoàn toàn so với yêu cầu / OC đã thỏa thuận',
  },
  {
    id: 'DeadlineMissed',
    labelEn: 'Extended Deadline Missed / Ghosting',
    labelVi: 'Quá hạn kéo dài / Bỏ ngang không phản hồi',
  },
  {
    id: 'TosViolation',
    labelEn: 'Inappropriate Content / TOS Violation',
    labelVi: 'Nội dung phản cảm / Vi phạm chính sách nền tảng',
  },
  {
    id: 'Other',
    labelEn: 'Other Trade Violation',
    labelVi: 'Lý do vi phạm khác',
  },
];

export function TradeDisputeModal({
  isOpen,
  onClose,
  trade,
  onDisputeSuccess,
}: TradeDisputeModalProps) {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  const [selectedCategory, setSelectedCategory] = useState<string>('AiArt');
  const [details, setDetails] = useState<string>('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (evidenceUrls.length + files.length > 6) {
      toast.error(
        isEng
          ? 'You can attach up to 6 evidence images.'
          : 'Bạn chỉ có thể đính kèm tối đa 6 ảnh bằng chứng.'
      );
      return;
    }

    try {
      setUploadingEvidence(true);
      const uploadedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await artTradeService.uploadAttachment(files[i]);
        uploadedList.push(url);
      }
      setEvidenceUrls((prev) => [...prev, ...uploadedList]);
      toast.success(
        isEng
          ? `Attached ${uploadedList.length} evidence image(s).`
          : `Đã đính kèm ${uploadedList.length} ảnh bằng chứng.`
      );
    } catch (err) {
      console.error(err);
      toast.error(
        isEng ? 'Failed to upload evidence image.' : 'Tải ảnh bằng chứng thất bại.'
      );
    } finally {
      setUploadingEvidence(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDetails = details.trim();
    if (!trimmedDetails) {
      toast.error(
        isEng
          ? 'Please enter detailed explanation for the dispute.'
          : 'Vui lòng nhập mô tả chi tiết lý do khiếu nại.'
      );
      return;
    }

    const catObj = DISPUTE_CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryTitle = isEng ? catObj?.labelEn : catObj?.labelVi;
    const fullReason = `[${categoryTitle}] ${trimmedDetails}`;

    try {
      setIsSubmitting(true);
      await artTradeService.createDispute({
        artTradeId: trade.id,
        category: selectedCategory,
        reason: fullReason,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      });

      toast.success(
        isEng
          ? 'Dispute claim filed successfully. Trade is now under administrator review.'
          : 'Đã gửi hồ sơ khiếu nại thành công. Giao dịch đã chuyển sang trạng thái chờ Quản trị viên phân xử.'
      );

      // Re-fetch trade or update status
      const freshTrade = await artTradeService.getById(trade.id).catch(() => undefined);
      onDisputeSuccess(freshTrade);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : undefined);
      toast.error(
        msg ||
          (isEng
            ? 'Failed to file trade dispute.'
            : 'Gửi khiếu nại thất bại. Vui lòng thử lại.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0E7D8]/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 sm:p-7 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#221E1A]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-[#A8321C]/15 border border-[#A8321C]/40 text-[#A8321C] flex items-center justify-center shrink-0 shadow-lg shadow-[#A8321C]">
              <Gavel className="size-5" />
            </div>
            <div>
              <h3 className="font-h1 text-base sm:text-lg font-bold text-[#241F1A] flex items-center gap-2">
                {isEng ? 'File Art Trade Dispute' : 'Gửi Khiếu Nại Tranh Chấp trao đổi tranh'}
              </h3>
              <p className="text-xs text-[#746A5F] mt-0.5">
                {isEng
                  ? `Report issue for trade: "${trade.title}"`
                  : `Báo cáo vi phạm cho giao dịch: "${trade.title}"`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex size-8 items-center justify-center rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] transition disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Informational Alert Box */}
        <div className="rounded-2xl border border-[#8A6A1F]/35 bg-[#8A6A1F]/10 p-3.5 text-xs text-[#8A6A1F] flex items-start gap-3">
          <AlertTriangle className="size-4 text-[#8A6A1F] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-[#8A6A1F]">
              {isEng ? 'Arbitration Policy Notice' : 'Quy định giải quyết tranh chấp'}
            </span>
            <p className="leading-relaxed">
              {isEng
                ? 'Filing a dispute will pause all completion actions and submit both artworks to platform administrators for investigation. Submitting false reports may result in account sanctions.'
                : 'Khi gửi khiếu nại, giao dịch sẽ được chuyển sang trạng thái "Đang tranh chấp" để Quản trị viên đối chiếu tranh vẽ và bằng chứng. Việc cố ý báo cáo sai sự thật có thể dẫn đến chế tài phạt tài khoản.'}
            </p>
          </div>
        </div>

        {/* Dispute Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Category */}
          <div>
            <label className="block text-[#746A5F] font-semibold mb-1.5">
              {isEng ? 'Violation Type (Category):' : 'Loại vi phạm (Danh mục):'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DISPUTE_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'border-[#A8321C]/30 bg-[#A8321C]/15 text-[#241F1A] font-semibold shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#FFFCF6] hover:text-[#241F1A]'
                  }`}
                >
                  <span>{isEng ? cat.labelEn : cat.labelVi}</span>
                  {selectedCategory === cat.id && (
                    <span className="size-2 rounded-full bg-[#A8321C]/10 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Detailed Explanation */}
          <div>
            <label className="block text-[#746A5F] font-semibold mb-1.5">
              {isEng
                ? 'Detailed Explanation & Arguments (Required):'
                : 'Mô tả chi tiết lý do & luận cứ khiếu nại (Bắt buộc):'}
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                isEng
                  ? 'State why the partner artwork violates guidelines (e.g. AI-generation artifacts on hands/eyes, image search matches, character mismatch, or lack of response)...'
                  : 'Nêu rõ lý do tranh của đối tác vi phạm (ví dụ: phát hiện lỗi tranh AI ở bàn tay/mắt, tìm thấy ảnh gốc bị sao chép, vẽ sai hoàn toàn nhân vật OC đã thỏa thuận)...'
              }
              className="w-full rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9] p-3.5 text-xs text-[#241F1A] text-[#746A5F] focus:border-[#A8321C]/30 focus:outline-none transition"
            />
          </div>

          {/* 3. Evidence Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#746A5F] font-semibold block">
                {isEng
                  ? 'Evidence Screenshots / Images (Optional):'
                  : 'Ảnh bằng chứng / Ảnh chụp màn hình (Tùy chọn):'}
              </label>
              <span className="text-[11px] text-[#746A5F]">
                {evidenceUrls.length}/6 {isEng ? 'images' : 'ảnh'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {evidenceUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#E5D8C2] group"
                >
                  <Image
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidence(idx)}
                    className="absolute top-1.5 right-1.5 size-5 rounded-full bg-[#E5D8C2] text-[#241F1A] flex items-center justify-center hover:bg-[#A8321C]/12 transition shadow"
                    title={isEng ? 'Remove image' : 'Xóa ảnh'}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {evidenceUrls.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingEvidence}
                  className="aspect-square rounded-xl border border-dashed border-[#221E1A]/20 bg-[#FFFCF6] hover:bg-[#FFFCF6] hover:border-[#221E1A]/20 text-[#746A5F] hover:text-[#241F1A] flex flex-col items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  {uploadingEvidence ? (
                    <Loader2 size={18} className="animate-spin text-[#A8321C]" />
                  ) : (
                    <>
                      <Plus size={18} />
                      <span className="text-[10px] font-medium">
                        {isEng ? 'Upload' : 'Tải ảnh'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221E1A]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 hover:bg-[#F0E7D8] text-[#746A5F] text-xs font-semibold transition disabled:opacity-50"
            >
              {isEng ? 'Cancel' : 'Hủy bỏ'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !details.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8321C] to-[#A8321C] hover:from-[#A8321C] hover:to-[#A8321C] text-[#241F1A] text-xs font-bold transition shadow-lg shadow-[#A8321C] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isEng ? 'Submitting...' : 'Đang gửi khiếu nại...'}</span>
                </>
              ) : (
                <>
                  <Gavel size={14} />
                  <span>{isEng ? 'Submit Dispute Claim' : 'Gửi Đơn Khiếu Nại'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

