'use client';

function parseReviewComment(raw?: string | null) {
  if (!raw) return { userComment: '', tags: [] as string[] };
  const match = raw.match(/\[(?:Điểm|Đặc điểm) nổi bật:\s*([^\]]+)\]/i);
  if (!match) {
    return { userComment: raw.trim(), tags: [] as string[] };
  }
  const tags = match[1].split(',').map((t) => t.trim()).filter(Boolean);
  const userComment = raw.replace(match[0], '').trim();
  return { userComment, tags };
}

function formatTimestamp(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} · ${date}`;
}

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Sparkles, ChevronLeft, ChevronRight, X, Clock, Star, ArrowUpDown } from 'lucide-react';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';
import { useAuthStore } from '@/store/use-auth-store';
import { creatorRateCardService, getPackageSlotInfo, type RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { CreatorTermsOverview } from '@/components/terms/CreatorTermsOverview';
import type { ArtworkDto, CreatorProfileDto, CreatorTermsDto } from '@/features/creator-studio/types/creator-profile.types';
import { marketplaceService, type CreatorReviewDto } from '@/features/marketplace/services/marketplace.service';
import { commissionService } from '@/services/commission.service';
import { ProfileLayout, ProfileTabs } from './profile-layout';

type Tab = 'portfolio' | 'rates' | 'reviews' | 'terms';

export function CreatorProfileScreen({ id }: { id: string }) {

  const currentUserId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [profile, setProfile] = useState<CreatorProfileDto | null>(null);
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [rates, setRates] = useState<RateCardPackage[]>([]);
  const [reviews, setReviews] = useState<CreatorReviewDto[]>([]);
  const [terms, setTerms] = useState<CreatorTermsDto | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('portfolio');
  type ReviewFilter = 'all' | '5' | '4' | '3' | '2' | '1' | 'with-reply';
  type ReviewSort = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc';
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [reviewSort, setReviewSort] = useState<ReviewSort>('newest');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [reviewPage, setReviewPage] = useState<number>(1);
  const REVIEWS_PER_PAGE = 5;
  const [lightboxData, setLightboxData] = useState<{ urls: string[]; index: number } | null>(null);
  const [activeSampleIndexes, setActiveSampleIndexes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!lightboxData) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxData(null);
      if (e.key === 'ArrowLeft') {
        setLightboxData((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index - 1 + prev.urls.length) % prev.urls.length,
              }
            : null
        );
      }
      if (e.key === 'ArrowRight') {
        setLightboxData((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index + 1) % prev.urls.length,
              }
            : null
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxData]);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [selectedCommissionPackageId, setSelectedCommissionPackageId] = useState<string | null>(null);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleReplyReview = async (review: CreatorReviewDto) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const targetId = review.commissionId || review.id;
      await commissionService.replyReview(targetId, replyText.trim());
      setReviews((current) =>
        current.map((r) => (r.id === review.id ? { ...r, reviewerReply: replyText.trim() } : r))
      );
      setReplyingReviewId(null);
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Không thể gửi phản hồi đánh giá. Vui lòng thử lại.');
    } finally {
      setReplySubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      marketplaceService.getCreatorById(id),
      marketplaceService.getArtworks(),
      creatorRateCardService.get(id),
      marketplaceService.getCreatorReviews(id),
      creatorProfileService.getTerms(id).catch(() => null),
    ]).then(([nextProfile, allArtworks, nextRates, nextReviews, nextTerms]) => {
      if (!active) return;
      setProfile(nextProfile);
      setArtworks(allArtworks.filter((artwork) => artwork.creatorProfileId === id));
      setRates(nextRates);
      setReviews(nextReviews);
      setTerms(nextTerms);
    }).catch(() => { if (active) setProfile(null); })
      .finally(() => { if (active) setLoadedId(id); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!authenticated || !currentUserId || currentUserId === profile?.userId) {
      return;
    }
    let active = true;
    marketplaceService.getCreatorFollowStatus(id).then((value) => { if (active) setFollowing(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [authenticated, currentUserId, id, profile?.userId]);

  const toggleFollow = async () => {
    if (!profile || busy || !authenticated || currentUserId === profile.userId) return;
    setBusy(true);
    try {
      const result = following ? await marketplaceService.unfollowCreator(id) : await marketplaceService.followCreator(id);
      setFollowing(result.following);
      setProfile((current) => current ? { ...current, followerCount: Math.max(0, current.followerCount + (result.following ? 1 : -1)) } : current);
    } finally {
      setBusy(false);
    }
  };

  if (loadedId !== id) return <main className="min-h-[70vh] bg-[#1F2335] p-12 text-center text-[#C7C5CF]">Đang tải hồ sơ nghệ sĩ…</main>;
  if (!profile) return <main className="min-h-[70vh] bg-[#1F2335] p-12 text-center text-[#C7C5CF]">Không tìm thấy hồ sơ nghệ sĩ.</main>;

  const isOwnProfile = currentUserId === profile.userId;
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'portfolio', label: `Portfolio · ${artworks.length}` },
    { id: 'rates', label: `Commission · ${rates.length}` },
    { id: 'reviews', label: `Đánh giá · ${reviews.length}` },
  ];

  return (
    <ProfileLayout name={profile.displayName} bannerUrl={profile.bannerUrl} sidebar={<div>
      <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Creator profile</p>
      <h1 className="mt-2 break-words font-h1 text-3xl font-bold text-white">{profile.displayName}</h1>
      <p className="mt-2 text-sm text-[#C7C5CF]">{profile.headline || 'Digital artist'}</p>
      <div className="mt-5 flex items-center justify-between text-sm"><span>{profile.followerCount} người theo dõi</span><span>★ {profile.ratingAverage.toFixed(1)}</span></div>
      {isOwnProfile ? <Link href="/creator/profile/edit" className="mt-5 inline-flex w-full justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white">Chỉnh sửa hồ sơ</Link> : authenticated ? <button type="button" disabled={busy} aria-pressed={following} onClick={() => void toggleFollow()} className="mt-5 w-full rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-semibold text-[#1F2335] disabled:opacity-50">{busy ? 'Đang cập nhật…' : following ? 'Đang theo dõi' : 'Theo dõi'}</button> : <Link href="/login" className="mt-5 inline-flex w-full justify-center rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-semibold text-[#1F2335]">Đăng nhập để theo dõi</Link>}
      {profile.bio && <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#C7C5CF]">{profile.bio}</p>}
      {profile.specialties && <p className="mt-4 text-xs text-[#919099]">{profile.specialties}</p>}
    </div>}>
      <ProfileTabs tabs={tabs} value={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'portfolio' && (artworks.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{artworks.map((artwork) => <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.03]"><div className="relative aspect-[4/5]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-cover transition group-hover:scale-[1.02]" /></div><p className="truncate p-3 text-sm text-white">{artwork.title}</p></Link>)}</div> : <EmptyState>Chưa có tác phẩm được đăng.</EmptyState>)}
        {tab === 'rates' && (
          rates.length ? (
            <div className="space-y-4">
              {rates.map((rate) => {
                const orderCount = rate.orderCount ?? 0;
                const sampleList = rate.sampleUrls ?? [];
                const hasSamples = sampleList.length > 0;
                const currentIndex = activeSampleIndexes[rate.id] ?? 0;
                const safeIndex = hasSamples ? currentIndex % sampleList.length : 0;
                const currentImage = hasSamples ? sampleList[safeIndex] : null;
                const slot = getPackageSlotInfo(rate);
                const milestones = [...(rate.milestones ?? [])].sort((a, b) => a.sequence - b.sequence);

                const handlePrevSample = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setActiveSampleIndexes((prev) => ({
                    ...prev,
                    [rate.id]: (safeIndex - 1 + sampleList.length) % sampleList.length,
                  }));
                };

                const handleNextSample = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setActiveSampleIndexes((prev) => ({
                    ...prev,
                    [rate.id]: (safeIndex + 1) % sampleList.length,
                  }));
                };

                return (
                  <article
                    key={rate.id}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141724]/90 transition hover:border-[#A7ACD9]/45"
                  >
                    <div className={hasSamples ? 'grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]' : 'block'}>
                      {hasSamples && currentImage && (
                        <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[190px] w-full bg-[#10121d] overflow-hidden select-none border-b md:border-b-0 md:border-r border-white/10">
                          <Image
                            src={currentImage}
                            alt={`${rate.name} - Mẫu ${safeIndex + 1}`}
                            fill
                            unoptimized
                            className="object-cover transition duration-300 group-hover:scale-[1.03] cursor-pointer"
                            onClick={() => setLightboxData({ urls: sampleList, index: safeIndex })}
                          />
                          {sampleList.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={handlePrevSample}
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 opacity-80 group-hover:opacity-100 transition z-10"
                                title="Xem ảnh mẫu trước"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleNextSample}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 opacity-80 group-hover:opacity-100 transition z-10"
                                title="Xem ảnh mẫu tiếp theo"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-medium tabular-nums text-white/90 border border-white/10 pointer-events-none z-10">
                                {safeIndex + 1}/{sampleList.length}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col justify-between p-5 sm:p-6 gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-h1 text-base sm:text-lg font-bold text-white leading-snug">
                                  {rate.name}
                                </h3>
                                {rate.categoryName && (
                                  <span className="inline-flex items-center rounded-full border border-[#A7ACD9]/35 bg-[#A7ACD9]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#C5C9F8]">
                                    {rate.categoryName}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                                    !slot.isLimited
                                      ? 'border-sky-400/25 bg-sky-500/10 text-sky-200'
                                      : slot.isFull
                                        ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                                        : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                                  }`}
                                >
                                  {slot.label}
                                </span>
                                {orderCount > 0 && (
                                  <span className="text-[11px] font-medium tabular-nums text-slate-400">
                                    • Đã có {orderCount} lượt đặt vẽ gói này
                                  </span>
                                )}
                              </div>

                              {rate.description ? (
                                <p className="max-w-[68ch] text-xs sm:text-[13px] text-[#C7C5CF] leading-relaxed whitespace-pre-line">
                                  {rate.description}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Không có mô tả chi tiết.</p>
                              )}
                            </div>

                            <div className="shrink-0 sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between gap-1">
                              <span className="font-h1 text-xl font-bold tabular-nums text-emerald-300">
                                {new Intl.NumberFormat('vi-VN').format(rate.price)} ₫
                              </span>
                              <span className="text-[11px] tabular-nums text-slate-400">
                                Sửa thêm: {new Intl.NumberFormat('vi-VN').format(rate.extraRevisionPrice ?? 0)} ₫/lần
                              </span>
                            </div>
                          </div>

                          {milestones.length > 0 && (
                            <div className="pt-3 border-t border-white/10">
                              <div className={`grid grid-cols-1 divide-y divide-white/10 sm:divide-y-0 sm:divide-x ${
                                milestones.length === 2
                                  ? 'sm:grid-cols-2'
                                  : milestones.length >= 3
                                    ? 'sm:grid-cols-3'
                                    : ''
                              }`}>
                                {milestones.map((m) => (
                                  <div
                                    key={m.sequence}
                                    className="flex flex-col justify-between gap-1.5 py-2 first:pt-0 last:pb-0 sm:py-0 sm:px-3.5 sm:first:pl-0 sm:last:pr-0"
                                  >
                                    <div className="text-xs leading-snug">
                                      <span className="font-semibold text-[#C5C9F8] tabular-nums">
                                        Mốc {m.sequence}
                                      </span>
                                      <span className="text-slate-500"> · </span>
                                      <span className="font-medium text-white">{m.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] tabular-nums text-slate-300">
                                      <span className="font-semibold text-slate-200">
                                        {new Intl.NumberFormat('vi-VN').format(m.price)} ₫
                                      </span>
                                      <span className="text-slate-500">·</span>
                                      <span className="text-slate-400">
                                        {m.maxRevisions ?? rate.maxRevisions ?? 3} lần sửa
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/5">
                          {isOwnProfile ? (
                            <Link
                              href="/creator/services"
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition"
                            >
                              Chỉnh sửa gói
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled={slot.isFull}
                              onClick={() => {
                                setSelectedCommissionPackageId(rate.id);
                                setShowCommissionModal(true);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A7ACD9] px-5 py-2.5 text-xs font-bold text-[#1F2335] hover:bg-[#b8bde4] transition disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {slot.isFull ? 'Gói đã hết slot' : 'Đặt vẽ gói này'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState>Creator chưa đăng gói commission.</EmptyState>
          )
        )}
        {tab === 'terms' && (
          <div className="rounded-2xl border border-white/10 bg-[#141724]/90 p-5 sm:p-6 space-y-4">
            <CreatorTermsOverview terms={terms} creatorName={profile.displayName} />
            {isOwnProfile && (
              <div className="flex justify-end border-t border-white/10 pt-3">
                <Link href="/creator/terms" className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition">
                  Chỉnh sửa điều khoản &amp; bản quyền
                </Link>
              </div>
            )}
          </div>
        )}
        {tab === 'reviews' && (() => {
          if (!reviews.length) return <EmptyState>Chưa có đánh giá nào cho Creator này.</EmptyState>;

          const totalReviewCount = reviews.length;
          const starCounts: Record<number, number> = {
            5: reviews.filter((r) => r.rating === 5).length,
            4: reviews.filter((r) => r.rating === 4).length,
            3: reviews.filter((r) => r.rating === 3).length,
            2: reviews.filter((r) => r.rating === 2).length,
            1: reviews.filter((r) => r.rating === 1).length,
          };
          const countWithReply = reviews.filter((r) => Boolean(r.reviewerReply)).length;

          const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewCount).toFixed(1);

          // Extract unique packages
          const availablePackages = Array.from(
            new Set(
              reviews
                .map((r) => r.commissionTitle)
                .filter((title): title is string => Boolean(title && title.trim()))
            )
          );

          const packageCounts: Record<string, number> = {};
          availablePackages.forEach((pkg) => {
            packageCounts[pkg] = reviews.filter((r) => r.commissionTitle === pkg).length;
          });

          // Filtering by Star and Package
          const filtered = reviews.filter((r) => {
            if (reviewFilter !== 'all') {
              if (reviewFilter === 'with-reply') {
                if (!r.reviewerReply) return false;
              } else if (r.rating !== Number(reviewFilter)) {
                return false;
              }
            }
            if (packageFilter !== 'all') {
              if (r.commissionTitle !== packageFilter) return false;
            }
            return true;
          });

          // Sorting
          const sorted = [...filtered].sort((a, b) => {
            if (reviewSort === 'newest') {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (reviewSort === 'oldest') {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (reviewSort === 'rating-desc') {
              return b.rating - a.rating;
            }
            if (reviewSort === 'rating-asc') {
              return a.rating - b.rating;
            }
            return 0;
          });

          // Pagination
          const totalPages = Math.ceil(sorted.length / REVIEWS_PER_PAGE) || 1;
          const safePage = Math.min(Math.max(reviewPage, 1), totalPages);
          const startIndex = (safePage - 1) * REVIEWS_PER_PAGE;
          const paginatedReviews = sorted.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

          const handleFilterChange = (filterKey: ReviewFilter) => {
            setReviewFilter(filterKey);
            setReviewPage(1);
          };

          const handleSortChange = (sortKey: ReviewSort) => {
            setReviewSort(sortKey);
            setReviewPage(1);
          };

          const handlePackageChange = (pkg: string) => {
            setPackageFilter(pkg);
            setReviewPage(1);
          };

          return (
            <div className="space-y-4">
              {/* COMPREHENSIVE RATING BREAKDOWN & DASHBOARD */}
              <div className="rounded-2xl border border-white/10 bg-[#161928]/80 p-5 sm:p-6 space-y-5 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Overall Score & Stars */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 sm:border-r border-white/10">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">{avgRating}</span>
                    <div className="flex items-center gap-1 text-amber-400 my-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          className={s <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Tổng số <strong className="text-white font-bold">{totalReviewCount}</strong> đánh giá
                    </p>
                  </div>

                  {/* Middle Column: Interactive Star Distribution Bars (E-Commerce style) */}
                  <div className="md:col-span-8 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((starLevel) => {
                      const count = starCounts[starLevel] || 0;
                      const percent = totalReviewCount > 0 ? Math.round((count / totalReviewCount) * 100) : 0;
                      const isSelected = reviewFilter === String(starLevel);

                      return (
                        <button
                          key={starLevel}
                          type="button"
                          onClick={() => handleFilterChange(isSelected ? 'all' : (String(starLevel) as ReviewFilter))}
                          className={`w-full flex items-center gap-3 text-xs py-1 px-2 rounded-lg transition-colors group ${
                            isSelected ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="w-12 font-semibold text-right flex items-center justify-end gap-1 shrink-0">
                            <span>{starLevel}</span>
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                          </span>

                          <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden relative">
                            <div
                              className="h-full rounded-full bg-amber-400 transition-all duration-500 ease-out"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <span className="w-14 text-left font-mono text-[11px] text-slate-400 group-hover:text-slate-200 shrink-0">
                            {count} ({percent}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter and Sorting Controls Toolbar */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: 'all', label: `Tất cả (${totalReviewCount})` },
                      { key: '5', label: `5★ (${starCounts[5]})` },
                      { key: '4', label: `4★ (${starCounts[4]})` },
                      { key: '3', label: `3★ (${starCounts[3]})` },
                      { key: '2', label: `2★ (${starCounts[2]})` },
                      { key: '1', label: `1★ (${starCounts[1]})` },
                      { key: 'with-reply', label: `💬 Phản hồi (${countWithReply})` },
                    ].map(({ key, label }) => {
                      const isActive = reviewFilter === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleFilterChange(key as ReviewFilter)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isActive
                              ? 'bg-[#A7ACD9] text-[#1F2335] border-[#A7ACD9] shadow-sm font-bold'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sorting Dropdown */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ArrowUpDown size={12} className="text-[#A7ACD9]" /> Sắp xếp:
                    </span>
                    <select
                      value={reviewSort}
                      onChange={(e) => handleSortChange(e.target.value as ReviewSort)}
                      className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#A7ACD9] cursor-pointer"
                    >
                      <option value="newest" className="bg-[#161928] text-white">Mới nhất</option>
                      <option value="oldest" className="bg-[#161928] text-white">Cũ nhất</option>
                      <option value="rating-desc" className="bg-[#161928] text-white">Đánh giá cao nhất</option>
                      <option value="rating-asc" className="bg-[#161928] text-white">Đánh giá thấp nhất</option>
                    </select>
                  </div>
                </div>

                {/* Package Filter Row (Lọc theo gói commission) */}
                {availablePackages.length > 0 && (
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
                      <Package size={13} className="text-[#A7ACD9]" />
                      Gói:
                    </span>

                    <button
                      type="button"
                      onClick={() => handlePackageChange('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        packageFilter === 'all'
                          ? 'bg-[#A7ACD9] text-[#1F2335] border-[#A7ACD9] shadow-sm font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      Tất cả các gói (${totalReviewCount})
                    </button>

                    {availablePackages.map((pkg) => {
                      const isActive = packageFilter === pkg;
                      const count = packageCounts[pkg] || 0;
                      return (
                        <button
                          key={pkg}
                          type="button"
                          onClick={() => handlePackageChange(pkg)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
                            isActive
                              ? 'bg-[#A7ACD9] text-[#1F2335] border-[#A7ACD9] shadow-sm font-bold'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span>{pkg}</span>
                          <span className={isActive ? 'text-[#1F2335]/80' : 'text-slate-400 font-normal'}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* REVIEW CARDS LIST */}
              {paginatedReviews.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-white/10 bg-white/[0.02] text-xs text-slate-400">
                  Không tìm thấy đánh giá nào cho tiêu chí đã chọn.
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedReviews.map((review) => {
                    const { userComment, tags } = parseReviewComment(review.comment);
                    const reviewerName = review.reviewerName || 'Khách hàng';
                    const packageName = review.commissionTitle || 'Đơn vẽ theo yêu cầu';
                    const timestamp = formatTimestamp(review.createdAt);

                    return (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-white/10 bg-[#161928]/60 p-4 sm:p-5 space-y-3 transition-colors hover:border-white/20"
                      >
                        {/* Header Row: Reviewer info, Stars, Timestamp, Package badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#A7ACD9]/20 text-[#A7ACD9] flex items-center justify-center font-bold text-xs uppercase border border-[#A7ACD9]/30 shrink-0">
                              {reviewerName.charAt(0) || 'K'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">{reviewerName}</span>
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      size={12}
                                      className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#C5C9F8] font-medium">
                                  <Package size={11} className="text-[#A7ACD9]" />
                                  Gói: <strong className="text-white">{packageName}</strong>
                                </span>
                                {timestamp && (
                                  <span className="inline-flex items-center gap-1 text-slate-400">
                                    <Clock size={11} className="text-slate-500" />
                                    {timestamp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Highlight Tags Badges */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#A7ACD9]/15 border border-[#A7ACD9]/25 text-[11px] font-medium text-[#C5C9F8]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* User Comment */}
                        {userComment && (
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/25 p-3 rounded-xl border border-white/5">
                            &ldquo;{userComment}&rdquo;
                          </p>
                        )}

                        {/* Creator Response */}
                        {review.reviewerReply ? (
                          <div className="mt-2 rounded-xl bg-white/[0.02] border-l-2 border-[#A7ACD9] pl-3.5 py-2.5 pr-3 space-y-1">
                            <p className="text-[11px] font-bold text-[#A7ACD9]">Phản hồi từ Creator:</p>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {review.reviewerReply}
                            </p>
                          </div>
                        ) : isOwnProfile && (
                          replyingReviewId === review.id ? (
                            <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhập nội dung phản hồi cho đánh giá này..."
                                rows={2}
                                className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-[#8A8FA9] focus:outline-none focus:border-[#A7ACD9]"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setReplyingReviewId(null); setReplyText(''); }}
                                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-[#8A8FA9] hover:text-white"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  disabled={replySubmitting || !replyText.trim()}
                                  onClick={() => void handleReplyReview(review)}
                                  className="rounded-lg bg-[#A7ACD9] px-3.5 py-1 text-xs font-semibold text-[#1F2335] disabled:opacity-50"
                                >
                                  {replySubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setReplyingReviewId(review.id); setReplyText(''); }}
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#A7ACD9] hover:underline"
                            >
                              💬 Phản hồi đánh giá
                            </button>
                          )
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION CONTROLS (Active when multiple reviews) */}
              {totalPages > 1 && (
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <p>
                    Hiển thị <strong className="text-white">{startIndex + 1}</strong> - <strong className="text-white">{Math.min(startIndex + REVIEWS_PER_PAGE, sorted.length)}</strong> trong tổng số <strong className="text-white">{sorted.length}</strong> đánh giá
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      // show window of pages if totalPages is large
                      if (totalPages > 7) {
                        if (p !== 1 && p !== totalPages && Math.abs(p - safePage) > 2) {
                          if (p === 2 || p === totalPages - 1) {
                            return <span key={p} className="px-1 text-slate-600">...</span>;
                          }
                          return null;
                        }
                      }
                      const isCur = p === safePage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setReviewPage(p)}
                          className={`w-8 h-8 rounded-xl font-bold transition flex items-center justify-center ${
                            isCur
                              ? 'bg-[#A7ACD9] text-[#1F2335] shadow-sm'
                              : 'border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setReviewPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
      {/* Lightbox for Sample Artwork Full View with Arrow Navigation */}
      {lightboxData && lightboxData.urls.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-xs text-white">
              <span className="font-mono text-slate-300 font-semibold bg-white/10 px-3 py-1 rounded-full">
                Ảnh {lightboxData.index + 1} / {lightboxData.urls.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition flex items-center gap-1.5"
              >
                <X className="h-4 w-4" /> Đóng
              </button>
            </div>

            {/* Main Stage with Left / Right Arrows */}
            <div className="relative w-full h-[76vh] flex items-center justify-center">
              {lightboxData.urls.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index - 1 + prev.urls.length) % prev.urls.length,
                          }
                        : null
                    )
                  }
                  className="absolute left-2 z-20 h-12 w-12 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition hover:scale-110 shadow-2xl"
                  title="Ảnh trước (Phím ←)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <Image
                src={lightboxData.urls[lightboxData.index]}
                alt={`Sample Artwork ${lightboxData.index + 1}`}
                fill
                unoptimized
                className="object-contain rounded-2xl shadow-2xl select-none"
              />

              {lightboxData.urls.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.urls.length,
                          }
                        : null
                    )
                  }
                  className="absolute right-2 z-20 h-12 w-12 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition hover:scale-110 shadow-2xl"
                  title="Ảnh tiếp theo (Phím →)"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Create Commission Modal */}
      {showCommissionModal && profile && (
        <CreateCommissionModal
          creatorId={profile.id}
          creatorName={profile.displayName}
          initialPackageId={selectedCommissionPackageId || undefined}
          initialTerms={terms}
          onClose={() => {
            setShowCommissionModal(false);
            setSelectedCommissionPackageId(null);
          }}
        />
      )}
    </ProfileLayout>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-[#919099]">{children}</p>;
}
