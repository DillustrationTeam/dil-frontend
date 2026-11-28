'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Truck } from 'lucide-react';
import { AdminDeliveryDashboard, AuctionPenaltyConsole } from '@/features/auction';

type ShippingTab = 'deliveries' | 'penalties';

/**
 * "Giao nhận & Ký quỹ" gộp hai mặt của cùng một nghiệp vụ:
 *   - Đơn giao nhận: theo dõi vận đơn, ký quỹ và phân xử khiếu nại.
 *   - Án phạt người bán: hệ quả của những khiếu nại đã được xác nhận.
 *
 * Án phạt trước đây là một mục riêng trên sidebar; gộp vào đây để người vận hành đi từ
 * "đơn này có vấn đề" sang "người bán này đã bị phạt mấy lần" trong một màn.
 */
export default function AdminDeliveriesPage() {
  const [tab, setTab] = useState<ShippingTab>('deliveries');

  // Deep link: /admin/deliveries?tab=penalties (route cũ /admin/penalties chuyển về đây).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested === 'penalties' || requested === 'deliveries') {
      setTab(requested);
    }
  }, []);

  function selectTab(next: ShippingTab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'deliveries') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url.toString());
  }

  return (
    <div className="w-full">
      <div role="tablist" aria-label="Giao nhận và án phạt" className="mb-6 flex gap-2 border-b border-[#221E1A]/10 pb-3">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'deliveries'}
          onClick={() => selectTab('deliveries')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === 'deliveries'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-sm'
              : 'text-outline hover:bg-[#FFFCF6] hover:text-[#241F1A]'
          }`}
        >
          <Truck size={14} /> Đơn giao nhận &amp; ký quỹ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'penalties'}
          onClick={() => selectTab('penalties')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === 'penalties'
              ? 'bg-[#A8321C]/20 text-[#A8321C] shadow-sm ring-1 ring-[#A8321C]/40'
              : 'text-outline hover:bg-[#FFFCF6] hover:text-[#241F1A]'
          }`}
        >
          <ShieldAlert size={14} /> Án phạt người bán </button>
      </div>

      {tab === 'deliveries' ? <AdminDeliveryDashboard /> : <AuctionPenaltyConsole />}
    </div>
  );
}
