'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  Eye,
  Image as ImageIcon,
  Layers,
  Maximize2,
  MessageCircle,
  Palette,
  PenTool,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';
import {
  creatorRateCardService,
  getPackageSlotInfo,
  type RateCardPackage,
} from '@/features/creator-studio/services/creator-rate-card.service';
import type { CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import { auctionService } from '@/features/auction/services/auction.service';
import type { ArtworkProvenanceDto } from '@/features/auction/types/auction.types';
import { ArtworkProvenanceCard } from '@/features/auction';
import {
  marketplaceService,
  type CreatorReviewDto,
  type MarketplaceArtwork,
} from '../services/marketplace.service';
import { ArtworkActions } from './artwork-actions';
import { ProtectedArtworkLightbox, ProtectedArtworkViewer } from './protected-artwork-viewer';
import { useArtworkComments } from './use-artwork-comments';
import { useAuthStore } from '@/store/use-auth-store';

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=400&q=80';

const formatVnd = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;

const initialsOf = (name?: string | null) => {
  const parts = (name || 'LN').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DI';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

function parseReviewTags(raw?: string | null) {
  if (!raw) return '';
  return raw.replace(/\[(?:Điểm|Đặc điểm) nổi bật:\s*[^\]]+\]/gi, '').trim();
}

function matchArtworkPackage(
  artwork: MarketplaceArtwork | null,
  rates: RateCardPackage[]
): { pkg: RateCardPackage | null; isSampleMatch: boolean } {
  if (!artwork || rates.length === 0) return { pkg: null, isSampleMatch: false };

  const urls = new Set([artwork.imageUrl, artwork.thumbnailUrl].filter(Boolean) as string[]);
  const sampleMatched = rates.find((r) => r.sampleUrls?.some((u) => urls.has(u)));
  if (sampleMatched) return { pkg: sampleMatched, isSampleMatch: true };

  if (typeof artwork.startingPrice === 'number' && artwork.startingPrice > 0) {
    const closest = [...rates].sort(
      (a, b) => Math.abs(a.price - artwork.startingPrice!) - Math.abs(b.price - artwork.startingPrice!)
    )[0];
    return { pkg: closest ?? rates[0], isSampleMatch: false };
  }

  return { pkg: rates[0], isSampleMatch: false };
}

function ArtworkDetailContent({
  id,
  mode,
  onClose,
}: {
  id: string;
  mode: 'page' | 'modal';
  onClose?: () => void;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [activeId, setActiveId] = useState(id);
  const [artwork, setArtwork] = useState<MarketplaceArtwork | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileDto | null>(null);
  const [rates, setRates] = useState<RateCardPackage[]>([]);
  const [reviews, setReviews] = useState<CreatorReviewDto[]>([]);
  const [artistArtworks, setArtistArtworks] = useState<MarketplaceArtwork[]>([]);
  const [provenance, setProvenance] = useState<ArtworkProvenanceDto | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loading = loadedId !== activeId;
  const [bottomTab, setBottomTab] = useState<'reviews' | 'comments'>('reviews');
  const [showProvenanceDetail, setShowProvenanceDetail] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { comment, setComment, comments, submit, submitting } = useArtworkComments(activeId);

  useEffect(() => {
    let active = true;

    marketplaceService
      .getArtworkDetail(activeId)
      .then(async (detail) => {
        if (!active) return;
        const art = detail.artwork;

        const creatorId = art.creatorProfileId;
        const [profileRes, ratesRes, reviewsRes, allArtworksRes, provRes] = await Promise.all([
          marketplaceService.getCreatorById(creatorId).catch(() => null),
          creatorRateCardService.get(creatorId).catch(() => []),
          marketplaceService.getCreatorReviews(creatorId).catch(() => []),
          marketplaceService.getArtworks().catch(() => []),
          auctionService.getProvenance(activeId).catch(() => null),
        ]);
        if (!active) return;
        setArtwork(art);
        setCreatorProfile(profileRes);
        setRates(ratesRes);
        setReviews(reviewsRes);
        if (reviewsRes.length === 0) setBottomTab('comments');
        setArtistArtworks(
          allArtworksRes
            .filter((item) => item.creatorProfileId === creatorId && item.moderationStatus === 'Approved')
            .slice(0, 6)
        );
        setProvenance(provRes);
      })
      .catch(() => {
        if (active) setArtwork(null);
      })
      .finally(() => {
        if (active) setLoadedId(activeId);
      });

    return () => {
      active = false;
    };
  }, [activeId]);

  const { pkg: matchedPkg, isSampleMatch } = useMemo(
    () => matchArtworkPackage(artwork, rates),
    [artwork, rates]
  );

  const visibleReviews = useMemo(() => {
    if (!matchedPkg) return reviews.slice(0, 4);
    const matching = reviews.filter(
      (r) => r.commissionTitle?.toLowerCase() === matchedPkg.name.toLowerCase()
    );
    return (matching.length > 0 ? matching : reviews).slice(0, 4);
  }, [matchedPkg, reviews]);

  const artistThumbs = useMemo(() => {
    if (!artwork) return [];
    const others = artistArtworks.filter((a) => a.id !== artwork.id);
    return [artwork, ...others].slice(0, 3);
  }, [artwork, artistArtworks]);

  const creatorDisplay =
    creatorProfile?.displayName || artwork?.creatorName || 'Nghệ sĩ Dillustration';
  const ratingAverage = creatorProfile?.ratingAverage ?? artwork?.creatorRating ?? 0;
  const ratingCount = creatorProfile?.ratingCount ?? reviews.length;
  const followerCount = creatorProfile?.followerCount ?? 0;
  const pkgSlot = matchedPkg ? getPackageSlotInfo(matchedPkg) : null;
  const pkgRevisions =
    matchedPkg?.milestones?.[0]?.maxRevisions ?? matchedPkg?.maxRevisions ?? 3;
  const isExclusive = Boolean(provenance?.isCurrentOwnerCollector);
  const isOwnArtwork = Boolean(
    currentUserId && creatorProfile?.userId && currentUserId === creatorProfile.userId
  );
  const canCommission =
    !isOwnArtwork && creatorProfile?.isAcceptingOrders !== false && !(pkgSlot?.isFull ?? false);

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/artworks/${activeId}` : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: artwork?.title || 'Dillustration Artwork', url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Đã sao chép đường dẫn tác phẩm.');
      }
    } catch {
      // User cancelled native share
    }
  };

  const handleVerifyBadge = () => {
    if (provenance) {
      setShowProvenanceDetail((v) => !v);
      return;
    }
    toast.success(`Đã xác thực tác phẩm gốc thuộc về ${creatorDisplay} trên Dillustration.`);
  };

  if (loading && !artwork) {
    return (
      <div className="p-16 text-center text-sm text-[#9ca3af]">Đang tải tác phẩm…</div>
    );
  }
  if (!artwork) {
    return (
      <div className="p-16 text-center text-sm text-[#9ca3af]">Không tìm thấy tác phẩm.</div>
    );
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.35fr)_396px] lg:gap-8">
      {/* CỘT TRÁI: Khung ngắm tranh bảo mật + Footer + Đánh giá / Bình luận */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="group relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0f17] sm:h-[520px]">
            <ProtectedArtworkViewer
              artworkId={activeId}
              fallbackImageUrl={artwork.imageUrl}
              alt={artwork.title}
              fitMode="contain"
              showWatermarkBadge={false}
              className="h-full w-full"
              onOpenLightbox={() => setIsLightboxOpen(true)}
            />

            <div
              className="pointer-events-none absolute left-3.5 top-3.5 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#161923]/80 px-2.5 py-1 text-xs font-medium tabular-nums text-[#d1d5db] backdrop-blur-md"
              title="Lượt xem tác phẩm"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{artwork.viewCount.toLocaleString('vi-VN')}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Xem ảnh toàn màn hình"
              title="Xem ảnh toàn màn hình"
              className="absolute right-3.5 top-3.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#161923]/85 text-[#d1d5db] backdrop-blur-md transition hover:bg-[#1e2230] hover:text-white lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stage Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyBadge}
                title={provenance ? 'Bấm để xem lai lịch chuyển nhượng' : 'Xác thực tác phẩm gốc trên hệ thống'}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold transition ${
                  isExclusive
                    ? 'border-amber-400/35 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                    : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>{isExclusive ? 'Chứng nhận Độc bản 1/1' : 'Chứng nhận bản gốc'}</span>
              </button>

              {!artwork.isAiGenerated ? (
                <span
                  title="Tác phẩm vẽ tay, không gắn nhãn AI"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#1e2230] px-3 py-1.5 font-medium text-[#d1d5db]"
                >
                  <PenTool className="h-3.5 w-3.5 text-[#b3b7ee]" />
                  <span>100% Vẽ tay</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 font-medium text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Có hỗ trợ AI</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <ArtworkActions artworkId={activeId} compact />
              <button
                type="button"
                onClick={() => void handleShare()}
                aria-label="Chia sẻ đường dẫn tác phẩm"
                title="Sao chép đường dẫn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#1e2230] text-[#d1d5db] transition hover:bg-[#262b3d] hover:text-white"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showProvenanceDetail && provenance && (
            <div className="mt-2">
              <ArtworkProvenanceCard artworkId={activeId} />
            </div>
          )}
        </div>

        {/* Bottom Left: Đánh giá gói vẽ & Bình luận */}
        <section className="border-t border-white/[0.07] pt-5" aria-label="Đánh giá và bình luận">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl bg-[#1e2230]/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setBottomTab('reviews')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  bottomTab === 'reviews'
                    ? 'bg-[#b3b7ee] text-[#161923]'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                <span>Đánh giá ({reviews.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setBottomTab('comments')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  bottomTab === 'comments'
                    ? 'bg-[#b3b7ee] text-[#161923]'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Bình luận ({comments.length})</span>
              </button>
            </div>

            {bottomTab === 'reviews' && ratingCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#1e2230] px-3 py-1 text-xs font-semibold tabular-nums text-amber-300">
                <span>★ {ratingAverage.toFixed(1)} / 5.0</span>
                <span className="font-medium text-[#9ca3af]">· {ratingCount} lượt</span>
              </div>
            )}
          </div>

          {bottomTab === 'reviews' ? (
            visibleReviews.length > 0 ? (
              <div className="space-y-2.5">
                {visibleReviews.map((item) => {
                  const text = parseReviewTags(item.comment);
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl bg-[#1e2230]/55 px-3.5 py-3 text-xs"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            {item.reviewerName || 'Khách hàng'}
                          </span>
                          <span className="text-amber-400" aria-label={`${item.rating} sao`}>
                            {'★'.repeat(Math.max(1, Math.min(5, item.rating)))}
                          </span>
                          {item.commissionTitle && (
                            <span className="text-[#9ca3af]">· {item.commissionTitle}</span>
                          )}
                        </div>
                        <span className="tabular-nums text-[#8b93a7]">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {text && <p className="text-[13px] leading-relaxed text-[#d1d5db]">{text}</p>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-[#1e2230]/40 px-4 py-5 text-center text-xs text-[#9ca3af]">
                Chưa có đánh giá nào cho gói vẽ này.
              </p>
            )
          ) : (
            <div className="space-y-3">
              <form onSubmit={submit} className="flex gap-2">
                <input
                  disabled={submitting}
                  maxLength={1000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Viết bình luận của bạn…"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1e2230]/70 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#b3b7ee]"
                />
                <button
                  disabled={submitting}
                  aria-label="Gửi bình luận"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b3b7ee] text-[#161923] transition hover:bg-[#c5c8f5] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {comments.length > 0 ? (
                <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                  {comments.map((item, idx) => (
                    <article
                      key={`${item.time}-${idx}`}
                      className="rounded-xl bg-[#1e2230]/55 px-3.5 py-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-white">{item.name}</strong>
                        <span className="text-[#8b93a7]">{item.time}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] text-[#d1d5db]">{item.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-[#1e2230]/40 px-4 py-4 text-center text-xs text-[#9ca3af]">
                  Hãy là người đầu tiên bình luận tác phẩm này.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* CỘT PHẢI: Thông tin tác phẩm + Gói đặt vẽ + Tác quyền + Tranh khác */}
      <aside className="flex flex-col divide-y divide-white/[0.07]">
        {/* 1. Tiêu đề + Style/Ngày + Họa sĩ */}
        <div className={`pb-4 ${mode === 'modal' ? 'pr-9' : ''}`}>
          <h1 className="font-h1 text-balance text-[23px] font-bold leading-snug tracking-[-0.015em] text-white">
            {artwork.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs tabular-nums text-[#8b93a7]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#b3b7ee]">
              <Palette className="h-3.5 w-3.5" />
              <span>{artwork.style || artwork.tags?.[0] || 'Digital art'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(artwork.createdAt).toLocaleDateString('vi-VN')}</span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1e2230] text-xs font-semibold text-[#b3b7ee]"
              aria-hidden="true"
            >
              {initialsOf(creatorDisplay)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/creators/${artwork.creatorProfileId}`}
                  onClick={onClose}
                  className="truncate text-sm font-semibold text-white transition hover:text-[#b3b7ee]"
                >
                  {creatorDisplay}
                </Link>
                {creatorProfile?.isApproved && (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#b3b7ee]" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs tabular-nums text-[#9ca3af]">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Star className="h-3 w-3 fill-current" />
                  <span>
                    {ratingAverage.toFixed(1)} ({ratingCount})
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{followerCount.toLocaleString('vi-VN')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Mô tả & Tags */}
        {(artwork.description || artwork.tags.length > 0) && (
          <div className="space-y-3 py-4">
            {artwork.description && (
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#d1d5db]">
                {artwork.description}
              </p>
            )}
            {artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Thẻ phân loại">
                {artwork.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?style=${encodeURIComponent(tag)}`}
                    onClick={onClose}
                    className="rounded-lg bg-[#1e2230] px-2.5 py-1 text-xs text-[#9ca3af] transition hover:bg-[#262b3d] hover:text-white"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Gói đặt vẽ áp dụng */}
        {(matchedPkg || !isOwnArtwork) && (
          <div className="py-4">
            {matchedPkg ? (
              <div className="space-y-3 rounded-[14px] border border-[#b3b7ee]/25 bg-[#1e2230] p-4">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#b3b7ee]/15 text-[#b3b7ee]">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13.5px] font-semibold leading-snug text-white">
                      {matchedPkg.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#b3b7ee]">
                    Từ {formatVnd(matchedPkg.price)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.07] pt-2.5 text-xs tabular-nums text-[#d1d5db]">
                  <span className="inline-flex items-center gap-1.5" title="Số giai đoạn bàn giao & giải ngân">
                    <Layers className="h-3.5 w-3.5 text-[#9ca3af]" />
                    <span>{matchedPkg.milestones?.length || 1} cột mốc</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5" title="Số lần chỉnh sửa miễn phí mỗi mốc">
                    <RotateCcw className="h-3.5 w-3.5 text-[#9ca3af]" />
                    <span>{pkgRevisions} lần sửa</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5" title="Định dạng tệp bàn giao theo thỏa thuận">
                    <ImageIcon className="h-3.5 w-3.5 text-[#9ca3af]" />
                    <span>File theo yêu cầu</span>
                  </span>
                </div>

                {isOwnArtwork ? (
                  <Link
                    href="/creator/services"
                    onClick={onClose}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-white/15 bg-white/5 px-3 text-[13px] font-semibold text-white transition hover:bg-white/10"
                  >
                    <span>Chỉnh sửa gói</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={!canCommission}
                    onClick={() => setIsCommissionOpen(true)}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#b3b7ee] px-3 text-[13px] font-semibold tabular-nums text-[#161923] transition hover:bg-[#c5c8f5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      {creatorProfile?.isAcceptingOrders === false
                        ? 'Creator đang tạm ngưng nhận đơn'
                        : pkgSlot?.isFull
                          ? 'Gói này đã hết slot'
                          : pkgSlot?.isLimited
                            ? `Đặt vẽ gói này (${pkgSlot.remaining}/${pkgSlot.maxSlots} slot)`
                            : 'Đặt vẽ gói này (∞ Không giới hạn)'}
                    </span>
                    {canCommission && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={creatorProfile?.isAcceptingOrders === false}
                onClick={() => setIsCommissionOpen(true)}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#b3b7ee] px-4 text-[13px] font-semibold text-[#161923] transition hover:bg-[#c5c8f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {creatorProfile?.isAcceptingOrders === false
                    ? 'Creator đang tạm ngưng nhận đơn'
                    : 'Đặt vẽ với họa sĩ này'}
                </span>
                {creatorProfile?.isAcceptingOrders !== false && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* 4. Làm rõ bản quyền */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-xs">
          <div className="inline-flex items-center gap-1.5 text-[#9ca3af]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {isExclusive && provenance ? (
              <span>
                Sáng tác: <strong className="text-white">{provenance.creatorName}</strong>
                <span className="mx-1 text-[#8b93a7]">→</span>
                Sở hữu: <strong className="text-white">{provenance.currentOwnerName}</strong>
              </span>
            ) : (
              <span>
                Tác quyền: <strong className="text-white">Thuộc về {creatorDisplay}</strong>
              </span>
            )}
          </div>
          {isSampleMatch && matchedPkg && (
            <span className="rounded-full border border-[#b3b7ee]/30 bg-[#b3b7ee]/10 px-2.5 py-1 text-[11px] font-medium text-[#b3b7ee]">
              Tranh mẫu gói {matchedPkg.name}
            </span>
          )}
        </div>

        {/* 5. Tranh khác của họa sĩ */}
        {artistThumbs.length > 0 && (
          <div className="pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-white">
                Tranh khác của {creatorDisplay}
              </span>
              <Link
                href={`/creators/${artwork.creatorProfileId}`}
                onClick={onClose}
                className="text-xs text-[#b3b7ee] hover:underline"
              >
                Tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {artistThumbs.map((item) => {
                const isCurrent = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isCurrent ? 'true' : 'false'}
                    title={item.title}
                    onClick={() => {
                      setShowProvenanceDetail(false);
                      setActiveId(item.id);
                    }}
                    className={`relative aspect-square overflow-hidden rounded-[10px] border bg-[#0d0f17] transition hover:-translate-y-0.5 hover:border-[#b3b7ee] ${
                      isCurrent
                        ? 'border-[#b3b7ee] ring-1 ring-[#b3b7ee]'
                        : 'border-white/[0.07]'
                    }`}
                  >
                    <Image
                      src={item.thumbnailUrl || item.imageUrl || DEFAULT_THUMB}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {!isOwnArtwork && isCommissionOpen && (
        <CreateCommissionModal
          creatorId={artwork.creatorProfileId}
          creatorName={creatorDisplay}
          initialPackageId={matchedPkg?.id}
          onClose={() => setIsCommissionOpen(false)}
        />
      )}

      {isLightboxOpen && (
        <ProtectedArtworkLightbox
          artworkId={activeId}
          imageUrl={artwork.imageUrl}
          alt={artwork.title}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}

export function ArtworkDetail({ id }: { id: string }) {
  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-5">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#9ca3af] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại trang khám phá</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#161923] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:p-7">
          <ArtworkDetailContent key={id} id={id} mode="page" />
        </div>
      </div>
    </main>
  );
}

export function ArtworkDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-[#0b0d16]/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto my-4 max-w-[1080px]">
        <div className="relative rounded-3xl border border-white/10 bg-[#161923] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.5)] sm:p-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-5 top-5 z-20 inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/[0.07] bg-[#1e2230] text-[#9ca3af] transition hover:bg-[#262b3d] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <ArtworkDetailContent key={id} id={id} mode="modal" onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
