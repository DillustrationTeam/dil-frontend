import { apiClient } from '@/lib/api-client';

/**
 * URL gốc backend cho SignalR (WebSocket).
 *
 * SignalR không đi qua proxy `/api/v1` của Next được (WebSocket upgrade không
 * rewrite), nên cần URL tuyệt đối riêng:
 *   1. `NEXT_PUBLIC_SIGNALR_URL` — ưu tiên (`http://localhost:5075`, hoặc URL
 *      tunnel/port-forward nếu backend ở máy khác).
 *   2. `NEXT_PUBLIC_API_URL` nếu là URL tuyệt đối → bỏ hậu tố `/api/v1`.
 *   3. Còn lại: chuỗi rỗng → hook KHÔNG kết nối, tránh spam 404 `<html>`.
 */
export function realtimeBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SIGNALR_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) {
    return explicit.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
  }

  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || apiClient.defaults.baseURL || '');
  if (/^https?:\/\//i.test(apiBase)) {
    return apiBase.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
  }

  return '';
}

/** Ghép đường dẫn hub; rỗng nếu chưa cấu hình backend realtime. */
export function hubUrl(path: string): string {
  const base = realtimeBaseUrl();
  if (!base) return '';
  return `${base}/${path.replace(/^\/+/, '')}`;
}
