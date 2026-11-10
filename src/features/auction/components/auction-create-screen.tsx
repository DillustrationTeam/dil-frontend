'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CircleAlert, Gavel, ShieldCheck } from 'lucide-react';
import { auctionError, auctionService } from '../services/auction.service';
import { EligibleArtworkSelector } from './eligible-artwork-selector';
import type { AuctionRequest } from '../types/auction.types';
import { z } from 'zod';

const auctionSchema = z.object({
  artworkId: z.string().uuid('Vui lòng chọn tác phẩm nghệ thuật.'),
  startPrice: z.number().min(10000, 'Giá khởi điểm tối thiểu là 10.000 ₫.'),
  bidStep: z.number().min(1000, 'Bước giá tối thiểu là 1.000 ₫.'),
  reservePrice: z.number().nullable(),
  buyNowPrice: z.number().nullable(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
}).superRefine((value, ctx) => {
  const start = new Date(value.startAt);
  const end = new Date(value.endAt);
  const duration = end.getTime() - start.getTime();
  if (!Number.isFinite(duration) || end <= start) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
  if (end <= new Date()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'Thời gian kết thúc phải nằm trong tương lai.' });
  if (duration < 3600000) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'Phiên đấu giá phải kéo dài ít nhất 1 giờ.' });
  if (duration > 30 * 86400000) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'Phiên đấu giá tối đa 30 ngày.' });
  if (value.reservePrice !== null && value.reservePrice < value.startPrice) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reservePrice'], message: 'Giá bảo lưu không được thấp hơn giá khởi điểm.' });
  if (value.buyNowPrice !== null && value.buyNowPrice <= value.startPrice) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['buyNowPrice'], message: 'Giá mua ngay phải cao hơn giá khởi điểm.' });
});

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function AuctionCreateScreen({ userId }: { userId: string | null }) {
  const router = useRouter();

  const [form, setForm] = useState<AuctionRequest>(() => {
    const now = new Date();
    return {
      artworkId: '',
      startPrice: 500000,
      bidStep: 50000,
      reservePrice: null,
      buyNowPrice: null,
      startAt: now.toISOString().slice(0, 16),
      endAt: new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 16),
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng đăng nhập để mở phiên đấu giá.');
      return;
    }

    const parsed = auctionSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Thông tin phiên đấu giá không hợp lệ.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await auctionService.create({
        ...parsed.data,
        startAt: new Date(parsed.data.startAt).toISOString(),
        endAt: new Date(parsed.data.endAt).toISOString(),
      });
      router.push(`/auctions/${res.auctionId}`);
    } catch (err: unknown) {
      // FE-07: Handle 409 conflict on creation (artwork already in an active auction)
      // Increment reloadTrigger to refresh eligible artworks list
      setReloadTrigger((prev) => prev + 1);
      setError(auctionError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 text-on-surface">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/auctions" className="inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại sàn đấu giá
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-outline">
          <ShieldCheck size={16} className="text-brand-periwinkle" />
          Hợp đồng đấu giá an toàn qua ký quỹ
        </span>
      </div>

      <div className="glass-container rounded-3xl border border-white/10 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-h1 text-2xl font-bold">Mở phiên đấu giá tác phẩm mới</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Thiết lập mức giá và quy tắc trả giá để đưa tác phẩm độc bản của bạn ra công chúng.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            <CircleAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FE-07 Eligible Artwork Selector Card/Dropdown */}
          <EligibleArtworkSelector
            selectedArtworkId={form.artworkId}
            onSelect={(id) => setForm((prev) => ({ ...prev, artworkId: id }))}
            reloadTrigger={reloadTrigger}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startPrice" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Giá khởi điểm (₫) <span className="text-red-400">*</span>
              </label>
              <input
                id="startPrice"
                type="number"
                min="10000"
                step="1000"
                required
                value={form.startPrice}
                onChange={(e) => setForm({ ...form, startPrice: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 font-bold text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-outline">
                Hiển thị: {formatVnd(form.startPrice)}
              </span>
            </div>

            <div>
              <label htmlFor="bidStep" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Bước giá tối thiểu (₫) <span className="text-red-400">*</span>
              </label>
              <input
                id="bidStep"
                type="number"
                min="1000"
                step="1000"
                required
                value={form.bidStep}
                onChange={(e) => setForm({ ...form, bidStep: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 font-bold text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-outline">
                Mỗi lần nâng giá tối thiểu: +{formatVnd(form.bidStep)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="buyNowPrice" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Giá mua ngay (₫) (Tùy chọn)
              </label>
              <input
                id="buyNowPrice"
                type="number"
                min={form.startPrice + form.bidStep}
                step="1000"
                value={form.buyNowPrice ?? ''}
                onChange={(e) => setForm({ ...form, buyNowPrice: e.target.value ? Number(e.target.value) : null })}
                placeholder="Để trống nếu không áp dụng"
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 text-sm text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-outline">
                Người mua có thể mua ngay lập tức với mức giá này để kết thúc sớm phiên.
              </span>
            </div>

            <div>
              <label htmlFor="reservePrice" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Giá bảo lưu (₫) (Tùy chọn)
              </label>
              <input
                id="reservePrice"
                type="number"
                min={form.startPrice}
                step="1000"
                value={form.reservePrice ?? ''}
                onChange={(e) => setForm({ ...form, reservePrice: e.target.value ? Number(e.target.value) : null })}
                placeholder="Để trống nếu không bảo lưu"
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 text-sm text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-outline">
                Mức giá tối thiểu phiên phải đạt được để chốt bán thành công.
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startAt" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Thời gian mở phiên <span className="text-red-400">*</span>
              </label>
              <input
                id="startAt"
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 text-sm text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="endAt" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Thời gian kết thúc <span className="text-red-400">*</span>
              </label>
              <input
                id="endAt"
                type="datetime-local"
                required
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 text-sm text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-on-surface-variant">
            <p className="font-semibold text-brand-periwinkle">Quy chế sàn đấu giá:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-outline">
              <li>Khi người mua đặt giá, số tiền tương ứng sẽ được tự động phong tỏa trong ví của họ.</li>
              <li>Nếu có người trả giá cao hơn, tiền phong tỏa của người trả giá trước sẽ lập tức được hoàn trả vào ví.</li>
              <li>Sau khi phiên đấu giá kết thúc thành công, quyền sở hữu tác phẩm và quyền tải tệp tranh gốc sẽ tự động chuyển cho người thắng cuộc.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/auctions"
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-outline hover:text-white"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-8 py-3 font-h1 text-xs font-bold text-brand-navy shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              <Gavel size={16} /> {submitting ? 'Đang tạo phiên...' : 'Phát hành phiên đấu giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
