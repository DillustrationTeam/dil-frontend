'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Globe, MapPin, Package, Star, UserCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { ArtworkDto, CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';
import { creatorRateCardService, RateCardPackage } from '@/features/creator-studio/services/creator-rate-card.service';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';
import { ProfileLayout, ProfileTabs } from './profile-layout';
import { ArtworkDetailModal } from './artwork-detail';
import { CreatorReviewDto, marketplaceService, RelatedCreatorDto } from '../services/marketplace.service';

type ProfileTab = 'portfolio' | 'rates' | 'reviews';
const topicsOf = (value?: string | null) => (value ?? '').split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export function CreatorProfileScreen({ id }: { id: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [profile, setProfile] = useState<CreatorProfileDto | null>(null);
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [rateCards, setRateCards] = useState<RateCardPackage[]>([]);
  const [reviews, setReviews] = useState<CreatorReviewDto[]>([]);
  const [creators, setCreators] = useState<RelatedCreatorDto[]>([]);
  const [tab, setTab] = useState<ProfileTab>('rates');
  const [followed, setFollowed] = useState(false);
  const [followingBusy, setFollowingBusy] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setFollowed(false);
      try {
        const nextProfile = await marketplaceService.getCreatorById(id);
        if (!active) return;
        setProfile(nextProfile);
        const [artworkResult, rateResult, reviewResult, creatorResult] = await Promise.allSettled([
          marketplaceService.getArtworks(),
          creatorRateCardService.get(id),
          marketplaceService.getCreatorReviews(id),
          marketplaceService.getCreators(),
        ]);
        if (!active) return;
        if ([artworkResult, rateResult, reviewResult, creatorResult].some((result) => result.status === 'rejected')) {
          toast.error('Một phần hồ sơ chưa tải được. Vui lòng tải lại trang để xem đầy đủ.');
        }
        setArtworks(artworkResult.status === 'fulfilled' ? artworkResult.value.filter((artwork) => artwork.creatorProfileId === id) : []);
        setRateCards(rateResult.status === 'fulfilled' ? rateResult.value : []);
        setReviews(reviewResult.status === 'fulfilled' ? reviewResult.value : []);
        if (reviewResult.status === 'fulfilled') {
          const ratings = reviewResult.value;
          setProfile((current) => current ? { ...current, ratingCount: ratings.length, ratingAverage: ratings.length ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length : 0 } : current);
        }
        setCreators(creatorResult.status === 'fulfilled' ? creatorResult.value : []);
        if (isAuthenticated) {
          const status = await marketplaceService.getCreatorFollowStatus(id).catch(() => false);
          if (active) setFollowed(status);
        } else {
          setFollowed(false);
        }
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [id, isAuthenticated, currentUserId]);

  const relatedCreators = useMemo(() => {
    if (!profile) return [];
    const topics = topicsOf(profile.specialties).map((topic) => topic.toLocaleLowerCase());
    return creators.filter((creator) => creator.id !== profile.id)
      .map((creator) => ({ creator, overlap: topicsOf(creator.specialties).filter((topic) => topics.includes(topic.toLocaleLowerCase())).length }))
      .filter((item) => item.overlap > 0)
      .sort((left, right) => right.overlap - left.overlap || right.creator.ratingCount - left.creator.ratingCount)
      .slice(0, 4).map((item) => item.creator);
  }, [creators, profile]);

  const toggleFollow = async () => {
    if (!profile || followingBusy) return;
    setFollowingBusy(true);
    try {
      const result = followed ? await marketplaceService.unfollowCreator(profile.id) : await marketplaceService.followCreator(profile.id);
      setFollowed(result.following);
      setProfile((current) => current ? { ...current, followerCount: Math.max(0, current.followerCount + (result.following ? 1 : -1)) } : current);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Không thể cập nhật theo dõi.');
    } finally {
      setFollowingBusy(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-[#1F2335] px-5 py-20 text-center text-[#C7C5CF]">Đang tải hồ sơ nghệ sĩ...</main>;
  if (!profile) return <main className="min-h-screen bg-[#1F2335] px-5 py-20 text-center text-[#C7C5CF]">Không tìm thấy hồ sơ nghệ sĩ.</main>;

  const ownProfile = currentUserId === profile.userId;
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'rates', label: 'Commission' },
    { id: 'portfolio', label: `Portfolio · ${artworks.length}` },
    { id: 'reviews', label: `Đánh giá · ${profile.ratingCount}` },
  ];
  const cover = profile.bannerUrl || artworks[0]?.imageUrl;
  const canRequest = profile.isAcceptingOrders && profile.availableSlots > 0;

  return <>
    <ProfileLayout name={profile.displayName} bannerUrl={cover} sidebar={<>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Creator profile</p>
      <h1 className="break-words font-h1 text-3xl font-semibold tracking-tight text-white">{profile.displayName}</h1>
      <p className="mt-2 text-sm text-[#919099]">{profile.headline || 'Digital artist'}</p>
      <div className="mt-6 flex gap-2">
        {ownProfile ? <Link href="/creator-setup" className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold hover:bg-white/10">Chỉnh sửa hồ sơ</Link> : isAuthenticated ? <button type="button" disabled={followingBusy} aria-pressed={followed} onClick={toggleFollow} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50 ${followed ? 'border border-[#A7ACD9]/40 bg-[#A7ACD9]/10 text-white' : 'bg-[#A7ACD9] text-[#1F2335]'}`}>{followed ? <UserCheck size={16} /> : <UserPlus size={16} />}{followed ? 'Đang theo dõi' : 'Theo dõi'}</button> : <Link href="/login" className="flex-1 rounded-full bg-[#A7ACD9] px-4 py-3 text-center text-sm font-semibold text-[#1F2335]">Đăng nhập để theo dõi</Link>}
        {profile.websiteUrl ? <a href={profile.websiteUrl} target="_blank" rel="noreferrer" aria-label="Website nghệ sĩ" className="rounded-full border border-white/10 p-3 hover:bg-white/5"><Globe size={18} /></a> : null}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-full border border-white/10 px-4 py-3 text-xs"><span><strong className="text-white">{profile.followerCount}</strong> người theo dõi</span><Link href="/explore" className="text-[#A7ACD9] hover:underline">Khám phá</Link></div>
      {profile.location ? <p className="mt-7 flex items-center gap-2 text-sm text-[#919099]"><MapPin size={15} />{profile.location}</p> : null}
      {profile.bio ? <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#C7C5CF]">{profile.bio}</p> : null}
      {topicsOf(profile.specialties).length ? <div className="mt-6 flex flex-wrap gap-2">{topicsOf(profile.specialties).map((topic) => <span key={topic} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#C7C5CF]">{topic}</span>)}</div> : null}
      <details className="mt-8 border-t border-white/10 pt-5 text-sm"><summary className="cursor-pointer font-medium text-white">Về nghệ sĩ</summary><p className="mt-3 leading-6 text-[#919099]">Tham gia từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')} · {profile.ratingCount} đánh giá từ khách hàng.</p></details>
    </>}>
      <div className={`mb-7 flex items-center gap-3 rounded-full border px-5 py-4 ${canRequest ? 'border-[#A7ACD9]/30 bg-[#A7ACD9]/15 text-[#DDE0FF]' : 'border-white/10 bg-white/5 text-[#C7C5CF]'}`}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#A7ACD9]/20"><Check size={16} /></span>
        <p className="text-sm font-medium sm:text-lg">{canRequest ? 'Sẵn sàng nhận dự án mới' : 'Tạm ngưng nhận dự án mới'}</p>
        {canRequest ? <span className="ml-auto shrink-0 text-xs text-[#A7ACD9]">{profile.availableSlots} chỗ trống</span> : null}
      </div>
      <ProfileTabs tabs={tabs} value={tab} onChange={setTab} />
      <div className="mt-4 flex flex-wrap gap-3 text-xs"><button type="button" onClick={() => setTab('reviews')} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 hover:bg-white/10"><Star size={14} className="fill-[#A7ACD9] text-[#A7ACD9]" /><strong>{profile.ratingCount ? profile.ratingAverage.toFixed(1) : 'Chưa có đánh giá'}</strong>{profile.ratingCount ? <span className="text-[#919099]">({profile.ratingCount} đánh giá)</span> : null}<ArrowUpRight size={12} /></button></div>
      <div id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-tab-${tab}`} tabIndex={0} className="mt-7 focus-visible:outline-[#A7ACD9]">
        {tab === 'rates' ? rateCards.length ? <div className="space-y-5">{rateCards.map((rate, index) => <article key={rate.id} className="glass-container overflow-hidden rounded-[32px] p-3 sm:p-4"><div className="grid overflow-hidden rounded-2xl lg:grid-cols-[.9fr_1fr]">
          <div className="relative aspect-[4/3] bg-[#171a2a] lg:aspect-auto lg:min-h-72">{artworks.length ? <Image src={artworks[index % artworks.length].imageUrl} alt={`Minh họa cho ${rate.name}`} fill unoptimized sizes="(max-width:1024px) 100vw, 40vw" className="object-contain" /> : <div className="flex h-full min-h-52 items-center justify-center text-[#A7ACD9]/40"><Package size={48} /></div>}<span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#1F2335]/80 px-3 py-1.5 text-[10px] text-[#DDE0FF] backdrop-blur">COMMISSION</span></div>
          <div className="flex flex-col justify-center p-5 sm:p-7"><h2 className="font-h1 text-xl font-semibold text-white sm:text-2xl">{rate.name}</h2><p className="mt-2 text-xl text-[#A7ACD9]">Từ {money(rate.price)}</p>{rate.description ? <p className="mt-4 text-sm leading-6 text-[#C7C5CF]">{rate.description}</p> : null}
            {rate.milestones.length ? <ol className="mt-5 space-y-2">{rate.milestones.map((milestone) => <li key={`${rate.id}-${milestone.sequence}`} className="flex items-center justify-between gap-3 text-xs text-[#C7C5CF]"><span className="flex items-center gap-2"><Check size={13} className="shrink-0 text-[#A7ACD9]" />{milestone.title}</span><span className="shrink-0 text-[#919099]">{money(milestone.price)}</span></li>)}</ol> : null}
            {ownProfile ? <Link href="/creator/rate-card" className="mt-6 rounded-full border border-white/10 px-5 py-3 text-center text-sm hover:bg-white/5">Quản lý bảng giá</Link> : <button type="button" disabled={!canRequest} onClick={() => isAuthenticated ? setCommissionOpen(true) : toast.error('Vui lòng đăng nhập để đặt tranh.')} className="mt-6 rounded-full bg-[#A7ACD9] px-5 py-3 text-sm font-semibold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-40">{canRequest ? 'Gửi yêu cầu đặt tranh' : 'Tạm ngưng nhận đơn'}</button>}
          </div>
        </div></article>)}</div> : <Empty label="Nghệ sĩ chưa công khai bảng giá." /> : null}
        {tab === 'portfolio' ? artworks.length ? <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{artworks.map((artwork) => <button key={artwork.id} type="button" onClick={() => setSelectedArtworkId(artwork.id)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] text-left"><div className="relative aspect-[4/5] bg-black/20"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized sizes="(max-width:768px) 50vw, 30vw" className="object-contain transition group-hover:scale-[1.02]" /></div><div className="p-4"><h2 className="truncate text-sm font-medium text-white">{artwork.title}</h2><p className="mt-1 text-xs text-[#919099]">{artwork.viewCount.toLocaleString('vi-VN')} lượt xem</p></div></button>)}</div> : <Empty label="Chưa có tác phẩm được đăng." /> : null}
        {tab === 'reviews' ? reviews.length ? <div className="glass-container divide-y divide-white/10 rounded-3xl px-6">{reviews.map((review) => <article key={review.id} className="py-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-white">Khách hàng · {review.reviewerUserId.slice(0, 8)}</p><div className="mt-2 flex gap-1" aria-label={`${review.rating} trên 5 sao`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-[#A7ACD9] text-[#A7ACD9]' : 'text-white/15'}`} />)}</div></div><time className="text-xs text-[#919099]">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</time></div>{review.comment ? <p className="mt-4 text-sm leading-6 text-[#C7C5CF]">{review.comment}</p> : null}</article>)}</div> : <Empty label="Chưa có đánh giá nào." /> : null}
      </div>
      {relatedCreators.length ? <section className="mt-12 border-t border-white/10 pt-7"><div className="mb-4 flex items-center justify-between"><h2 className="font-h1 text-base font-semibold text-white">Nghệ sĩ cùng chủ đề</h2><Link href="/explore" className="text-xs text-[#A7ACD9]">Khám phá thêm</Link></div><div className="grid gap-3 sm:grid-cols-2">{relatedCreators.map((creator) => <Link key={creator.id} href={`/creators/${creator.id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 p-4 hover:bg-white/5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A7ACD9]/15 text-[#A7ACD9]">{creator.displayName.charAt(0).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{creator.displayName}</span><span className="block truncate text-xs text-[#919099]">{creator.headline || 'Digital artist'}</span></span><ArrowUpRight size={16} className="ml-auto shrink-0 text-[#A7ACD9]" /></Link>)}</div></section> : null}
    </ProfileLayout>
    {selectedArtworkId ? <ArtworkDetailModal id={selectedArtworkId} onClose={() => setSelectedArtworkId(null)} /> : null}
    {commissionOpen ? <CreateCommissionModal creatorId={profile.id} creatorName={profile.displayName} onClose={() => setCommissionOpen(false)} /> : null}
  </>;
}

function Empty({ label }: { label: string }) {
  return <div className="glass-container rounded-[32px] px-6 py-16 text-center text-sm text-[#919099]"><Package className="mx-auto mb-4 h-7 w-7 text-[#A7ACD9]/60" />{label}</div>;
}
