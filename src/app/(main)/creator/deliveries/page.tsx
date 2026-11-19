import { redirect } from 'next/navigation';

/**
 * "Quản lý Giao nhận Tranh vật lý" đã chuyển sang `/my-auctions/deliveries` — đây là nghiệp vụ
 * đấu giá (vận đơn + ký quỹ của một phiên), không phải nghiệp vụ studio của Creator.
 * Giữ redirect để link cũ và bookmark không chết.
 */
export default function CreatorDeliveriesPage() {
  redirect('/my-auctions/deliveries');
}
