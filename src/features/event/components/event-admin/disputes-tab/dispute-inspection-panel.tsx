'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShieldAlert,
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Maximize2,
  Scale,
  FileText,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { SubmissionDisputeDto } from '@/features/admin/types/dispute-arbitration.types';
import { formatDisputeCategory, formatDisputeCode } from './dispute-queue-table';
import { createPortal } from 'react-dom';

interface DisputeInspectionPanelProps {
  dispute: SubmissionDisputeDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onExecuteRuling: (
    disputeId: string,
    resolution: 'Dismiss' | 'Disqualify' | 'RequestReEvaluation',
    note: string
  ) => Promise<void>;
  onClose?: () => void;
}

export function DisputeInspectionPanel({
  dispute,
  isLoading,
  isSubmitting,
  onExecuteRuling,
  onClose,
}: DisputeInspectionPanelProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<
    'Dismiss' | 'Disqualify' | 'RequestReEvaluation'
  >('Dismiss');
  const [moderatorNote, setModeratorNote] = useState(
    isVie
      ? 'Dựa trên dữ liệu đối chiếu, thông tin tệp và phản hồi từ ban giám khảo, hội đồng xác nhận phán quyết chính thức.'
      : 'Based on cross-referenced telemetry data, metadata inspection, and jury feedback, the committee confirms the official ruling.'
  );

  if (isLoading && !dispute) {
    return (
      <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-12 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-periwinkle border-t-transparent rounded-full animate-spin" />
        <p className="font-h1 font-bold text-[#241F1A] text-sm">
          {isVie ? 'Đang tải hồ sơ tranh chấp...' : 'Loading Dispute Dossier...'}
        </p>
        <p className="text-xs text-[#6E6459]">
          {isVie ? 'Đang truy xuất tệp bằng chứng, nhật ký và bài thi.' : 'Retrieving evidence files, telemetry logs, and submission records.'}
        </p>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-10 flex flex-col items-center justify-center text-center space-y-3">
        <Scale className="w-10 h-10 text-[#6E6459]" />
        <p className="font-h1 font-bold text-[#241F1A] text-base">
          {isVie ? 'Chưa chọn tranh chấp để xem xét' : 'No Dispute Selected for Review'}
        </p>
        <p className="text-xs text-[#6E6459] max-w-md">
          {isVie
            ? 'Chọn bất kỳ vụ tranh chấp nào từ hàng đợi bên trên để kiểm tra bằng chứng và thực thi phán quyết.'
            : 'Select any dispute case from the queue above to inspect reported evidence, evaluate claims, and execute moderator rulings.'}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExecuteRuling(dispute.id, selectedResolution, moderatorNote);
  };

  return (
    <div className="space-y-4">
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-h1 font-bold text-lg text-[#241F1A] flex items-center gap-2">
          <span>{isVie ? 'Hồ sơ tranh chấp & Bảng phán quyết' : 'Dispute Dossier & Ruling Console'}</span>
          <span className="text-xs font-mono text-brand-periwinkle px-2 py-0.5 rounded bg-brand-periwinkle/15 border border-brand-periwinkle/30">
            [{formatDisputeCode(dispute.id)}]
          </span>
        </h2>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[#6E6459] hover:text-[#241F1A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isVie ? 'Thu gọn' : 'Collapse Panel'}</span>
          </button>
        )}
      </div>

      {/* 2. Split 2-Column Inspection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Artwork Preview & Dispute Details */}
        <div className="md:col-span-6 glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-[#6E6459] uppercase font-bold tracking-wider block">
              {isVie ? 'Bằng chứng tác phẩm dự thi' : 'Contest Artwork Evidence'}
            </span>
            <div className="flex items-center gap-1.5">
              {dispute.category && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-brand-periwinkle/30 bg-brand-periwinkle/15 text-brand-periwinkle">
                  {formatDisputeCategory(dispute.category)}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  dispute.priority === 'High'
                    ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40'
                    : 'bg-[#8A6A1F]/20 text-[#8A6A1F] border-[#8A6A1F]/40'
                }`}
              >
                {dispute.priority === 'High' ? (isVie ? 'Ưu tiên cao' : 'High Priority Claim') : (isVie ? 'Ưu tiên thường' : `${dispute.priority} Priority Claim`)}
              </span>
            </div>
          </div>

          {/* Artwork Image Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#221E1A]/10 bg-[#E5D8C2] group">
            {dispute.artworkImageUrl ? (
              <>
                <Image
                  src={dispute.artworkImageUrl}
                  alt={dispute.submissionTitle || 'Artwork'}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(dispute.artworkImageUrl || null)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-[#E5D8C2] hover:bg-[#F0E7D8] text-[#241F1A] text-xs backdrop-blur-md border border-[#221E1A]/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isVie ? 'Xem ảnh gốc' : 'View Fullsize'}</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#746A5F] gap-2">
                <FileText className="w-10 h-10" />
                <span className="text-xs">{isVie ? 'Không có hình ảnh bài thi' : 'No artwork image available'}</span>
              </div>
            )}
          </div>

          {/* Submission & Event Info */}
          <div className="p-4 rounded-2xl bg-[#F0E7D8] border border-[#221E1A]/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6E6459]">{isVie ? 'Tên bài thi:' : 'Submission Title:'}</span>
              <strong className="text-[#241F1A] font-medium">{dispute.submissionTitle || (isVie ? 'Chưa đặt tên' : 'Untitled Artwork')}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6E6459]">{isVie ? 'Cuộc thi:' : 'Target Contest:'}</span>
              <span className="text-brand-periwinkle font-medium">{dispute.eventTitle || (isVie ? 'Cuộc thi' : 'Contest Event')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6E6459]">{isVie ? 'Người báo cáo:' : 'Reported By:'}</span>
              <span className="text-[#746A5F] font-medium">{dispute.raisedByName || (isVie ? 'Thí sinh' : 'Participant')}</span>
            </div>
          </div>

          {/* Reported Violation Rationale */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#241F1A] uppercase tracking-wider block">
              {isVie ? 'Lý do khiếu nại:' : 'Claim Justification:'}
            </span>
            <p className="text-xs text-[#746A5F] bg-[#F0E7D8] p-3.5 rounded-xl border border-[#221E1A]/10 leading-relaxed font-body">
              {dispute.reason}
            </p>
          </div>

          {/* Attached Evidence Gallery & References */}
          {(() => {
            const evidenceList =
              dispute.evidenceUrlList && dispute.evidenceUrlList.length > 0
                ? dispute.evidenceUrlList
                : dispute.evidenceUrls
                ? [dispute.evidenceUrls]
                : [];
            if (evidenceList.length === 0) return null;

            const isImage = (url: string) =>
              /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url) ||
              url.includes('images.unsplash.com') ||
              url.includes('cloudinary') ||
              url.includes('imgur') ||
              url.startsWith('data:image') ||
              url.startsWith('blob:');

            const imageEvidence = evidenceList.filter(isImage);
            const otherEvidence = evidenceList.filter((url) => !isImage(url));

            return (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#6E6459] uppercase tracking-wider block">
                    {isVie ? 'Bằng chứng đính kèm:' : 'Attached Evidence:'}
                  </span>
                  <span className="text-[10px] text-[#746A5F] font-mono">
                    {evidenceList.length} {isVie ? 'mục' : `item${evidenceList.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Evidence Image Gallery */}
                {imageEvidence.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {imageEvidence.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImageUrl(url)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#F0E7D8] cursor-pointer hover:border-brand-periwinkle/60 transition-all shadow-md"
                        title={isVie ? 'Bấm để phóng to bằng chứng' : 'Click to view fullsize evidence'}
                      >
                        <Image
                          src={url}
                          alt={`Evidence reference ${idx + 1}`}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-[#E5D8C2] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
                          <span className="text-[10px] text-[#241F1A] font-medium flex items-center gap-1 bg-[#E5D8C2] px-2 py-1 rounded-md border border-[#221E1A]/20">
                            <Maximize2 className="w-3 h-3 text-brand-periwinkle" />
                            {isVie ? 'Phóng to' : 'Zoom'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Non-Image Document / URL Links */}
                {otherEvidence.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {otherEvidence.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-xs text-brand-periwinkle border border-[#221E1A]/10 transition-colors"
                      >
                        <span className="truncate pr-2 font-mono text-[11px]">{url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Moderator Ruling Form */}
        <div className="md:col-span-6 glass-container bg-[#FFFCF6]/85 backdrop-blur-[32px] border border-[#221E1A]/10 rounded-[28px] p-6 space-y-6 flex flex-col justify-between">
          {(() => {
            const isResolved = dispute.status === 'Resolved' || dispute.status === 'Rejected';
            const effectiveResolution = dispute.resolution || selectedResolution;

            return (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#6E6459] uppercase font-bold tracking-wider block">
                      {isVie ? 'Phán quyết trọng tài' : 'Arbitration Judgment'}
                    </span>
                    {isResolved && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          dispute.status === 'Rejected'
                            ? 'border-[#221E1A]/12 bg-[#E5D8C2] text-[#746A5F]'
                            : 'border-[#2F6B63]/40 bg-[#2F6B63]/15 text-[#2F6B63]'
                        }`}
                      >
                        {dispute.resolution === 'Dismiss'
                          ? (isVie ? 'Bác bỏ (Từ chối báo cáo)' : 'Dismissed (Report Rejected)')
                          : dispute.resolution === 'Disqualify'
                          ? (isVie ? 'Loại bài thi' : 'Disqualified (Ruling Applied)')
                          : dispute.resolution === 'RequestReEvaluation'
                          ? (isVie ? 'Yêu cầu chấm lại' : 'Re-evaluation Requested')
                          : `${dispute.status} · ${dispute.resolution || 'Concluded'}`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-h1 font-bold text-[#241F1A] text-base mt-1">
                    {isVie ? 'Chọn hành động xử lý' : 'Select Resolution Action'}
                  </h3>
                  <p className="text-xs text-[#6E6459] mt-0.5">
                    {isResolved
                      ? (isVie ? 'Vụ tranh chấp này đã được giải quyết và thực thi phán quyết.' : 'This dispute case has already been resolved and its ruling executed.')
                      : (isVie ? 'Chọn quyết định chính thức áp dụng cho vụ tranh chấp này.' : 'Choose the official resolution term to apply to this dispute case.')}
                  </p>
                </div>

                {/* Already Resolved Notice Banner */}
                {isResolved && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      dispute.status === 'Rejected'
                        ? 'border-[#221E1A]/12 bg-[#E5D8C2]'
                        : 'border-[#2F6B63]/40 bg-[#2F6B63]/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {dispute.status === 'Rejected' ? (
                        <>
                          <XCircle className="w-4 h-4 shrink-0 text-[#241F1A]" />
                          <span className="text-[#241F1A]">{isVie ? 'Tranh chấp đã bị bác bỏ (Từ chối báo cáo)' : 'Dispute Dismissed (Report Rejected)'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F6B63]" />
                          <span className="text-[#2F6B63]">
                            {isVie ? `Đã chấp thuận tranh chấp: ${dispute.resolution || 'Đã giải quyết'}` : `Dispute Upheld: ${dispute.resolution || 'Resolved'}`}
                          </span>
                        </>
                      )}
                    </div>
                    {dispute.note && (
                      <p className="text-[#241F1A] text-[11px] leading-relaxed pl-6">
                        <strong>{isVie ? 'Ghi chú chính thức:' : 'Official Note:'}</strong> {dispute.note}
                      </p>
                    )}
                    {dispute.resolvedAt && (
                      <p className="text-[#6E6459] text-[10px] pl-6 font-mono">
                        {isVie ? 'Giải quyết lúc' : 'Resolved on'} {new Date(dispute.resolvedAt).toLocaleString(isVie ? 'vi-VN' : 'en-US')}
                      </p>
                    )}
                  </div>
                )}

                {/* 3 Ruling Actions Grid */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${isResolved ? 'pointer-events-none cursor-not-allowed' : ''}`}>
                  {/* Option 1: Dismiss Appeal */}
                  <button
                    type="button"
                    disabled={isResolved}
                    onClick={() => !isResolved && setSelectedResolution('Dismiss')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      effectiveResolution === 'Dismiss'
                        ? 'border-[#2F6B63]/30 bg-[#2F6B63]/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8]'
                    } ${isResolved ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-[#2F6B63]">{isVie ? 'Bác bỏ khiếu nại' : 'Dismiss Appeal'}</span>
                      <CheckCircle2 className="w-4 h-4 text-[#2F6B63]" />
                    </div>
                    <p className="text-[10px] text-[#746A5F]">
                      {isVie ? 'Từ chối báo cáo và giữ nguyên tư cách bài dự thi.' : 'Reject the report and retain submission eligibility.'}
                    </p>
                  </button>

                  {/* Option 2: Disqualify Artwork */}
                  <button
                    type="button"
                    disabled={isResolved}
                    onClick={() => !isResolved && setSelectedResolution('Disqualify')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      effectiveResolution === 'Disqualify'
                        ? 'border-[#A8321C]/30 bg-[#A8321C]/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8]'
                    } ${isResolved ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-[#A8321C]">{isVie ? 'Loại bài thi' : 'Disqualify Artwork'}</span>
                      <XCircle className="w-4 h-4 text-[#A8321C]" />
                    </div>
                    <p className="text-[10px] text-[#746A5F]">
                      {isVie ? 'Hủy bỏ tư cách bài thi do vi phạm thể lệ đã xác minh.' : 'Strip submission eligibility for verified rules violation.'}
                    </p>
                  </button>

                  {/* Option 3: Request Panel Re-evaluation */}
                  <button
                    type="button"
                    disabled={isResolved}
                    onClick={() => !isResolved && setSelectedResolution('RequestReEvaluation')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      effectiveResolution === 'RequestReEvaluation'
                        ? 'border-[#2C5A86]/30 bg-[#2C5A86]/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'border-[#221E1A]/10 bg-[#FFFCF6] hover:bg-[#F0E7D8]'
                    } ${isResolved ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-[#2C5A86]">{isVie ? 'Yêu cầu chấm lại' : 'Request Re-evaluation'}</span>
                      <Scale className="w-4 h-4 text-[#2C5A86]" />
                    </div>
                    <p className="text-[10px] text-[#746A5F]">
                      {isVie ? 'Yêu cầu Ban giám khảo mở bảng điểm và đánh giá lại.' : 'Instruct Jury Panel to unlock scoresheet & re-evaluate.'}
                    </p>
                  </button>
                </div>

                {/* Decision Notes Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#241F1A] uppercase tracking-wider block">
                    {isVie ? 'Căn cứ phán quyết & Ghi chú kiểm toán:' : 'Ruling Rationale & Audit Evidence Notes:'}
                  </label>
                  <textarea
                    rows={5}
                    disabled={isResolved}
                    value={isResolved ? dispute.note || '' : moderatorNote}
                    onChange={(e) => setModeratorNote(e.target.value)}
                    placeholder={isVie ? 'Nhập kết quả xác minh, trích dẫn thể lệ và giải trình chính thức...' : 'Enter verified findings, citation of rules, and official justification...'}
                    className={`w-full rounded-xl border border-[#221E1A]/10 bg-[#E5D8C2] text-[#241F1A] placeholder:text-[#746A5F] p-3.5 text-xs focus:outline-none focus:border-brand-periwinkle focus:ring-1 focus:ring-brand-periwinkle/30 transition-all resize-y leading-relaxed ${
                      isResolved ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    required={!isResolved}
                  />
                </div>

                {/* Audit Compliance Disclaimer Badge */}
                <div className="p-3 rounded-xl border-l-4 border-brand-periwinkle bg-brand-periwinkle/10 text-xs text-[#746A5F] flex items-start gap-2.5 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-brand-periwinkle shrink-0 mt-0.5" />
                  <span>
                    {isVie
                      ? 'Tất cả các phán quyết đều được ghi lại vĩnh viễn trong sổ cái kiểm toán cuộc thi cùng danh tính người xử lý và dấu thời gian.'
                      : 'All rulings are permanently recorded in the immutable contest audit ledger with handler identity and timestamp.'}
                  </span>
                </div>

                {/* Submit Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-[#221E1A]/10 text-xs font-semibold text-[#746A5F] hover:bg-[#FFFCF6] transition-all cursor-pointer"
                    >
                      {isResolved ? (isVie ? 'Đóng hồ sơ' : 'Close Dossier') : (isVie ? 'Hủy' : 'Cancel')}
                    </button>
                  )}
                  {!isResolved && (
                    <button
                      type="submit"
                      disabled={isSubmitting || !moderatorNote.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B24A26] to-[#2F6B63] text-[#241F1A] font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,172,217,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                          <span>{isVie ? 'Đang thực thi...' : 'Executing Ruling...'}</span>
                        </>
                      ) : (
                        <span>
                          {isVie ? 'Thực thi phán quyết · ' : 'Execute Ruling · '}
                          {selectedResolution === 'RequestReEvaluation'
                            ? (isVie ? 'Chấm lại' : 'Re-evaluate')
                            : selectedResolution === 'Dismiss'
                            ? (isVie ? 'Bác bỏ' : 'Dismiss')
                            : (isVie ? 'Loại' : 'Disqualify')}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </form>
            );
          })()}
        </div>
      </div>

      {/* Lightbox Modal (Portaled) */}
      {previewImageUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-[#F0E7D8]/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#F0E7D8] hover:bg-[#F0E7D8] text-[#241F1A] cursor-pointer transition-colors"
              title="Close fullsize preview"
            >
              <X className="w-6 h-6" />
            </button>
            <div
              className="relative max-w-4xl max-h-[85vh] w-full h-[75vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={previewImageUrl}
                alt={dispute.submissionTitle || 'Evidence Preview'}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
