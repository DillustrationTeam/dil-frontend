'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface SubmissionModalHeaderProps {
  isEditing: boolean;
  eventTitle: string;
  onClose: () => void;
}

export function SubmissionModalHeader({ isEditing, eventTitle, onClose }: SubmissionModalHeaderProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="flex items-center justify-between border-b border-[#221E1A]/10 px-6 py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-periwinkle/20 text-brand-periwinkle">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="font-h1 text-lg font-bold text-[#241F1A]">
            {isEditing
              ? (isVie ? 'Chỉnh sửa bài dự thi' : 'Edit Contest Entry')
              : (isVie ? 'Nộp tác phẩm dự thi' : 'Submit Contest Artwork')}
          </h3>
          <p className="text-xs text-[#6E6459] line-clamp-1">{eventTitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex size-8 items-center justify-center rounded-xl bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer"
      >
        <X size={18} />
      </button>
    </div>
  );
}
