'use client';

import React from 'react';
import { MonitorUp } from 'lucide-react';

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
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-2">
          Select Artwork File from Your PC (Local Storage) <span className="text-rose-400">*</span>
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
        />

        {localPreviewUrl ? (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black/40 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPreviewUrl} alt="Preview" className="size-full object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-brand-navy shadow-md cursor-pointer hover:brightness-110 transition"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={onRemoveFile}
                className="rounded-xl bg-rose-500/80 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer hover:bg-rose-600 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.02] hover:border-brand-periwinkle/60 hover:bg-white/[0.04] transition cursor-pointer"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mb-3">
              <MonitorUp size={28} />
            </div>
            <p className="font-h1 text-sm font-bold text-white">Click or drag & drop artwork from your PC</p>
            <p className="text-xs text-[#8A8FA9] mt-1">Supports PNG, JPG, JPEG, WEBP (Max 25MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
