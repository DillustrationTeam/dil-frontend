/**
 * Skeleton cho nhóm `(workspace)` — ai, checkout, notifications.
 * `SiteHeader` đã render ở layout cha nên ở đây chỉ là khung nội dung.
 */
import { BarLoader, PencilLoader } from '@/components/feedback/loader';

export default function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải nội dung…</span>
      <div className="mb-6 flex flex-col gap-3"><PencilLoader label="Đang tải nội dung…" /><BarLoader /></div>

      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-4 h-8 w-2/3 max-w-md" />

      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton h-16 w-full" style={{ borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
