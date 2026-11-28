'use client';

import { AdminRiskQueue } from '@/features/auction';

/**
 * Risk queue of AI Bid Fraud Detection.
 *
 * Kept as its own route under the admin auctions section so the operator surface stays untouched:
 * the existing page keeps its KPI cards and settlement table, and this page reuses the same shell,
 * tokens and typography. Deep link from the auction detail strip points here.
 */
export default function AdminAuctionRiskPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E6459]">Kiểm duyệt đấu giá</p>
        <h1 className="font-h1 text-2xl font-bold tracking-tight text-[#241F1A]">Hàng chờ rủi ro</h1>
        <p className="mt-1 text-xs text-[#746A5F]">
          Phiên bị bộ phát hiện gian lận gắn cờ, xếp theo điểm rủi ro. Mở phiếu để xem bằng chứng rồi
          quyết định bỏ qua hoặc xác nhận.
        </p>
      </div>

      <AdminRiskQueue />
    </div>
  );
}
