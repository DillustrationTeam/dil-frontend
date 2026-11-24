'use client';

import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useTheme } from './use-theme';

/**
 * Nút đổi sáng/tối cho header. Trên mobile nút này ẩn để không tràn,
 * và cùng chức năng nằm trong menu ☰ (`PublicHeader`).
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const { isDark, toggle } = useTheme();

  const label = isDark
    ? t('Chuyển sang nền sáng') || 'Chuyển sang nền sáng'
    : t('Chuyển sang nền tối') || 'Chuyển sang nền tối';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`icon-btn cursor-pointer ${className}`.trim()}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}
