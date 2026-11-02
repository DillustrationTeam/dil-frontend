'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  FileText,
  FolderArchive,
  Gavel,
  Package,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { auctionError, auctionService } from '../services/auction.service';
import { EligibleArtworkSelector } from './eligible-artwork-selector';
import { CommercialRightsModal } from './commercial-rights-modal';
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
  masterFileUrl: z.string().min(1, 'Đường dẫn file nén không hợp lệ').nullable().optional(),
  masterFileName: z.string().nullable().optional(),
  masterFileSizeBytes: z.number().nullable().optional(),
  hasPhysicalCopy: z.boolean().optional(),
  physicalDescription: z.string().max(500, 'Mô tả tranh vật lý không quá 500 ký tự').nullable().optional(),
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
  const searchParams = useSearchParams();
  const initialArtworkId = searchParams.get('artworkId') || '';
  const isResellMode = searchParams.get('resell') === 'true' || Boolean(searchParams.get('artworkId'));

  const [form, setForm] = useState<AuctionRequest>(() => {
    const now = new Date();
    return {
      artworkId: initialArtworkId,
      startPrice: 500000,
      bidStep: 50000,
      reservePrice: null,
      buyNowPrice: null,
      startAt: now.toISOString().slice(0, 16),
      endAt: new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 16),
      masterFileUrl: null,
      masterFileName: null,
      masterFileSizeBytes: null,
      hasPhysicalCopy: false,
      physicalDescription: '',
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const user = useAuthStore((s) => s.user);
  const [selectedArtworkTitle, setSelectedArtworkTitle] = useState<string>('');
  const [agreedCommercialRights, setAgreedCommercialRights] = useState(false);
  const [showCommercialRightsModal, setShowCommercialRightsModal] = useState(false);

  const [isUploadingPack, setIsUploadingPack] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileUpload = async (file: File) => {
    if (file.size > 150 * 1024 * 1024) {
      setUploadError('Tệp quá lớn. Giới hạn dung lượng tối đa là 150MB.');
      return;
    }

    try {
      setIsUploadingPack(true);
      setUploadError(null);
      const res = await auctionService.uploadMasterPack(file);
      setForm((prev) => ({
        ...prev,
        masterFileUrl: res.fileUrl,
        masterFileName: res.fileName,
        masterFileSizeBytes: res.fileSizeBytes,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên tệp thất bại.';
      setUploadError(msg);
    } finally {
      setIsUploadingPack(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileUpload(file);
  };

  const handleRemoveFile = () => {
    setForm((prev) => ({
      ...prev,
      masterFileUrl: null,
      masterFileName: null,
      masterFileSizeBytes: null,
    }));
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng đăng nhập để mở phiên đấu giá.');
      return;
    }

    if (!agreedCommercialRights) {
      setError('Bạn cần đọc và tích chọn đồng ý với Văn bản bàn giao quyền khai thác thương mại để tạo phiên đấu giá.');
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

        {isResellMode && (
          <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-200 flex items-start gap-3">
            <RefreshCw size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Niêm yết bán lại trên thị trường thứ cấp (Secondary Market / Resell)</p>
              <p className="mt-0.5 text-amber-200/80">
                Bạn đang thực hiện quyền tài sản độc bản 1-of-1 để mở phiên đấu giá cho tác phẩm thuộc sở hữu của bạn. Khi phiên chốt, quyền sở hữu và chứng chỉ số mới sẽ được chuyển giao toàn bộ cho người thắng tiếp theo.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FE-07 Eligible Artwork Selector Card/Dropdown */}
          <EligibleArtworkSelector
            selectedArtworkId={form.artworkId}
            onSelect={(id, item) => {
              setForm((prev) => ({ ...prev, artworkId: id }));
              if (item?.title) setSelectedArtworkTitle(item.title);
            }}
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

          {/* Master File Pack Section (Optional) */}
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FolderArchive size={16} className="text-amber-400" />
                  Đính kèm Master File Pack (.zip, .psd, .rar) (Tùy chọn)
                </label>
                <p className="text-[11px] text-outline mt-0.5">
                  Tải lên tệp gốc bí mật (.zip chứa PSD phân layer, file in ấn 300 DPI, asset độc quyền). Tệp được lưu trữ bảo mật trên máy chủ, chỉ duy nhất người thắng phiên sau khi thanh toán mới nhận được link tải an toàn.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full shrink-0">
                Bảo mật cho Winner
              </span>
            </div>

            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.rar,.7z,.tar,.gz,.psd,.clip,.png,.tif,.tiff"
              onChange={handleFileChange}
              className="hidden"
              id="masterPackFileInput"
            />

            {/* Trạng thái đã tải lên tệp */}
            {form.masterFileUrl ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {form.masterFileName || 'Master-File-Pack.zip'}
                    </p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      {form.masterFileSizeBytes
                        ? `${(form.masterFileSizeBytes / (1024 * 1024)).toFixed(2)} MB • `
                        : ''}
                      Đã tải lên hệ thống lưu trữ bảo mật
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPack}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 transition"
                  >
                    Thay file
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 transition"
                    title="Xóa tệp đính kèm"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              /* Khung Kéo thả / Bấm để tải lên */
              <div
                onClick={() => !isUploadingPack && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (isUploadingPack) return;
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) await processFileUpload(droppedFile);
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                  isUploadingPack
                    ? 'border-amber-400/50 bg-amber-400/5 cursor-wait'
                    : 'border-white/15 bg-white/5 hover:border-brand-periwinkle hover:bg-brand-periwinkle/5'
                }`}
              >
                {isUploadingPack ? (
                  <div className="space-y-2">
                    <RefreshCw size={24} className="mx-auto animate-spin text-amber-400" />
                    <p className="text-xs font-semibold text-white">Đang tải lên và mã hóa tệp bàn giao...</p>
                    <p className="text-[11px] text-outline">Vui lòng đợi giây lát</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-periwinkle/15 text-brand-periwinkle">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-xs font-bold text-white">
                      Bấm để tải tệp lên hoặc kéo thả file vào đây
                    </p>
                    <p className="text-[11px] text-outline">
                      Định dạng hỗ trợ: <span className="text-brand-periwinkle">.ZIP, .RAR, .7Z, .PSD</span> (Tối đa 150MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <CircleAlert size={13} /> {uploadError}
              </p>
            )}
          </div>

          {/* Bàn giao tranh vật lý (Tùy chọn) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <input
                id="hasPhysicalCopy"
                type="checkbox"
                checked={form.hasPhysicalCopy || false}
                onChange={(e) => setForm((prev) => ({ ...prev, hasPhysicalCopy: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-brand-periwinkle focus:ring-brand-periwinkle/30"
              />
              <div className="space-y-1">
                <label htmlFor="hasPhysicalCopy" className="text-sm font-semibold text-white flex items-center gap-2 cursor-pointer">
                  <Package size={16} className="text-amber-400" />
                  Có thể cung cấp bản tranh vật lý cho người thắng cuộc
                </label>
                <p className="text-xs text-outline">
                  Người xem sẽ thấy huy hiệu <span className="text-amber-300 font-semibold">[🖼️ Có bản vật lý]</span> để quyết định đấu giá.
                  Nếu người thắng yêu cầu nhận tranh thật, tiền sẽ được sàn tạm giữ ký quỹ cho đến khi người mua ký nhận PoD từ bưu cục.
                </p>
              </div>
            </div>

            {form.hasPhysicalCopy && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-xs font-medium text-white block">
                  Mô tả bản tranh vật lý (kích thước, chất liệu khung, tình trạng, phương thức đóng gói):
                </label>
                <textarea
                  value={form.physicalDescription || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, physicalDescription: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  placeholder="Ví dụ: Tranh sơn dầu trên toan hạt mịn 60x80cm, có đóng khung gỗ sồi kèm lót màng xốp khí chống va đập khi gửi bưu điện..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 focus:border-brand-periwinkle focus:outline-none"
                />
                <p className="text-[11px] text-outline text-right">
                  {(form.physicalDescription || '').length}/500 ký tự
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-on-surface-variant">
            <p className="font-semibold text-brand-periwinkle">Quy chế sàn đấu giá:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-outline">
              <li>Khi người mua đặt giá, số tiền cọc tương ứng sẽ được tự động phong tỏa an toàn trong ví của họ.</li>
              <li>Nếu có người trả giá cao hơn, tiền cọc phong tỏa của người trả giá trước sẽ lập tức được hoàn trả 100% vào ví.</li>
              <li>Sau khi phiên kết thúc thành công, người thắng cuộc nhận toàn bộ quyền tài sản, quyền sở hữu độc bản 1-of-1 và quyền khai thác thương mại tác phẩm.</li>
              <li><strong className="text-amber-300">Bảo hộ Quyền nhân thân:</strong> Quyền tác giả gốc vĩnh viễn thuộc về Họa sĩ sáng tác; người mua không được mạo danh tác giả của tác phẩm.</li>
            </ul>
          </div>

          {/* Điều lệ & Cam kết bàn giao quyền thương mại */}
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              agreedCommercialRights
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-400/40 bg-amber-400/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                id="agreeCommercialRights"
                type="checkbox"
                checked={agreedCommercialRights}
                onChange={(e) => {
                  setAgreedCommercialRights(e.target.checked);
                  if (e.target.checked && error?.includes('Văn bản bàn giao')) {
                    setError(null);
                  }
                }}
                className="mt-0.5 size-4.5 rounded border-white/20 bg-black/40 text-emerald-500 accent-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
              />
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="agreeCommercialRights"
                  className="block cursor-pointer text-xs leading-relaxed text-on-surface select-none"
                >
                  Tôi cam kết bàn giao 100% quyền tài sản &amp; quyền khai thác thương mại cho người thắng phiên, đồng thời giữ nguyên vĩnh viễn quyền tác giả sáng tạo gốc (Quyền nhân thân không thể chuyển nhượng) theo quy định trong{' '}
                  <strong className="text-emerald-300 font-semibold underline decoration-emerald-400/40 underline-offset-2">
                    Văn bản bàn giao quyền khai thác thương mại
                  </strong>{' '}
                  (người mua toàn quyền sử dụng thương mại nhưng không được mạo danh tác giả).
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCommercialRightsModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 hover:text-white transition cursor-pointer"
                  >
                    <FileText size={14} /> Xem điều lệ bàn giao quyền thương mại
                  </button>

                  {agreedCommercialRights ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 size={13} /> Đã đồng ý điều lệ
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-300/80">
                      * Bắt buộc đồng ý trước khi tạo phiên
                    </span>
                  )}
                </div>
              </div>
            </div>
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
              disabled={submitting || !agreedCommercialRights}
              className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-8 py-3 font-h1 text-xs font-bold text-brand-navy shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gavel size={16} /> {submitting ? 'Đang tạo phiên...' : 'Phát hành phiên đấu giá'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Văn bản bàn giao quyền khai thác thương mại */}
      {showCommercialRightsModal && (
        <CommercialRightsModal
          artworkTitle={selectedArtworkTitle}
          creatorName={user?.fullName || 'Tác giả (Creator)'}
          onAgree={() => {
            setAgreedCommercialRights(true);
            if (error?.includes('Văn bản bàn giao')) {
              setError(null);
            }
          }}
          onClose={() => setShowCommercialRightsModal(false)}
        />
      )}
    </div>
  );
}
