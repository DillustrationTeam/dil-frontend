import { redirect } from 'next/navigation';

/**
 * "Seller Penalties" đã gộp thành tab trong "Giao nhận & Ký quỹ" — cùng một nghiệp vụ:
 * đơn giao nhận có vấn đề → khiếu nại được xác nhận → án phạt người bán.
 * Giữ redirect để link cũ và bookmark không chết.
 */
export default function AdminPenaltiesPage() {
  redirect('/admin/deliveries?tab=penalties');
}
