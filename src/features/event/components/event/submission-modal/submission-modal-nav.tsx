'use client';

import React from 'react';
import { FolderHeart, MonitorUp } from 'lucide-react';

export type SubmissionMode = 'existing' | 'upload';

interface SubmissionModalNavProps {
  mode: SubmissionMode;
  setMode: (mode: SubmissionMode) => void;
}

export function SubmissionModalNav({ mode, setMode }: SubmissionModalNavProps) {
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
        <span>Select from My Artworks</span>
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
        <span>Upload from PC</span>
      </button>
    </div>
  );
}
