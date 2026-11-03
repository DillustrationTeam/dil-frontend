'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';
import { useAuthStore } from '@/store/use-auth-store';
import { creatorRateCardService, type RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import type { ArtworkDto, CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import { marketplaceService, type CreatorReviewDto } from '@/features/marketplace/services/marketplace.service';
import { commissionService } from '@/services/commission.service';
import { ProfileLayout, ProfileTabs } from './profile-layout';

type Tab = 'portfolio' | 'rates' | 'reviews';

export function CreatorProfileScreen({ id }: { id: string }) {

  const currentUserId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [profile, setProfile] = useState<CreatorProfileDto | null>(null);
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [rates, setRates] = useState<RateCardPackage[]>([]);
  const [reviews, setReviews] = useState<CreatorReviewDto[]>([]);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('portfolio');
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
    ]).then(([nextProfile, allArtworks, nextRates, nextReviews]) => {
      if (!active) return;
      setProfile(nextProfile);
      setArtworks(allArtworks.filter((artwork) => artwork.creatorProfileId === id));
      setRates(nextRates);
      setReviews(nextReviews);
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {rates.map((rate) => {
                const orderCount = rate.orderCount ?? 0;
                const sampleList = rate.sampleUrls ?? [];
                const currentIndex = activeSampleIndexes[rate.id] ?? 0;
                const safeIndex = sampleList.length > 0 ? currentIndex % sampleList.length : 0;
                const currentImage = sampleList[safeIndex];

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
                    className="flex flex-col rounded-2xl border border-white/10 bg-[#141724]/85 backdrop-blur-md overflow-hidden hover:border-[#A7ACD9]/50 hover:shadow-xl transition group"
                  >
                    {/* Top Media / Sample Cover with Arrow Controls */}
                    <div className="relative aspect-[16/10] w-full bg-[#10121d] overflow-hidden select-none">
                      {currentImage ? (
                        <Image
                          src={currentImage}
                          alt={`${rate.name} - Sample ${safeIndex + 1}`}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                          onClick={() => setLightboxData({ urls: sampleList, index: safeIndex })}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1b1f33] to-[#121422] text-slate-500">
                          <Package className="h-8 w-8 text-[#A7ACD9]/30 mb-1" />
                          <span className="text-[11px] text-slate-400">Chưa gắn ảnh mẫu</span>
                        </div>
                      )}

                      {/* Order Count Badge Overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-3 py-1 text-[11px] font-semibold border border-white/10 text-white shadow pointer-events-none z-10">
                        {orderCount > 0 ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-mono text-emerald-300 font-bold">{orderCount}</span> đơn đã đặt
                          </>
                        ) : (
                          <span className="text-slate-300 font-medium">Gói mới</span>
                        )}
                      </div>

                      {/* Arrow Navigation on Card Cover */}
                      {sampleList.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevSample}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-75 group-hover:opacity-100 transition shadow hover:scale-110 z-10"
                            title="Xem ảnh mẫu trước"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={handleNextSample}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-75 group-hover:opacity-100 transition shadow hover:scale-110 z-10"
                            title="Xem ảnh mẫu tiếp theo"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Image Counter Indicator */}
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono text-white/90 border border-white/10 shadow pointer-events-none z-10">
                            <span>
                              {safeIndex + 1} / {sampleList.length}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        {/* Title & Price */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-white group-hover:text-[#A7ACD9] transition line-clamp-1">
                            {rate.name}
                          </h3>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold font-mono text-emerald-400">
                              {new Intl.NumberFormat('vi-VN').format(rate.price)} ₫
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {rate.description ? (
                          <p className="text-xs text-[#C7C5CF] line-clamp-2 leading-relaxed">
                            {rate.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Không có mô tả chi tiết.</p>
                        )}
                      </div>

                      {/* Footer Specs & Action CTA */}
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{rate.milestones?.length || 1} cột mốc thanh toán</span>
                          <span>{rate.maxRevisions ?? 3} lần sửa free</span>
                        </div>

                        {isOwnProfile ? (
                          <Link
                            href="/creator/services"
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
                          >
                            Chỉnh sửa gói
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCommissionPackageId(rate.id);
                              setShowCommissionModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#A7ACD9] py-2.5 text-xs font-bold text-[#1F2335] shadow hover:bg-[#b8bde4] hover:shadow-lg transition"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Đặt vẽ gói này
                          </button>
                        )}
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
        {tab === 'reviews' && (reviews.length ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-white/10 p-4 space-y-2">
                <p className="text-amber-300">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                {review.comment && <p className="text-sm text-[#C7C5CF]">{review.comment}</p>}
                {review.reviewerReply ? (
                  <p className="mt-3 whitespace-pre-wrap border-l-2 border-[#A7ACD9] pl-3 text-sm text-[#C7C5CF]">
                    <span className="font-semibold text-[#A7ACD9]">Phản hồi của Creator: </span>{review.reviewerReply}
                  </p>
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
            ))}
          </div>
        ) : <EmptyState>Chưa có đánh giá.</EmptyState>)}
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
