'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { CloudUpload } from 'lucide-react';

/**
 * Thanh tiến trình cho MỌI việc tải tệp lên (ảnh tác phẩm, avatar, bằng chứng khiếu nại,
 * tệp đính kèm chat, chứng từ giao nhận…).
 *
 * Cách hoạt động: mọi request gửi `FormData` qua `apiClient` tự động được gắn
 * `onUploadProgress` (xem `src/lib/api-client.ts`), riêng upload thẳng lên Cloudinary được
 * gắn thủ công ở `upload.service.ts`. Cả hai cùng báo về store dưới đây, và component
 * `<UploadProgressStack />` (gắn một lần ở root layout) hiển thị tiến trình.
 *
 * Nhờ vậy không phải sửa từng màn hình: chỗ nào upload là chỗ đó có thanh tiến trình.
 */

export type UploadTask = {
  id: string;
  label: string;
  percent: number;
  /** Đã gửi xong byte cuối, đang chờ server trả kết quả. */
  finishing: boolean;
};

let tasks: UploadTask[] = [];
const listeners = new Set<() => void>();
let sequence = 0;

function emit() {
  tasks = [...tasks];
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return tasks;
}

/** Không có task nào: dùng hằng để tránh vòng lặp render của useSyncExternalStore. */
const EMPTY: UploadTask[] = [];
function getServerSnapshot() {
  return EMPTY;
}

const LABELS: { match: RegExp; label: string }[] = [
  { match: /\/artworks\/image/, label: 'Đang tải ảnh tác phẩm lên' },
  { match: /\/uploads\/profile-avatar/, label: 'Đang tải ảnh đại diện lên' },
  { match: /\/uploads\//, label: 'Đang tải tệp lên' },
  { match: /dispute-evidence|evidence/, label: 'Đang tải bằng chứng lên' },
  { match: /delivery|shipping|arrival/, label: 'Đang tải chứng từ giao nhận lên' },
  { match: /chat|messages|attachment/, label: 'Đang tải tệp đính kèm lên' },
  { match: /event|submission/, label: 'Đang tải bài dự thi lên' },
  { match: /art-trades|trade/, label: 'Đang tải tệp trao đổi lên' },
  { match: /creator|application|kyc/, label: 'Đang tải hồ sơ lên' },
];

function labelFor(url?: string, fallback = 'Đang tải tệp lên') {
  if (!url) return fallback;
  return LABELS.find((entry) => entry.match.test(url))?.label ?? fallback;
}

export function beginUpload(label: string): string {
  sequence += 1;
  const id = `upload-${sequence}`;
  tasks = [...tasks, { id, label, percent: 0, finishing: false }];
  emit();
  return id;
}

export function updateUpload(id: string, percent: number, finishing = false) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, percent: clamped, finishing: finishing || clamped >= 100 } : task,
  );
  emit();
}

export function finishUpload(id: string) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, percent: 100, finishing: true } : task));
  emit();
  // Giữ lại ~600ms để người dùng thấy thanh đã chạy hết rồi mới biến mất.
  window.setTimeout(() => {
    tasks = tasks.filter((task) => task.id !== id);
    emit();
  }, 600);
}

type ProgressEventLike = { loaded: number; total?: number };

/**
 * Gắn vào axios `onUploadProgress`. Trả về hàm huỷ để interceptor gọi khi request kết thúc.
 */
export function trackUpload(url?: string): {
  id: string;
  onProgress: (event: ProgressEventLike) => void;
} {
  const id = beginUpload(labelFor(url));
  return {
    id,
    onProgress: (event) => {
      if (!event.total) {
        updateUpload(id, 90);
        return;
      }
      updateUpload(id, (event.loaded / event.total) * 100);
    },
  };
}

export function useUploadTasks() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Stack hiển thị mọi upload đang chạy. Gắn một lần trong root layout. */
export function UploadProgressStack() {
  const active = useUploadTasks();
  const total = active.length;

  if (total === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-24 z-[130] flex flex-col gap-2 sm:inset-x-auto sm:bottom-8 sm:left-6 sm:w-[21rem]"
      role="region"
      aria-label="Tiến trình tải tệp lên"
      aria-live="polite"
    >
      {active.map((task) => (
        <div
          key={task.id}
          data-testid="upload-progress"
          className="pointer-events-auto rounded-2xl border border-[#221E1A]/12 bg-[#FFFCF6] px-4 py-3 shadow-[0_24px_50px_-30px_rgba(20,17,14,0.55)]"
        >
          <div className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4 shrink-0 text-[#B24A26]" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[#241F1A]">{task.label}</p>
            <span className="shrink-0 text-xs tabular-nums text-[#6E6459]">
              {task.finishing ? 'Xong' : `${task.percent}%`}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#221E1A]/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={task.percent}
            aria-label={task.label}
          >
            <div
              className="h-full rounded-full bg-[#B24A26] transition-[width] duration-200 ease-out"
              style={{ width: `${task.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dùng khi cần tự báo tiến trình (ví dụ upload bằng XMLHttpRequest/fetch). */
export function useUploadReporter() {
  return useCallback((label: string) => trackUpload(label), []);
}

export default UploadProgressStack;
