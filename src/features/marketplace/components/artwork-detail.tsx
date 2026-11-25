'use client';

import { createPortal } from 'react-dom';
import { localizeStyle } from '../utils/style-labels';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
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
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/store/use-auth-store';

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

  /** Tab trình duyệt mang tên tác phẩm, không phải tên site chung. */
  useEffect(() => {
    if (!artwork || typeof document === 'undefined') return;
    const previous = document.title;
    document.title = `${artwork.title} — dilillustration`;
    return () => {
      document.title = previous;
    };
  }, [artwork]);

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

  const { t } = useLanguage();
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

  /**
   * Chia sẻ đường dẫn.
   *
   * Bản cũ nuốt mọi lỗi trong `catch {}` — nếu `navigator.share` từ chối (không phải
   * do người dùng huỷ) hoặc clipboard bị chặn thì bấm nút KHÔNG có phản hồi nào, đúng
   * kiểu "nút chết". Giờ: huỷ thì im, lỗi thật thì sao chép dự phòng, cuối cùng vẫn
   * phải báo cho người dùng biết chuyện gì xảy ra.
   */
  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/artworks/${activeId}` : '';
    if (!shareUrl) return;

    const copy = async () => {
      if (!navigator.clipboard?.writeText) return false;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Đã sao chép đường dẫn tác phẩm.');
        return true;
      } catch {
        return false;
      }
    };

    if (navigator.share) {
      try {
        await navigator.share({ title: artwork?.title || 'Dillustration Artwork', url: shareUrl });
        return;
      } catch (cause) {
        // Người dùng tự đóng hộp thoại chia sẻ → không làm phiền.
        if (cause instanceof Error && cause.name === 'AbortError') return;
      }
    }

    if (!(await copy())) {
      toast.error('Không chia sẻ được. Đường dẫn: ' + shareUrl);
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
      <div className="p-16 text-center text-sm text-[#5f574d]">Đang tải tác phẩm…</div>
    );
  }
  if (!artwork) {
    return (
      <div className="p-16 text-center text-sm text-[#5f574d]">Không tìm thấy tác phẩm.</div>
    );
  }

  return (
    <div className={`qv-grid grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,24rem)] lg:gap-8 ${mode === 'modal' ? 'h-full min-h-0 items-stretch' : 'items-start'}`}>
      {/* CỘT TRÁI: Khung ngắm tranh bảo mật + Footer + Đánh giá / Bình luận */}
      <div className={`flex flex-col gap-4 ${mode === 'modal' ? 'h-full min-h-0' : ''}`}>
        <div className={`flex min-h-0 flex-col gap-3 ${mode === 'modal' ? 'flex-1' : ''}`}>
          <div className={`group relative w-full overflow-hidden rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] ${mode === 'modal' ? 'min-h-0 flex-1' : 'h-[min(46dvh,420px)] sm:h-[min(50dvh,470px)]'}`} style={mode === 'modal' ? { maxHeight: 'min(60dvh, 560px)' } : undefined}>
            <ProtectedArtworkViewer
              artworkId={activeId}
              fallbackImageUrl={artwork.imageUrl}
              alt={artwork.title}
              fitMode="contain"
              showWatermarkBadge={false}
              className="h-full w-full"
              onOpenLightbox={() => setIsLightboxOpen(true)}
            />


            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Xem ảnh toàn màn hình"
              title="Xem ảnh toàn màn hình"
              className="absolute right-3.5 top-3.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#221E1A]/10 bg-[#FFFCF6]/85 text-[#5f574d] backdrop-blur-md transition hover:bg-[#F0E7D8] hover:text-[#241F1A] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
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
                    ? 'border-[#8A6A1F]/40 bg-[#8A6A1F]/10 text-[#8A6A1F] hover:bg-[#8A6A1F]/20'
                    : 'border-[#2F6B63]/40 bg-[#2F6B63]/10 text-[#2F6B63] hover:bg-[#2F6B63]/20'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>{isExclusive ? 'Chứng nhận Độc bản 1/1' : 'Chứng nhận bản gốc'}</span>
              </button>

              {!artwork.isAiGenerated ? (
                <span
                  title="Tác phẩm vẽ tay, không gắn nhãn AI"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 bg-[#F0E7D8] px-3 py-1.5 font-medium text-[#5f574d]"
                >
                  <PenTool className="h-3.5 w-3.5 text-[#8C3718]" />
                  <span>100% Vẽ tay</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/35 bg-[#8A6A1F]/10 px-3 py-1.5 font-medium text-[#8A6A1F]">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#221E1A]/10 bg-[#F0E7D8] text-[#5f574d] transition hover:bg-[#FFFCF6] hover:text-[#241F1A]"
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
        <section className={`border-t border-[#221E1A]/10 ${mode === 'modal' ? 'hidden' : 'pt-5'}`} aria-label="Đánh giá và bình luận">
          <div className={`flex flex-wrap items-center justify-between gap-2 ${mode === 'modal' ? 'mb-2' : 'mb-4'}`}>
            <div className="inline-flex rounded-xl bg-[#F0E7D8]/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setBottomTab('reviews')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  bottomTab === 'reviews'
                    ? 'bg-[#8C3718] text-[#FFFCF6]'
                    : 'text-[#5f574d] hover:text-[#241F1A]'
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
                    ? 'bg-[#8C3718] text-[#FFFCF6]'
                    : 'text-[#5f574d] hover:text-[#241F1A]'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Bình luận ({comments.length})</span>
              </button>
            </div>

            {bottomTab === 'reviews' && ratingCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1 text-xs font-semibold tabular-nums text-[#8A6A1F]">
                <span>★ {ratingAverage.toFixed(1)} / 5.0</span>
                <span className="font-medium text-[#5f574d]">· {ratingCount} lượt</span>
              </div>
            )}
          </div>

          {bottomTab === 'reviews' ? (
            visibleReviews.length > 0 ? (
              <div className="space-y-2.5">
                {(mode === 'modal' ? visibleReviews.slice(0, 2) : visibleReviews).map((item) => {
                  const text = parseReviewTags(item.comment);
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl bg-[#F0E7D8]/55 px-3.5 py-3 text-xs"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#241F1A]">
                            {item.reviewerName || 'Khách hàng'}
                          </span>
                          <span className="text-[#8A6A1F]" aria-label={`${item.rating} sao`}>
                            {'★'.repeat(Math.max(1, Math.min(5, item.rating)))}
                          </span>
                          {item.commissionTitle && (
                            <span className="text-[#5f574d]">· {item.commissionTitle}</span>
                          )}
                        </div>
                        <span className="tabular-nums text-[#5f574d]">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {text && <p className="text-[13px] leading-relaxed text-[#5f574d]">{text}</p>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-[#F0E7D8]/40 px-4 py-5 text-center text-xs text-[#5f574d]"> Chưa có đánh giá nào cho gói vẽ này. </p>
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
                  className="min-w-0 flex-1 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/70 px-3.5 py-2.5 text-xs text-[#241F1A] outline-none focus:border-[#8C3718]"
                />
                <button
                  disabled={submitting}
                  aria-label="Gửi bình luận"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8C3718] text-[#FFFCF6] transition hover:bg-[#c5c8f5] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {comments.length > 0 ? (
                <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                  {comments.map((item, idx) => (
                    <article
                      key={`${item.time}-${idx}`}
                      className="rounded-xl bg-[#F0E7D8]/55 px-3.5 py-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[#241F1A]">{item.name}</strong>
                        <span className="text-[#5f574d]">{item.time}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] text-[#5f574d]">{item.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-[#F0E7D8]/40 px-4 py-4 text-center text-xs text-[#5f574d]"> Hãy là người đầu tiên bình luận tác phẩm này. </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* CỘT PHẢI: Thông tin tác phẩm + Gói đặt vẽ + Tác quyền + Tranh khác */}
      <aside className={`flex flex-col divide-y divide-[#221E1A]/10 ${mode === 'modal' ? 'h-full min-h-0 overflow-hidden' : ''}`}>
        {/* 1. Tiêu đề + Style/Ngày + Họa sĩ */}
        <div className={`pb-5 ${mode === 'modal' ? 'pr-12' : ''}`}>
          <h1 className="font-h1 text-balance text-[23px] font-bold leading-snug tracking-[-0.015em] text-[#241F1A]">
            {artwork.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs tabular-nums text-[#5f574d]">
            <Link
              href={
                artwork.categoryName || artwork.style
                  ? `/explore?category=${encodeURIComponent(artwork.categoryName || artwork.style || '')}`
                  : '/explore'
              }
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#8C3718]/30 bg-[#8C3718]/15 px-2.5 py-1 font-semibold text-[#8C3718] transition hover:bg-[#8C3718]/25"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>{localizeStyle(artwork.categoryName || artwork.style) || 'Tranh kỹ thuật số'}</span>
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(artwork.createdAt).toLocaleDateString('vi-VN')}</span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#221E1A]/10 bg-[#F0E7D8] text-xs font-semibold text-[#8C3718]"
              aria-hidden="true"
            >
              {initialsOf(creatorDisplay)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/creators/${artwork.creatorProfileId}`}
                  onClick={onClose}
                  className="truncate text-sm font-semibold text-[#241F1A] transition hover:text-[#8C3718]"
                >
                  {creatorDisplay}
                </Link>
                {creatorProfile?.isApproved && (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#8C3718]" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs tabular-nums text-[#5f574d]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#8A6A1F]">
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
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#5f574d]">
                {artwork.description}
              </p>
            )}
            {artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Thẻ phân loại">
                {artwork.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                    onClick={onClose}
                    className="rounded-lg bg-[#F0E7D8] px-2.5 py-1 text-xs text-[#5f574d] transition hover:bg-[#FFFCF6] hover:text-[#241F1A]"
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
              <div className="space-y-3 rounded-[14px] border border-[#8C3718]/25 bg-[#F0E7D8] p-4">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8C3718]/15 text-[#8C3718]">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13.5px] font-semibold leading-snug text-[#241F1A]">
                      {matchedPkg.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#8C3718]">
                    {t(`Từ ${formatVnd(matchedPkg.price)}`)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#221E1A]/10 pt-2.5 text-xs tabular-nums text-[#5f574d]">
                  <span className="inline-flex items-center gap-1.5" title={t('Số giai đoạn bàn giao & giải ngân')}>
                    <Layers className="h-3.5 w-3.5 text-[#5f574d]" />
                    <span>{t(`${matchedPkg.milestones?.length || 1} cột mốc`)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5" title={t('Số lần chỉnh sửa miễn phí mỗi mốc')}>
                    <RotateCcw className="h-3.5 w-3.5 text-[#5f574d]" />
                    <span>{t(`${pkgRevisions} lần sửa`)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5" title={t('Định dạng tệp bàn giao theo thỏa thuận')}>
                    <ImageIcon className="h-3.5 w-3.5 text-[#5f574d]" />
                    <span>{t('Tệp theo yêu cầu')}</span>
                  </span>
                </div>

                {isOwnArtwork ? (
                  <Link
                    href="/creator/services"
                    onClick={onClose}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#221E1A]/10 bg-[#FFFCF6] px-3 text-[13px] font-semibold text-[#241F1A] transition hover:bg-[#F0E7D8]"
                  >
                    <span>{t('Chỉnh sửa gói')}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={!canCommission}
                    onClick={() => setIsCommissionOpen(true)}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#8C3718] px-3 text-[13px] font-semibold tabular-nums text-[#FFFCF6] transition hover:bg-[#c5c8f5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      {creatorProfile?.isAcceptingOrders === false
                        ? t('Họa sĩ đang tạm ngưng nhận đơn')
                        : pkgSlot?.isFull
                          ? t('Gói này đã hết lượt')
                          : pkgSlot?.isLimited
                            ? t(`Đặt vẽ gói này (${pkgSlot.remaining}/${pkgSlot.maxSlots} slot)`)
                            : t('Đặt vẽ gói này (∞ Không giới hạn)')}
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
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#8C3718] px-4 text-[13px] font-semibold text-[#FFFCF6] transition hover:bg-[#c5c8f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {creatorProfile?.isAcceptingOrders === false
                    ? t('Họa sĩ đang tạm ngưng nhận đơn')
                    : t('Đặt vẽ với họa sĩ này')}
                </span>
                {creatorProfile?.isAcceptingOrders !== false && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* 4. Làm rõ bản quyền */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-xs">
          <div className="inline-flex items-center gap-1.5 text-[#5f574d]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#2F6B63]" />
            {isExclusive && provenance ? (
              <span>
                {t('Sáng tác:')} <strong className="text-[#241F1A]">{provenance.creatorName}</strong>
                <span className="mx-1 text-[#5f574d]">→</span>
                {t('Sở hữu:')} <strong className="text-[#241F1A]">{provenance.currentOwnerName}</strong>
              </span>
            ) : (
              <span>
                {t('Tác quyền:')} <strong className="text-[#241F1A]">{t(`Thuộc về ${creatorDisplay}`)}</strong>
              </span>
            )}
          </div>
          {isSampleMatch && matchedPkg && (
            <span className="rounded-full border border-[#8C3718]/30 bg-[#8C3718]/10 px-2.5 py-1 text-[11px] font-medium text-[#8C3718]">
              {t(`Tranh mẫu gói ${matchedPkg.name}`)}
            </span>
          )}
        </div>

        {/* Giải nghĩa giá khởi điểm / giấy phép / slot — CHỈ ở trang chi tiết,
            modal xem nhanh giữ gọn một màn hình. */}
        {mode !== 'modal' && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]/60 px-4 py-3.5 text-[11.5px] leading-relaxed text-[#5f574d] sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-[#241F1A]">Giá khởi điểm</dt>
          <dd className="min-w-0">Mức thấp nhất để bắt đầu một đơn vẽ; họa sĩ có thể báo thêm nếu yêu cầu phức tạp hơn.</dd>
          <dt className="font-semibold text-[#241F1A]">Giấy phép cá nhân</dt>
          <dd className="min-w-0">Dùng cho mục đích phi thương mại: in treo nhà, quà tặng, avatar, dự án học tập. Không bán lại, không dùng cho quảng cáo.</dd>
          <dt className="font-semibold text-[#241F1A]">Giấy phép thương mại</dt>
          <dd className="min-w-0">Được dùng trong sản phẩm/dịch vụ có thu tiền (bìa sách, game, nhãn hàng, quảng cáo) theo phạm vi hai bên thỏa thuận.</dd>
          <dt className="font-semibold text-[#241F1A]">Lượt nhận đơn</dt>
          <dd className="min-w-0">Số đơn tối đa họa sĩ nhận thêm trong tháng; 0 nghĩa là đang kín lịch.</dd>
        </dl>
        )}

        {/* Nút sang trang chi tiết đầy đủ (modal chỉ là bản xem nhanh). */}
        {mode === 'modal' && (
          <div className="py-3.5">
            <a href={`/artworks/${activeId}`} className="btn btn--outline btn--block btn--sm"> Xem trang chi tiết đầy đủ <ArrowLeft className="size-4 rotate-180" aria-hidden />
            </a>
          </div>
        )}

        {/* 5. Tranh khác của họa sĩ — ẩn trong modal để gói gọn một màn hình */}
        {artistThumbs.length > 0 && mode !== 'modal' && (
          <div className="pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#241F1A]">
                Tranh khác của {creatorDisplay}
              </span>
              <Link
                href={`/creators/${artwork.creatorProfileId}`}
                onClick={onClose}
                className="text-xs text-[#8C3718] hover:underline"
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
                    className={`relative aspect-square overflow-hidden rounded-[10px] border bg-[#FFFCF6] transition hover:-translate-y-0.5 hover:border-[#8C3718] ${
                      isCurrent
                        ? 'border-[#8C3718] ring-1 ring-[#8C3718]'
                        : 'border-[#221E1A]/10'
                    }`}
                  >
                    {item.thumbnailUrl || item.imageUrl ? (
                      <Image
                        src={(item.thumbnailUrl || item.imageUrl) as string}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[10px] text-[#5f574d]">
                        Không có ảnh
                      </span>
                    )}
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
    <div className="min-h-screen bg-[#FFFCF6] px-4 py-8 text-[#241F1A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-5">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#5f574d] transition hover:text-[#241F1A]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại trang khám phá</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:p-7">
          <ArtworkDetailContent key={id} id={id} mode="page" />
        </div>
      </div>
    </div>
  );
}

export function ArtworkDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Khoá scroll trang nền; modal tự cuộn bên trong.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] grid place-items-center overflow-hidden bg-[#221E1A]/38 p-4 backdrop-blur-[6px] sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1280px]">
        <div className="qv-panel relative h-[min(86dvh,820px)] w-full max-w-[1200px] overflow-hidden rounded-[26px] border border-[#221E1A]/10 bg-[#FFFCF6] p-5 shadow-[0_44px_90px_-44px_rgba(58,42,26,0.6)] sm:p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-5 top-5 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#221E1A]/12 bg-[#FFFCF6]/95 text-[#6E6459] shadow-[0_10px_20px_-14px_rgba(74,52,30,0.8)] backdrop-blur transition hover:border-[#B24A26]/40 hover:text-[#8C3718]"
          >
            <X className="h-4 w-4" />
          </button>

          <ArtworkDetailContent key={id} id={id} mode="modal" onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
