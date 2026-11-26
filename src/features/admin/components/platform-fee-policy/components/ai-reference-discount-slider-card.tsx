'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';

interface AiReferenceDiscountSliderCardProps {
  discountPercent: number;
  onChange: (value: number) => void;
}

export function AiReferenceDiscountSliderCard({
  discountPercent,
  onChange,
}: AiReferenceDiscountSliderCardProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="space-y-4 bg-[#F0E7D8] p-6 lg:p-7 rounded-2xl border border-[#221E1A]/10 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label htmlFor="ai-reference-discount-slider" className="font-bold text-[#241F1A] text-sm font-h1">
              {isVie ? 'Giảm giá khi dùng ảnh AI phác thảo' : 'AI Reference Sketch Discount'}
            </label>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0E7D8] text-[#241F1A]/80">
              0% - 30%
            </span>
          </div>
          <p className="text-[11px] text-[#6E6459] font-body">
            {isVie
              ? 'Áp dụng toàn sàn khi khách gắn ảnh AI phác thảo bố cục làm reference (không freestyle).'
              : 'Applies platform-wide when a client attaches an AI-generated layout sketch as reference (not freestyle).'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-xs text-[#6E6459] uppercase font-semibold tracking-wider">
            {isVie ? 'Mức giảm hiện tại:' : 'Current Discount:'}
          </span>
          <span className="px-4 py-2 rounded-xl bg-[#2F6B63]/20 border border-[#2F6B63]/40 text-[#2F6B63] font-mono font-extrabold text-xl shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            {discountPercent}%
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <input
          id="ai-reference-discount-slider"
          type="range"
          min="0"
          max="30"
          step="1"
          value={discountPercent}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-[#F7F2E9] rounded-lg appearance-none cursor-pointer accent-[#2F6B63] transition-all"
        />

        <div className="flex justify-between text-[10px] text-[#6E6459] font-mono px-1">
          <span>0% ({isVie ? 'Tối thiểu' : 'Min'})</span>
          <span>7.5%</span>
          <span>15%</span>
          <span>22.5%</span>
          <span>30% ({isVie ? 'Tối đa' : 'Max'})</span>
        </div>
      </div>
    </div>
  );
}
