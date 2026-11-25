'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Coins,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Undo2,
  Video,
} from 'lucide-react';
import { auctionError, auctionService } from '../services/auction.service';
import type { MyAuctionPenaltyDto, MyPenaltySummary } from '../types/auction.types';
import { SellerPenaltyLadder } from './seller-penalty-ladder';

const levelLabel: Record<number, string> = {
  1: 'Mức 1 · Nhắc nhở',
  2: 'Mức 2 · Khoá đăng bán 1 ngày',
  3: 'Mức 3 · Trừ thêm 20%',
  4: 'Mức 4 · Trừ thêm 40%, khoá 7 ngày',
  5: 'Mức 5 · Khoá bán vĩnh viễn',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

/** Câu chữ cho người bán đọc: kết quả phân xử quyết định tiền đi đâu. */
function resolutionText(resolution: string | null, escrowReleased: boolean) {
  if (resolution === 'refund') {
    return { tone: 'rose', text: 'Người mua được hoàn tiền — tiền bán tranh chưa về ví bạn.' };
  }
  if (resolution === 'paid-out' || resolution === 'release') {
    return { tone: 'amber', text: 'Tiền bán tranh đã về ví bạn trước khi khiếu nại được xác nhận.' };
  }
  if (escrowReleased) {
    return { tone: 'amber', text: 'Khoản tiền của phiên này đã được giải ngân cho bạn.' };
  }
  // Hồ sơ cũ (trước khi có trường kết quả phân xử) không lưu lại tiền đã đi đâu; chỉ khẳng định
  // điều chắc chắn: khiếu nại đã được xác nhận.
  return { tone: 'outline', text: 'Khiếu nại đã được Ban quản trị xác nhận.' };
}

/**
 * "Tôi bị báo cáo" — màn của CHÍNH người bán.
 *
 * Trước đây người bán chỉ thấy đúng câu "Bạn đang ở mức 3/5" trong thẻ giao hàng: biết mình bị
 * phạt nhưng không biết bị báo cáo ở phiên nào, người mua nêu lý do gì, Ban quản trị kết luận
 * ra sao, còn bị trừ bao nhiêu phiên, có đang bị khoá bán không, và án phạt có được thu hồi.
 */
export function MyPenaltiesScreen() {
  const [items, setItems] = useState<MyAuctionPenaltyDto[]>([]);
  const [summary, setSummary] = useState<MyPenaltySummary | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextCursor?: string) => {
    if (nextCursor) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await auctionService.getMyPenalties(nextCursor, 10);
      setItems((prev) => (nextCursor ? [...prev, ...res.items] : res.items));
      setSummary(res.summary);
      setCursor(res.nextCursor);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(auctionError(err) || 'Không tải được lịch sử bị báo cáo.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await load();
    })();
  }, [load]);

  const level = summary?.currentLevel ?? 0;
  const bannedUntil = summary?.bannedUntil ? new Date(summary.bannedUntil) : null;
  const isBanned = Boolean(bannedUntil && bannedUntil.getTime() > Date.now());

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 text-on-surface">
      <Link href="/my-auctions" className="mb-5 inline-flex items-center gap-1.5 text-xs text-outline hover:text-[#241F1A]">
        <ArrowLeft size={14} /> Về phiên đấu giá của tôi </Link>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-h1 text-2xl font-bold md:text-3xl">Tôi bị báo cáo</h1>
          <p className="mt-1 text-xs text-on-surface-variant"> Mỗi lần người mua khiếu nại và Ban quản trị xác nhận, bạn bị tính một mức phạt. Dưới đây là toàn bộ
 hồ sơ, kết luận và tình trạng hiện tại của tài khoản bán. </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-2 text-xs font-semibold hover:bg-[#F0E7D8]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới </button>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
          {error}
        </div>
      )}

      {/* Tình trạng bán hiện tại */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className={`glass-container rounded-3xl border p-5 ${
            level >= 4 ? 'border-[#A8321C]/40 bg-[#A8321C]/5' : level > 0 ? 'border-[#8A6A1F]/40 bg-[#8A6A1F]/5' : 'border-[#2F6B63]/35 bg-[#2F6B63]/5'
          }`}
        >
          <span className="text-xs text-outline">Mức phạt đang đứng</span>
          <p className="mt-1 font-h1 text-2xl font-bold">
            {level > 0 ? `${level}/5` : 'Chưa bị phạt'}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">{level > 0 ? levelLabel[level] : 'Bạn đang bán bình thường.'}</p>
        </div>

        <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-5">
          <span className="text-xs text-outline">Phụ phí đang áp</span>
          <p className="mt-1 font-h1 text-2xl font-bold text-[#8A6A1F]">
            {summary?.activeSurchargePercent ? `+${summary.activeSurchargePercent}%` : '0%'}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {summary?.surchargeSessionsRemaining
              ? `Còn ${summary.surchargeSessionsRemaining} phiên bán bị trừ thêm.`
              : 'Không có phiên nào bị trừ thêm.'}
          </p>
        </div>

        <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-5">
          <span className="text-xs text-outline">Quyền đăng bán</span>
          <p className="mt-1 font-h1 text-lg font-bold">
            {isBanned ? (
              <span className="text-[#A8321C]">Đang bị tạm khoá</span>
            ) : (
              <span className="text-[#2F6B63]">Bình thường</span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {isBanned ? `Mở lại sau ${bannedUntil!.toLocaleString('vi-VN')}.` : 'Bạn vẫn đăng bán tranh được.'}
          </p>
        </div>

        <div className="glass-container rounded-3xl border border-[#221E1A]/10 p-5">
          <span className="text-xs text-outline">Số hồ sơ</span>
          <p className="mt-1 font-h1 text-2xl font-bold">
            {summary?.activePenaltyCount ?? 0}
            <span className="ml-1 text-sm font-normal text-outline">đang phải chịu</span>
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {summary?.consumedPenaltyCount ? `${summary.consumedPenaltyCount} hồ sơ đã chạy xong` : 'Không có hồ sơ nào đã chạy xong'}
            {summary?.revokedPenaltyCount ? ` · ${summary.revokedPenaltyCount} đã thu hồi.` : '.'}
          </p>
        </div>
      </div>

      {/* Bảng thang phạt để người bán hiểu mức tiếp theo */}
      <div className="mb-6">
        <SellerPenaltyLadder level={level} defaultOpen />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center text-outline">
          <LoaderCircle size={26} className="mx-auto mb-2 animate-spin" /> Đang tải hồ sơ bị báo cáo… </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-12 text-center text-outline">
          <ShieldCheck size={38} className="mx-auto mb-3 text-[#2F6B63]" />
          <p className="text-sm text-on-surface">Bạn chưa bị người mua báo cáo lần nào.</p>
          <p className="mt-1 text-xs"> Giao hàng đúng mô tả và lưu biên lai bưu cục — đó là bằng chứng giúp bạn nếu có khiếu nại. </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-outline">{`${total} hồ sơ`}</p>
          <div className="space-y-4">
            {items.map((item) => {
              const isRevoked = item.status === 'Revoked';
              const isConsumed = item.status === 'Consumed';
              const res = resolutionText(item.disputeResolution, item.escrowReleasedAtStrike);
              const banAt = item.banUntil ? new Date(item.banUntil) : null;

              return (
                <article
                  key={item.penaltyId}
                  className={`glass-container rounded-3xl border p-5 ${
                    isRevoked || isConsumed ? 'border-[#221E1A]/10 opacity-90' : 'border-[#A8321C]/35 bg-[#A8321C]/12/[0.04]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]">
                        {item.artworkThumbnailUrl ? (
                          <Image src={item.artworkThumbnailUrl} alt={item.artworkTitle ?? 'Tác phẩm'} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-outline">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-h1 text-sm font-bold text-on-surface line-clamp-1">
                          {item.artworkTitle ?? 'Tác phẩm đấu giá'}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-outline">
                          Bị ghi nhận lúc {formatDate(item.createdAt)} · Phiên #{item.sourceAuctionId.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          isRevoked
                            ? 'border-[#221E1A]/10 bg-[#FFFCF6] text-outline'
                            : 'border-[#A8321C]/40 bg-[#A8321C]/15 text-[#A8321C]'
                        }`}
                      >
                        {levelLabel[item.strikeLevel] ?? `Mức ${item.strikeLevel}`}
                      </span>
                      {isRevoked && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#2F6B63]/40 bg-[#2F6B63]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#2F6B63]">
                          <Undo2 size={11} /> Đã thu hồi </span>
                      )}
                      {isConsumed && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-0.5 text-[11px] font-bold text-outline">
                          <CheckCircle2 size={11} /> Đã chạy xong </span>
                      )}
                    </div>
                  </div>

                  {/* Lý do người mua nêu */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/25 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#A8321C]">
                        <AlertTriangle size={12} /> Người mua báo cáo </p>
                      <p className="text-on-surface-variant">{item.buyerComplaint ?? 'Không có mô tả kèm theo.'}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-outline">
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon size={10} /> {item.evidenceImageCount} ảnh bằng chứng
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Video size={10} /> {item.hasEvidenceVideo ? 'có video' : 'không video'}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/25 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-brand-periwinkle">
                        <FileText size={12} /> Kết luận của Ban quản trị </p>
                      <p className="text-on-surface-variant">{item.reason ?? 'Không có ghi chú.'}</p>
                      {item.adminNote && (
                        <p className="mt-1.5 border-t border-[#221E1A]/10 pt-1.5 text-[11px] italic text-outline">
                          Ghi chú phân xử: “{item.adminNote}”
                        </p>
                      )}
                      <p
                        className={`mt-1.5 text-[11px] font-semibold ${
                          res.tone === 'rose' ? 'text-[#A8321C]' : res.tone === 'amber' ? 'text-[#8A6A1F]' : 'text-outline'
                        }`}
                      >
                        {res.text}
                      </p>
                    </div>

                    {/* Hệ quả cụ thể của mức phạt này */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {item.surchargePercent != null && item.sessionsTotal > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${
                            item.sessionsUsed < item.sessionsTotal
                              ? 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F]'
                              : 'border-[#221E1A]/10 bg-[#FFFCF6] text-outline'
                          }`}
                        >
                          <Coins size={11} /> Trừ thêm {item.surchargePercent}% · đã dùng {item.sessionsUsed}/{item.sessionsTotal} phiên
                        </span>
                      )}
                      {banAt && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${
                            banAt.getTime() > Date.now()
                              ? 'border-[#A8321C]/40 bg-[#A8321C]/10 text-[#A8321C]'
                              : 'border-[#221E1A]/10 bg-[#FFFCF6] text-outline'
                          }`}
                        >
                          <Ban size={11} />
                          {banAt.getTime() > Date.now()
                            ? `Khoá đăng bán tới ${banAt.toLocaleString('vi-VN')}`
                            : `Đã hết khoá bán (${banAt.toLocaleDateString('vi-VN')})`}
                        </span>
                      )}
                      {item.surchargePercent == null && item.sessionsTotal === 0 && !banAt && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2 py-1 text-outline">
                          <CheckCircle2 size={11} /> Mức này chỉ nhắc nhở, không mất tiền </span>
                      )}
                    </div>

                    {isRevoked && (
                      <p className="rounded-xl border border-[#2F6B63]/40 bg-[#2F6B63]/10 px-3 py-2 text-[11px] text-[#2F6B63]">
                        Hồ sơ này đã được Ban quản trị thu hồi ngày {formatDate(item.revokedAt)}
                        {item.revokeReason ? ` — lý do: “${item.revokeReason}”.` : '.'} Mức phạt và phụ phí từ hồ sơ này
                        không còn được tính.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 border-t border-[#221E1A]/10 pt-3">
                    <Link
                      href={`/auctions/${item.sourceAuctionId}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 px-3 py-1.5 text-[11px] font-semibold text-outline hover:text-[#241F1A]"
                    > Xem phiên đấu giá <ExternalLink size={11} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {cursor && (
            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void load(cursor)}
                className="inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/10 px-6 py-2.5 font-h1 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle hover:text-[#FFFCF6] disabled:opacity-50"
              >
                {loadingMore ? 'Đang tải...' : 'Xem thêm hồ sơ cũ hơn'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
