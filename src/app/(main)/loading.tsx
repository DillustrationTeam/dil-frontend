/**
 * Skeleton cho khu vực thành viên (client/creator/wallet/profile/collections…):
 * giữ nguyên khung sidebar + top bar nên khi nội dung thật về trang không nhảy.
 */
import { BarLoader, PencilLoader } from '@/components/feedback/loader';

export default function MainLoading() {
  return (
    <div className="flex min-h-[100dvh] bg-[#F7F2E9] text-[#241F1A]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải không gian làm việc…</span>

      {/* cột điều hướng: chỉ hiện từ lg, giống CollapsibleSidebar */}
      <aside className="hidden w-[16.5rem] shrink-0 border-r border-[#221E1A]/10 p-4 lg:block">
        <div className="skeleton h-4 w-32" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="skeleton h-8 w-full" />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* top bar */}
        <div className="flex items-center gap-3 border-b border-[#221E1A]/10 px-4 py-3">
          <div className="skeleton h-8 w-40 rounded-full" />
          <div className="skeleton ml-auto h-9 w-9 rounded-full" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>

        <div className="p-4 sm:p-5 lg:p-8">
          <div className="mb-6 flex flex-col gap-3"><PencilLoader label="Đang tải không gian làm việc…" /><BarLoader /></div>
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-4 h-8 w-1/2 max-w-sm" />
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-24 w-full" style={{ borderRadius: 16 }} />
            ))}
          </div>
          <div className="skeleton mt-6 h-64 w-full" style={{ borderRadius: 16 }} />
        </div>
      </div>
    </div>
  );
}
