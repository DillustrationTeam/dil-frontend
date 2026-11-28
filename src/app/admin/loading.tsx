/**
 * Skeleton cho các màn hình trong Admin Console. AdminLayout (sidebar + top bar)
 * đã được render bởi layout cha, nên ở đây chỉ cần khung nội dung.
 */
import { BarLoader, PencilLoader } from '@/components/feedback/loader';

export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải dữ liệu quản trị…</span>
      <div className="mb-6 flex flex-col gap-3"><PencilLoader label="Đang tải dữ liệu quản trị…" /><BarLoader /></div>

      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-8 w-1/2 max-w-sm" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-24 w-full" style={{ borderRadius: 16 }} />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton h-12 w-full" style={{ borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
