'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface PolicyParametersGridProps {
  milestoneDays: number;
  revisionLimit: number;
  presignedUrlMinutes: number;
  aiSketchLimit: number;
  onMilestoneDaysChange: (value: number) => void;
  onRevisionLimitChange: (value: number) => void;
  onPresignedUrlMinutesChange: (value: number) => void;
  onAiSketchLimitChange: (value: number) => void;
}

export function PolicyParametersGrid({
  milestoneDays,
  revisionLimit,
  presignedUrlMinutes,
  aiSketchLimit,
  onMilestoneDaysChange,
  onRevisionLimitChange,
  onPresignedUrlMinutesChange,
  onAiSketchLimitChange,
}: PolicyParametersGridProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const milestoneTimelineOptions = [
    { value: 3, label: isVie ? '3 Ngày (Rất nhanh)' : '3 Days (Accelerated)' },
    { value: 5, label: isVie ? '5 Ngày (Nhanh)' : '5 Days (Fast)' },
    { value: 7, label: isVie ? '7 Ngày (Mặc định)' : '7 Days (Default)' },
    { value: 10, label: isVie ? '10 Ngày (Tiêu chuẩn)' : '10 Days (Standard)' },
    { value: 14, label: isVie ? '14 Ngày (Mở rộng)' : '14 Days (Extended)' },
  ];

  const presignedUrlOptions = [
    { value: 5, label: isVie ? '5 Phút (DRM nghiêm ngặt)' : '5 Minutes (Strict DRM)' },
    { value: 15, label: isVie ? '15 Phút (Mặc định)' : '15 Minutes (Default)' },
    { value: 30, label: isVie ? '30 Phút' : '30 Minutes' },
    { value: 60, label: isVie ? '60 Phút (Tiêu chuẩn)' : '60 Minutes (Standard)' },
    { value: 120, label: isVie ? '120 Phút (Phiên dài)' : '120 Minutes (Long session)' },
  ];

  const handleRevisionIncrement = () => {
    if (revisionLimit < 20) {
      onRevisionLimitChange(revisionLimit + 1);
    }
  };

  const handleRevisionDecrement = () => {
    if (revisionLimit > 0) {
      onRevisionLimitChange(revisionLimit - 1);
    }
  };

  const handleAiSketchLimitIncrement = () => {
    if (aiSketchLimit < 10) {
      onAiSketchLimitChange(aiSketchLimit + 1);
    }
  };

  const handleAiSketchLimitDecrement = () => {
    if (aiSketchLimit > 1) {
      onAiSketchLimitChange(aiSketchLimit - 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#A8321C]" />
        <h3 className="font-h1 text-sm font-bold text-[#241F1A] uppercase tracking-wider">
          {isVie ? 'Chính sách vận hành & Bảo vệ' : 'Operational & Protection Policies'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* 1. Milestone Auto-Approval Timeline */}
        <div className="space-y-2 bg-[#F0E7D8] p-5 rounded-2xl border border-[#221E1A]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auto-approval-timeline"
                className="block font-bold text-[#241F1A] text-xs font-h1"
              >
                {isVie ? 'Tự động duyệt giai đoạn' : 'Milestone Auto-Approval'}
              </label>
            </div>
            <p className="text-[10px] text-[#6E6459] mb-3 leading-relaxed">
              {isVie
                ? 'Thời hạn tự động giải ngân ký quỹ nếu Khách hàng không phản hồi sau khi Tác giả bàn giao sản phẩm.'
                : 'Automatic escrow release timeline if Client remains inactive after Creator delivers milestone work.'}
            </p>
          </div>

          <div>
            <select
              id="auto-approval-timeline"
              value={milestoneDays}
              onChange={(e) => onMilestoneDaysChange(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] font-bold text-xs focus:border-[#A8321C]/30 focus:outline-none transition-colors"
            >
              {milestoneTimelineOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Default Free Revision Limit */}
        <div className="space-y-2 bg-[#F0E7D8] p-5 rounded-2xl border border-[#221E1A]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="revision-limit-input"
                className="block font-bold text-[#241F1A] text-xs font-h1"
              >
                {isVie ? 'Chỉnh sửa miễn phí' : 'Free Revision Limit'}
              </label>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-ui)] bg-[#8A6A1F]/20 text-[#8A6A1F] border border-[#8A6A1F]/40">
                {isVie ? 'Quy tắc hoa hồng' : 'Commission Rule'}
              </span>
            </div>
            <p className="text-[10px] text-[#6E6459] mb-3 leading-relaxed">
              {isVie
                ? 'Số lần yêu cầu chỉnh sửa miễn phí tiêu chuẩn cho mỗi giai đoạn bàn giao trước khi tính phí phụ thu.'
                : 'Standard free revision requests included per deliverable milestone before fee surcharge is requested.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevisionDecrement}
              disabled={revisionLimit <= 0}
              className="w-10 h-11 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] font-bold hover:bg-[#F0E7D8] flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              -
            </button>

            <input
              id="revision-limit-input"
              type="number"
              min="0"
              max="20"
              value={revisionLimit}
              onChange={(e) =>
                onRevisionLimitChange(
                  Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0))
                )
              }
              className="flex-1 px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] text-center font-mono font-bold text-sm focus:border-[#A8321C]/30 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleRevisionIncrement}
              disabled={revisionLimit >= 20}
              className="w-10 h-11 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] font-bold hover:bg-[#F0E7D8] flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* 3. AWS S3 Presigned URL Expiration */}
        <div className="space-y-2 bg-[#F0E7D8] p-5 rounded-2xl border border-[#221E1A]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="presigned-url-expiration"
                className="block font-bold text-[#241F1A] text-xs font-h1"
              >
                {isVie ? 'Hạn liên kết tải an toàn' : 'Presigned URL Expiry'}
              </label>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-ui)] bg-[#5F3F86]/20 text-[#5F3F86] border border-[#5F3F86]/40">
                BR-39
              </span>
            </div>
            <p className="text-[10px] text-[#6E6459] mb-3 leading-relaxed">
              {isVie
                ? 'Thời gian hiệu lực của liên kết tải bảo mật tạm thời AWS S3 / Cloudinary cho tệp gốc chất lượng cao.'
                : 'Lifespan of temporary AWS S3 / Cloudinary presigned URLs for secure high-res deliverable downloads.'}
            </p>
          </div>

          <div>
            <select
              id="presigned-url-expiration"
              value={presignedUrlMinutes}
              onChange={(e) => onPresignedUrlMinutesChange(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] font-bold text-xs focus:border-[#A8321C]/30 focus:outline-none transition-colors"
            >
              {presignedUrlOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. AI Reference Sketch Generation Limit */}
        <div className="space-y-2 bg-[#F0E7D8] p-5 rounded-2xl border border-[#221E1A]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="ai-sketch-limit-input"
                className="block font-bold text-[#241F1A] text-xs font-h1"
              >
                {isVie ? 'Giới hạn lượt sketch AI' : 'AI Sketch Generation Limit'}
              </label>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-brand-periwinkle/20 text-brand-periwinkle border border-brand-periwinkle/40">
                {isVie ? '/ 24 giờ' : '/ 24h'}
              </span>
            </div>
            <p className="text-[10px] text-[#6E6459] mb-3 leading-relaxed">
              {isVie
                ? 'Số lượt khách được sinh ảnh AI phác thảo bố cục mỗi (khách, creator) trong 24 giờ.'
                : 'Number of AI layout sketch generations allowed per (client, creator) pair per 24 hours.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiSketchLimitDecrement}
              disabled={aiSketchLimit <= 1}
              className="w-10 h-11 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] font-bold hover:bg-[#F0E7D8] flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              -
            </button>

            <input
              id="ai-sketch-limit-input"
              type="number"
              min="1"
              max="10"
              value={aiSketchLimit}
              onChange={(e) =>
                onAiSketchLimitChange(
                  Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1))
                )
              }
              className="flex-1 px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] text-center font-mono font-bold text-sm focus:border-[#A8321C]/30 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleAiSketchLimitIncrement}
              disabled={aiSketchLimit >= 10}
              className="w-10 h-11 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 text-[#241F1A] font-bold hover:bg-[#F0E7D8] flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
