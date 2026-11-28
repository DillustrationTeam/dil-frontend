'use client';

import React from 'react';
import { MonitorUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface SubmissionModalFileUploaderProps {
  localPreviewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

export function SubmissionModalFileUploader({
  localPreviewUrl,
  fileInputRef,
  onFileChange,
  onRemoveFile,
}: SubmissionModalFileUploaderProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#B24A26] mb-2">
          {isVie
            ? 'Chọn tệp hình ảnh từ máy tính của bạn'
            : 'Select Artwork File from Your PC (Local Storage)'}{' '}
          <span className="text-[#A8321C]">*</span>
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
        />

        {localPreviewUrl ? (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#221E1A]/10 bg-[#F0E7D8] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPreviewUrl} alt="Preview" className="size-full object-contain" />
            <div className="absolute inset-0 bg-[#F0E7D8] opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-[#FFFCF6] shadow-md cursor-pointer hover:brightness-110 transition"
              >
                {isVie ? 'Đổi hình ảnh' : 'Change Image'}
              </button>
              <button
                type="button"
                onClick={onRemoveFile}
                className="rounded-xl bg-[#A8321C]/20 px-4 py-2 text-xs font-bold text-[#241F1A] shadow-md cursor-pointer hover:bg-[#A8321C]/12 transition"
              >
                {isVie ? 'Gỡ bỏ' : 'Remove'}
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[#221E1A]/20 bg-[#FFFCF6] hover:border-brand-periwinkle/60 hover:bg-[#FFFCF6] transition cursor-pointer"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mb-3">
              <MonitorUp size={28} />
            </div>
            <p className="font-h1 text-sm font-bold text-[#241F1A]">
              {isVie
                ? 'Nhấp hoặc kéo thả tác phẩm từ máy tính của bạn'
                : 'Click or drag & drop artwork from your PC'}
            </p>
            <p className="text-xs text-[#6E6459] mt-1">
              {isVie
                ? 'Hỗ trợ PNG, JPG, JPEG, WEBP (Tối đa 25MB)'
                : 'Supports PNG, JPG, JPEG, WEBP (Max 25MB)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
