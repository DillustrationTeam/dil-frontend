'use client';

import React, { useState } from 'react';
import { ImagePlus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EventBannerAsideProps {
  bannerUrl?: string;
  onBannerUrlChange?: (url: string) => void;
}

export function EventBannerAside({ bannerUrl, onBannerUrlChange }: EventBannerAsideProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const fakeUrl = URL.createObjectURL(file);
      if (onBannerUrlChange) onBannerUrlChange(fakeUrl);
      toast.success(`Banner image selected: ${file.name}`);
    }
  };

  return (
    <aside className="glass-container rounded-2xl p-6 h-fit sticky top-24">
      <h2 className="text-xl font-bold font-h1 text-on-surface">Banner Image</h2>
      <p className="text-sm text-outline mt-1 mb-4">Contest cover image (16:9 Aspect Ratio).</p>

      {bannerUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 group mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt="Event Banner Preview"
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <label className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white font-semibold text-xs cursor-pointer hover:bg-white/30 transition-all">
              Change Image
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="min-h-[160px] border border-dashed border-brand-periwinkle/30 hover:border-brand-periwinkle/60 rounded-2xl bg-[#090b12]/40 hover:bg-[#090b12]/70 flex flex-col items-center justify-center p-6 cursor-pointer text-center transition-all group">
          <ImagePlus className="w-8 h-8 text-brand-periwinkle/70 group-hover:scale-110 transition-transform mb-2" />
          <span className="text-sm font-medium text-on-surface-variant group-hover:text-white transition-colors">
            {selectedFile ? selectedFile.name : 'Upload PNG, JPG or WebP'}
          </span>
          <span className="text-xs text-outline mt-1">Recommended size: 1920x1080 (Max 5MB)</span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      <div className="flex items-center justify-between gap-3 p-3.5 mt-5 rounded-xl border border-white/10 bg-white/5">
        <span className="text-sm font-medium text-on-surface-variant">Database Schema</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Ready for API
        </span>
      </div>
    </aside>
  );
}
