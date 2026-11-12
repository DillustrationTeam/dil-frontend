'use client';

import { useLanguage } from '@/context/language-context';

interface SupportContactTriggerProps {
  className?: string;
}

/**
 * Kích hoạt hộp thoại gửi hỗ trợ / báo lỗi dùng chung của nền tảng.
 */
export function SupportContactTrigger({ className }: SupportContactTriggerProps) {
  const { lang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('dillustration:open-support-modal'))}
      className={className}
    >
      {lang === 'ENG' ? 'Submit support / bug report →' : 'Gửi hỗ trợ / báo lỗi →'}
    </button>
  );
}
