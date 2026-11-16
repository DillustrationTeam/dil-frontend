'use client';

import React from 'react';
import { Clock, Save, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface PolicyFormActionBarProps {
  lastUpdated?: string | null;
  isDirty: boolean;
  updating: boolean;
  policyExists: boolean;
}

export function PolicyFormActionBar({
  lastUpdated,
  isDirty,
  updating,
  policyExists,
}: PolicyFormActionBarProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const formatLastUpdated = (dateString?: string | null) => {
    if (!dateString) return isVie ? 'Khởi tạo mặc định hệ thống' : 'System Default Initialized';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(isVie ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-xs text-[#8A8FA9] w-full sm:w-auto">
        <Clock className="w-3.5 h-3.5 text-[#8A8FA9]" />
        <span>
          {isVie ? 'Sửa đổi lần cuối:' : 'Last Modified:'}{' '}
          <span className="text-white font-medium">{formatLastUpdated(lastUpdated)}</span>
        </span>
        {isDirty && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
            {isVie ? 'Thay đổi chưa lưu' : 'Unsaved Changes'}
          </span>
        )}
      </div>

      <div className="flex items-center w-full sm:w-auto">
        {/* Only Save Changes button */}
        <button
          type="submit"
          disabled={updating || (!isDirty && policyExists)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-white hover:bg-[#C5C9F8] text-[#0f1017] font-extrabold rounded-xl text-xs transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
        >
          {updating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#0f1017]" />
              <span>{isVie ? 'Đang lưu...' : 'Saving Changes...'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-[#0f1017]" />
              <span>{isVie ? 'Lưu thay đổi' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
