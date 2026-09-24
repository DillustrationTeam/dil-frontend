'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Star, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import { CreatorProfileDto } from '@/features/creator-studio/types/creator-profile.types';

type ProfileTab = 'portfolio' | 'rates' | 'reviews';

export function CreatorProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<CreatorProfileDto | null>(null);
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [rateCards, setRateCards] = useState<{ name: string; price: string; detail: string }[]>([]);
  const [reviews, setReviews] = useState<{ id: string; reviewerUserId: string; rating: number; comment?: string | null; createdAt: string }[]>([]);
  const [tab, setTab] = useState<ProfileTab>('portfolio');
  const [followed, setFollowed] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const nextProfile = await marketplaceService.getCreatorById(id);
        setProfile(nextProfile);
      } catch {
        setProfile(null);
      }

      try {
        const items = await marketplaceService.getArtworks();
        setArtworks(items.filter((item) => item.creatorProfileId === id));
      } catch {
        setArtworks([]);
      }

      try {
        const services = await marketplaceService.getCreatorServices(id);
        setRateCards(services.map((service) => ({
          name: service.title,
          price: `${service.startingPrice.toLocaleString('vi-VN')}đ`,
          detail: `${service.deliveryDays} ngày · ${service.maxRevisions} chỉnh sửa`,
        })));
      } catch {
        setRateCards([]);
      }

      try {
        const nextReviews = await marketplaceService.getCreatorReviews(id);
        setReviews(nextReviews);
      } catch {
        setReviews([]);
      }
    };

    void load();
  }, [id]);
  if (!profile) return <div className="min-h-screen bg-[#1F2335] p-16 text-center text-[#C7C5CF]">Đang tải trang nghệ sĩ...</div>;
  return <main className="min-h-screen bg-[#1F2335] pb-16 text-[#E4E1E5]"><div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#7978b8] via-[#34385f] to-[#161a2c] sm:h-64">{profile.bannerUrl && <Image src={profile.bannerUrl} alt="Cover" fill unoptimized className="object-cover opacity-70" />}<div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(211,215,255,.35),transparent_25%)]" /></div><div className="mx-auto max-w-6xl px-4 sm:px-6"><section className="relative -mt-14 flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between"><div className="flex gap-5"><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border-4 border-[#1F2335] bg-[#A7ACD9] font-h1 text-4xl font-bold text-[#1F2335]">{profile.displayName.charAt(0).toUpperCase()}</div><div className="pt-14"><h1 className="font-h1 text-2xl font-bold text-white">{profile.displayName}</h1><p className="mt-1 text-sm text-[#A7ACD9]">{profile.headline || 'Independent illustrator'}</p></div></div><div className="flex gap-3"><button onClick={() => setFollowed(!followed)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${followed ? 'border border-[#A7ACD9] bg-[#A7ACD9]/15 text-white' : 'bg-[#A7ACD9] text-[#1F2335]'}`}><UserPlus className="h-4 w-4" />{followed ? 'Đang theo dõi' : 'Theo dõi'}</button><button className="rounded-2xl border border-white/15 px-4 py-3 text-[#D6D9FF]" aria-label="Nhắn tin"><MessageCircle className="h-5 w-5" /></button></div></section><section className="grid gap-8 py-8 md:grid-cols-[1fr_240px]"><div><p className="max-w-2xl text-sm leading-6 text-[#C7C5CF]">{profile.bio || 'Nghệ sĩ chia sẻ những câu chuyện qua nét vẽ và màu sắc.'}</p>{profile.specialties && <div className="mt-4 flex flex-wrap gap-2">{profile.specialties.split(',').map((item) => <span key={item} className="rounded-full bg-[#A7ACD9]/10 px-3 py-1 text-xs text-[#C7C5CF]">{item.trim()}</span>)}</div>}</div><div className="glass-container grid grid-cols-2 rounded-3xl p-4 text-center"><div><p className="font-h1 text-xl font-bold text-white">{profile.followerCount}</p><p className="text-[10px] uppercase tracking-wider text-[#919099]">Followers</p></div><div><p className="font-h1 text-xl font-bold text-white">{profile.ratingAverage.toFixed(1)} <Star className="inline h-3.5 w-3.5 fill-[#A7ACD9] text-[#A7ACD9]" /></p><p className="text-[10px] uppercase tracking-wider text-[#919099]">Đánh giá</p></div><div className="col-span-2 mt-3 border-t border-white/10 pt-3"><span className={`text-sm font-semibold ${profile.isAcceptingOrders ? 'text-[#BCE6B8]' : 'text-[#C7C5CF]'}`}>{profile.isAcceptingOrders ? '02 slot đang mở' : 'Tạm hết slot'}</span></div></div></section><div className="mb-6 flex gap-2 border-b border-white/10">{([['portfolio', 'Portfolio'], ['rates', 'Bảng giá dịch vụ'], ['reviews', 'Đánh giá']] as const).map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`border-b-2 px-4 py-3 text-sm transition ${tab === value ? 'border-[#A7ACD9] text-white' : 'border-transparent text-[#919099] hover:text-[#C7C5CF]'}`}>{label}</button>)}</div>{tab === 'portfolio' && <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{artworks.map((artwork) => <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5"><div className="relative aspect-[4/5]"><Image src={artwork.thumbnailUrl || artwork.imageUrl} alt={artwork.title} fill unoptimized className="object-cover transition group-hover:scale-105" /></div><p className="p-3 text-sm text-white">{artwork.title}</p></Link>)}{!artworks.length && <p className="col-span-full rounded-3xl bg-white/5 p-10 text-center text-sm text-[#C7C5CF]">Portfolio đang được cập nhật.</p>}</div>}{tab === 'rates' && <div className="grid gap-4 md:grid-cols-3">{rateCards.map((card) => <article key={card.name} className="glass-container rounded-3xl p-5"><p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Commission</p><h2 className="mt-3 font-h1 text-lg font-bold text-white">{card.name}</h2><p className="mt-3 font-h1 text-2xl font-bold text-[#DDE0FF]">{card.price}</p><p className="mt-2 text-sm text-[#C7C5CF]">{card.detail}</p><button className="mt-5 w-full rounded-2xl bg-white/10 py-2.5 text-sm text-white hover:bg-[#A7ACD9] hover:text-[#1F2335]">Đặt commission</button></article>)}</div>}{tab === 'reviews' && <div className="space-y-3">{['Brief rất rõ ràng, phản hồi nhanh và tranh đẹp hơn mong đợi.', 'Làm việc chuyên nghiệp, màu sắc cực kỳ hợp với thương hiệu của mình.'].map((review, index) => <article key={review} className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><div className="flex items-center justify-between"><strong className="text-sm text-white">Khách hàng {index + 1}</strong><span className="text-[#A7ACD9]">★★★★★</span></div><p className="mt-3 text-sm text-[#C7C5CF]">{review}</p></article>)}</div>}</div></main>;
}
