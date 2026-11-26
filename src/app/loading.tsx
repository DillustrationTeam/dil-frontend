import { PencilLoader } from '@/components/feedback/loader';

/**
 * Trạng thái chờ cấp route: Next hiển thị ngay khi điều hướng sang segment chưa render xong.
 * Ở đây không đoán bố cục của trang đích nên dùng loader động (thanh nhịp) + vài khối mờ
 * để người dùng thấy app đang chạy.
 */
export default function RootLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="flex justify-center">
        <PencilLoader label="Đang tải trang…" />
      </div>
      <div className="mx-auto mt-8 max-w-md space-y-3">
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
