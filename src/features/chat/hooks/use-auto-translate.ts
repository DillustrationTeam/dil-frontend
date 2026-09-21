'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'dillu.workroom.autoTranslate';
const CHANGE_EVENT = 'dillu:auto-translate-change';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

/**
 * Công tắc AI Real-time Translation (SCR-43) — lưu lựa chọn vào localStorage.
 *
 * VÌ SAO dùng `useSyncExternalStore` thay vì `useState` + `useEffect`:
 *   - Đọc localStorage trong initializer sẽ lệch hydration (server không có `window`).
 *   - `setState` đồng bộ trong effect bị React Compiler lint của Next 16 báo lỗi.
 * `useSyncExternalStore` chính là API dành cho "state đến từ hệ thống ngoài React".
 */
export function useAutoTranslate(): [boolean, () => void] {
  const enabled = useSyncExternalStore(subscribe, readSnapshot, () => false);

  const toggle = useCallback(() => {
    const next = window.localStorage.getItem(STORAGE_KEY) !== '1';
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [enabled, toggle];
}
