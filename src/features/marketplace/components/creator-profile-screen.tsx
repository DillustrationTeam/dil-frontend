'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { creatorRateCardService, type RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import type { ArtworkDto, CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import { marketplaceService, type CreatorReviewDto } from '@/features/marketplace/services/marketplace.service';
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
        {tab === 'rates' && (rates.length ? <div className="space-y-3">{rates.map((rate) => <article key={rate.id} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-3"><h2 className="font-semibold text-white">{rate.name}</h2><span className="text-[#A7ACD9]">{new Intl.NumberFormat('vi-VN').format(rate.price)} VND</span></div>{rate.description && <p className="mt-2 text-sm text-[#C7C5CF]">{rate.description}</p>}</article>)}</div> : <EmptyState>Creator chưa đăng gói commission.</EmptyState>)}
        {tab === 'reviews' && (reviews.length ? <div className="space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-xl border border-white/10 p-4"><p className="text-amber-300">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>{review.comment && <p className="mt-2 text-sm text-[#C7C5CF]">{review.comment}</p>}{review.reviewerReply && <p className="mt-3 whitespace-pre-wrap border-l-2 border-[#A7ACD9] pl-3 text-sm text-[#C7C5CF]"><span className="font-semibold text-[#A7ACD9]">Phản hồi của Creator: </span>{review.reviewerReply}</p>}</article>)}</div> : <EmptyState>Chưa có đánh giá.</EmptyState>)}
      </div>
    </ProfileLayout>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-[#919099]">{children}</p>;
}