import { CircleOff } from 'lucide-react';

// Hộp nhỏ dùng chung để báo 1 mục đã bị bỏ trống khi nộp/sửa đơn — dùng ở cả trang
// duyệt đơn của moderator lẫn trang xem/sửa đơn của client để đồng bộ giao diện.
export function EmptyFieldNote() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300">
      <CircleOff className="h-3.5 w-3.5" />
      Không có
    </div>
  );
}
