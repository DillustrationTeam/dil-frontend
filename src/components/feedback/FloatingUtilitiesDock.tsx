'use client';

import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

const STORAGE_KEY = 'dil:floating-dock-hidden';
const STORAGE_EVENT = 'dil:floating-dock-change';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
    // Chưa từng chọn: màn hình hẹp thì thu cụm tiện ích nổi lại để không đè nội dung
    // của khu studio (sidebar, thẻ số liệu, bảng) trên mobile.
    return window.matchMedia('(max-width: 639px)').matches;
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function FloatingUtilitiesDock({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const isHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleHidden = useCallback(() => {
    try {
      const next = !getSnapshot();
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      window.dispatchEvent(new Event(STORAGE_EVENT));
    } catch {
      // Ignore storage errors (private mode / quota).
    }
  }, []);

  return (
    <>
      <div className={isHidden ? 'hidden' : undefined}>{children}</div>

      {isHidden ? (
        <button
          type="button"
          onClick={toggleHidden}
          aria-label={isEng ? 'Show floating tools' : 'Hiện 3 nút tiện ích (Ngôn ngữ, Báo lỗi, AI)'}
          title={isEng ? 'Show floating tools' : 'Hiện công cụ nổi'}
          className="fixed bottom-4 right-0 z-40 flex h-9 cursor-pointer items-center gap-1 rounded-l-full border border-r-0 border-[#221E1A]/10 bg-[#FFFCF6]/92 pl-2.5 pr-1.5 text-[11px] font-semibold text-[#B24A26] shadow-[0_10px_28px_-18px_rgba(74,52,30,0.85)] backdrop-blur-xl transition-all hover:bg-[#FFFCF6] hover:pr-2.5 hover:text-[#241F1A] active:scale-95"
        >
          <ChevronLeft className="h-3.5 w-3.5 opacity-75" aria-hidden />
          <Eye className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggleHidden}
          aria-label={isEng ? 'Hide floating tools' : 'Ẩn 3 nút tiện ích (Ngôn ngữ, Báo lỗi, AI)'}
          title={isEng ? 'Hide floating tools' : 'Ẩn công cụ nổi'}
          className="fixed bottom-[216px] right-7 z-40 flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6]/92 text-[#746A5F] shadow-[0_10px_28px_-18px_rgba(74,52,30,0.85)] backdrop-blur-xl transition-all hover:scale-105 hover:border-[#B24A26]/45 hover:bg-[#FFFCF6] hover:text-[#B24A26] active:scale-95 sm:right-9"
        >
          <EyeOff className="h-4 w-4 text-[var(--ivory)]" aria-hidden />
        </button>
      )}
    </>
  );
}
