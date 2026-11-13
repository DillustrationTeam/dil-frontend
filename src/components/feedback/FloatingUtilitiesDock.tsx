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
    return window.localStorage.getItem(STORAGE_KEY) === '1';
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
          className="fixed bottom-4 right-0 z-40 flex h-9 cursor-pointer items-center gap-1 rounded-l-full border border-r-0 border-white/15 border-t-white/25 bg-[#181b29]/85 pl-2.5 pr-1.5 text-[11px] font-semibold text-[#A7ACD9] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:bg-[#1F2335] hover:pr-2.5 hover:text-white active:scale-95"
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
          className="fixed bottom-[216px] right-7 z-40 flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/15 border-t-white/25 bg-[#181b29]/85 text-[#919099] shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:scale-105 hover:border-[#A7ACD9]/45 hover:bg-[#1F2335] hover:text-[#A7ACD9] active:scale-95 sm:right-9"
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </>
  );
}
