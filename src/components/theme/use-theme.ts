'use client';

import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'dil-theme';
export type Theme = 'paper' | 'ink';

/**
 * Nguồn duy nhất cho theme ở client: đọc `data-theme` trên <html>,
 * đổi theme + ghi localStorage. Dùng chung cho nút ở header và mục trong menu mobile.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('paper');

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'ink' ? 'ink' : 'paper');
  }, []);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // chế độ riêng tư: chỉ đổi trong phiên này
    }
  }, []);

  const toggle = useCallback(() => {
    apply(theme === 'ink' ? 'paper' : 'ink');
  }, [apply, theme]);

  return { theme, setTheme: apply, toggle, isDark: theme === 'ink' };
}
