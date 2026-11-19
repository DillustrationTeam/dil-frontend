'use client';

import React from 'react';
import { FolderHeart, MonitorUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export type SubmissionMode = 'existing' | 'upload';

interface SubmissionModalNavProps {
  mode: SubmissionMode;
  setMode: (mode: SubmissionMode) => void;
}

export function SubmissionModalNav({ mode, setMode }: SubmissionModalNavProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="flex border-b border-white/10 px-6 bg-white/[0.015]">
      <button
        type="button"
        onClick={() => setMode('existing')}
        className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition cursor-pointer ${
          mode === 'existing'
            ? 'border-brand-periwinkle text-brand-periwinkle'
            : 'border-transparent text-[#8A8FA9] hover:text-white'
        }`}
      >
        <FolderHeart size={15} />
        <span>{isVie ? 'Chọn từ tác phẩm của tôi' : 'Select from My Artworks'}</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('upload')}
        className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition cursor-pointer ${
          mode === 'upload'
            ? 'border-brand-periwinkle text-brand-periwinkle'
            : 'border-transparent text-[#8A8FA9] hover:text-white'
        }`}
      >
        <MonitorUp size={15} />
        <span>{isVie ? 'Tải lên từ máy tính' : 'Upload from PC'}</span>
      </button>
    </div>
  );
}
