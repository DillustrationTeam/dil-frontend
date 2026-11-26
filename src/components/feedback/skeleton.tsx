/**
 * Mảnh skeleton dùng lại cho các màn hình tải dữ liệu phía client.
 *
 * Tất cả đều dựa trên class `.skeleton` trong `gallery.css` (dải sáng chạy 1.5s,
 * tự đổi màu theo theme), nên không có màu cứng nào ở đây.
 */

/** Lưới card tác phẩm: ảnh 4/5 + 2 dòng chữ. */
export function SkeletonCardGrid({ count = 8, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="skeleton aspect-[4/5] w-full" style={{ borderRadius: 16 }} />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Danh sách dòng (bảng, thông báo, log…). */
export function SkeletonRows({ count = 6, height = 'h-14', className = '' }: { count?: number; height?: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`skeleton w-full ${height}`} style={{ borderRadius: 12 }} />
      ))}
    </div>
  );
}

/** Khối thẻ thống kê (dashboard, ví, bảng điều khiển). */
export function SkeletonStatGrid({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton h-24 w-full" style={{ borderRadius: 16 }} />
      ))}
    </div>
  );
}

/** Tiêu đề + vài dòng mô tả. */
export function SkeletonHeading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`.trim()} aria-hidden="true">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-8 w-1/2 max-w-sm" />
      <div className="skeleton h-3 w-2/3 max-w-md" />
    </div>
  );
}
