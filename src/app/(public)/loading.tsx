/**
 * Skeleton cho nhóm route công khai (explore, creators, auctions, events…):
 * thanh lọc + lưới card, đúng nhịp bố cục để nội dung thật về không nhảy trang.
 */
import { BarLoader, PencilLoader } from '@/components/feedback/loader';

export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải danh sách…</span>
      <div className="mb-6 flex flex-col gap-3"><PencilLoader label="Đang tải danh sách…" /><BarLoader /></div>

      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-10 w-2/3 max-w-lg" />
      <div className="skeleton mt-3 h-3 w-1/2 max-w-md" />

      {/* hàng filter + ô tìm kiếm */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <div className="skeleton h-9 w-36 rounded-full" />
        <div className="skeleton h-9 w-32 rounded-full" />
        <div className="skeleton h-9 w-28 rounded-full" />
        <div className="skeleton h-9 w-24 rounded-full" />
      </div>
      <div className="skeleton mt-5 h-12 w-full rounded-full" />

      {/* banner nổi bật */}
      <div className="skeleton mt-7 h-52 w-full" style={{ borderRadius: 20 }} />

      {/* lưới card */}
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="skeleton aspect-[4/5] w-full" style={{ borderRadius: 16 }} />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
