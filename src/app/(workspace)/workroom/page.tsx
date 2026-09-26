'use client';

import Link from 'next/link';
import { ArrowLeft, Gavel, MessageSquare, ShieldCheck } from 'lucide-react';

export default function WorkroomIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-on-surface">
      <div className="glass-container rounded-3xl border border-white/10 p-10 text-center">
        <MessageSquare size={44} className="mx-auto mb-4 text-brand-periwinkle" aria-hidden />
        <h1 className="font-h1 text-2xl font-bold">Phòng làm việc &amp; Trao đổi hợp đồng</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-on-surface-variant">
          Mỗi đơn đặt vẽ hoặc phiên đấu giá sẽ có một phòng làm việc riêng để tác giả và khách hàng trao đổi
          phác thảo, duyệt tiến độ và gửi tệp hoàn thiện. Phòng được mở từ đơn hàng hoặc từ phiên đấu giá.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-outline">
          <ShieldCheck size={15} className="text-brand-periwinkle" aria-hidden />
          Mọi tin nhắn và tệp trao đổi đều được lưu làm bằng chứng ký quỹ
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-6 py-2.5 font-h1 text-xs font-bold text-brand-navy shadow transition hover:brightness-110"
          >
            <Gavel size={15} aria-hidden /> Mở từ sàn đấu giá
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-semibold text-on-surface transition hover:bg-white/10"
          >
            <ArrowLeft size={15} aria-hidden /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

