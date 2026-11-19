import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PhysicalDeliveryManager } from '@/features/auction';

export const metadata = {
  title: 'Đơn giao tranh vật lý | dillustration',
  description: 'Theo dõi vận đơn, ký quỹ và khiếu nại của các phiên đấu giá có bản tranh vật lý.',
};

export default function MyDeliveriesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/my-auctions"
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-outline hover:text-white"
      >
        <ArrowLeft size={14} /> Về phiên đấu giá của tôi
      </Link>
      <PhysicalDeliveryManager />
    </div>
  );
}
