'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Languages,
  Lock,
  MapPin,
  Package,
  Palette,
  Star,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { clientProfileService } from '../services/client-profile.service';
import {
  ClientProfileDto,
  ClientReviewDto,
  ClientStatisticsDto,
  FollowedCreatorDto,
} from '../types/client-profile.types';
import { Collections } from './collections';
import { ProfileLayout, ProfileTabs } from './profile-layout';

type PersonalTab = 'reputation' | 'requested' | 'saved' | 'liked';
const tabs: { id: PersonalTab; label: string }[] = [
  { id: 'reputation', label: 'Độ uy tín' },
  { id: 'requested', label: 'Đơn đã đặt' },
  { id: 'saved', label: 'Đã lưu' },
  { id: 'liked', label: 'Yêu thích' },
];
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export function PersonalProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const isCreator = useAuthStore((s) => s.roles.some((role) => role.toLowerCase() === 'creator'));
  const [tab, setTab] = useState<PersonalTab>('reputation');
  const [items, setItems] = useState<Commission[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [profile, setProfile] = useState<ClientProfileDto | null>(null);
  const [statistics, setStatistics] = useState<ClientStatisticsDto | null>(null);
  const [reviews, setReviews] = useState<ClientReviewDto[]>([]);
  const [following, setFollowing] = useState<FollowedCreatorDto[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError(''); setItems([]); setCreatorId(null);
      if (!authenticated || !user) { setLoading(false); return; }
      const [commissions, creatorProfile, clientProfile, clientStats, clientReviews, clientFollowing] = await Promise.allSettled([
        commissionService.getByClient(),
        isCreator ? creatorProfileService.getMyProfile() : Promise.resolve(null),
        clientProfileService.getClientById(user.id),
        clientProfileService.getClientStatistics(user.id),
        clientProfileService.getClientReviews(user.id),
        clientProfileService.getClientFollowing(user.id),
      ]);
      if (!active) return;
      if (commissions.status === 'fulfilled') setItems(commissions.value);
      else setError('Không thể tải đơn đã đặt. Vui lòng thử lại.');
      if (creatorProfile.status === 'fulfilled') setCreatorId(creatorProfile.value?.id ?? null);
      setProfile(clientProfile.status === 'fulfilled' ? clientProfile.value : null);
      setStatistics(clientStats.status === 'fulfilled' ? clientStats.value : null);
      setReviews(clientReviews.status === 'fulfilled' ? clientReviews.value : []);
      setFollowing(clientFollowing.status === 'fulfilled' ? clientFollowing.value : []);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [authenticated, user, isCreator, retry]);

  if (!authenticated || !user) return <div className="py-20 text-center"><h1 className="font-h1 text-2xl">Hồ sơ của bạn</h1><Link href="/login" className="mt-4 inline-block text-[#A7ACD9]">Đăng nhập để xem hồ sơ</Link></div>;

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return <ProfileLayout name={user.fullName} bannerUrl={profile?.coverUrl ?? user.coverUrl} avatarUrl={profile?.avatarUrl ?? user.avatarUrl} sidebar={<>
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Personal profile</p>
    <h1 className="break-words font-h1 text-3xl font-semibold text-white">{user.fullName}</h1>
    <p className="mt-2 text-sm text-[#919099]">Thành viên Dillustration</p>

    <details className="mt-3 group">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-[#C7C5CF] [&::-webkit-details-marker]:hidden">
        <Users size={15} className="text-[#A7ACD9]" />
        <span>{following.length} Following</span>
      </summary>
      <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
        {following.length === 0 ? (
          <p className="px-2 py-2 text-xs text-[#919099]">Chưa theo dõi nghệ sĩ nào.</p>
        ) : (
          following.map((creator) => (
            <Link
              key={creator.creatorProfileId}
              href={`/creators/${creator.creatorProfileId}`}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
            >
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-[#A7ACD9]/20">
                {creator.avatarUrl ? (
                  <Image src={creator.avatarUrl} alt={creator.displayName} fill unoptimized className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#A7ACD9]">
                    {creator.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="truncate text-xs text-[#E4E1E5]">{creator.displayName}</span>
            </Link>
          ))
        )}
      </div>
    </details>

    <Link href="/client/commissions" className="mt-6 block rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold hover:bg-white/10">Quản lý đơn đặt tranh</Link>
    {creatorId ? <Link href={`/creators/${creatorId}`} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#A7ACD9] px-4 py-3 text-sm font-semibold text-[#1F2335]"><Palette size={16} />Xem profile nghệ sĩ</Link> : !isCreator ? <Link href="/creator-setup" className="mt-3 block rounded-full border border-[#A7ACD9]/30 px-4 py-3 text-center text-sm text-[#A7ACD9]">Trở thành nghệ sĩ</Link> : null}

    <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-[#919099]">Thông tin cơ bản</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[#C7C5CF]">
        <li>{profile?.bio || 'Không gian của bạn để theo dõi các dự án, lưu cảm hứng và tìm lại tác phẩm yêu thích.'}</li>
        {!!profile?.interestTags.length && (
          <li className="flex flex-wrap gap-1.5 pt-1">
            {profile.interestTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#A7ACD9]/10 px-2.5 py-1 text-xs text-[#A7ACD9]">{tag}</span>
            ))}
          </li>
        )}
        <li className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0 text-[#919099]" />
          <span>Tham gia từ {new Date(profile?.joinedAt ?? user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
        </li>
        {profile?.country && (
          <li className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0 text-[#919099]" />
            <span>{profile.country}</span>
          </li>
        )}
        {profile?.timezone && (
          <li className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-[#919099]" />
            <span>{profile.timezone}</span>
          </li>
        )}
        {!!profile?.preferredLanguages.length && (
          <li className="flex items-center gap-2">
            <Languages size={14} className="shrink-0 text-[#919099]" />
            <span>{profile.preferredLanguages.join(', ')}</span>
          </li>
        )}
      </ul>
    </div>

    <details className="mt-5 border-t border-white/10 pt-5 text-sm"><summary className="cursor-pointer font-medium">Thông tin tài khoản</summary><p className="mt-3 break-words text-[#919099]">{user.email}</p></details>
  </>}>
    <ProfileTabs tabs={tabs} value={tab} onChange={setTab} />
    <p className="mt-4 flex items-center gap-2 text-xs text-[#919099]"><Lock size={13} />Chỉ bạn xem được nội dung hồ sơ cá nhân này.</p>
    <div id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-tab-${tab}`} tabIndex={0} className="mt-7 focus-visible:outline-[#A7ACD9]">
      {tab === 'reputation' ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-h1 text-xl font-bold text-white">{statistics?.completedCommissionCount ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#919099]">Đơn hoàn thành</p>
            </div>
            <div>
              <p className="font-h1 text-xl font-bold text-white">{statistics?.disputeCount ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#919099]">Tranh chấp</p>
            </div>
            <div>
              <p className="font-h1 text-xl font-bold text-white">
                {averageRating !== null ? averageRating.toFixed(1) : '—'}
                {averageRating !== null && <Star className="ml-1 inline h-3.5 w-3.5 fill-[#A7ACD9] text-[#A7ACD9]" />}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#919099]">{reviews.length} đánh giá từ Creator</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-[#C7C5CF]">Chưa có đánh giá nào.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-white/[.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A7ACD9]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="text-xs text-[#919099]">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-[#C7C5CF]">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      ) : tab !== 'requested' ? <Collections key={`${user.id}:${tab}`} embedded mode={tab} /> : loading ? <p className="py-16 text-center text-[#919099]">Đang tải đơn đặt tranh...</p> : error ? <div role="alert" className="glass-container rounded-3xl p-8 text-sm"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 text-[#A7ACD9] underline">Thử lại</button></div> : items.length ? <div className="space-y-4">{items.map((item) => {
        const href = ['PendingAcceptance', 'Negotiating', 'Cancelled'].includes(item.status) ? `/client/requests/${item.id}` : item.status === 'InProgress' && item.escrowStatus === 'Pending' ? `/payment/checkout/${item.id}` : `/workroom/${item.id}`;
        return <Link key={item.id} href={href} className="glass-container group flex items-center gap-4 rounded-3xl p-5 transition hover:border-[#A7ACD9]/40 sm:p-7"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#A7ACD9]/10 text-[#A7ACD9]"><Package size={24} /></span><span className="min-w-0 flex-1"><span className="text-[10px] text-[#A7ACD9]">{item.status}</span><span className="mt-1 block break-words font-h1 text-base font-semibold text-white">{item.title}</span><span className="mt-2 block text-xs text-[#919099]">{item.creatorName || 'Nghệ sĩ'} · {money(item.finalPrice ?? item.totalPrice ?? item.price ?? 0)}</span></span><ArrowUpRight size={20} className="shrink-0 text-[#919099] group-hover:text-[#A7ACD9]" /></Link>;
      })}</div> : <div className="glass-container rounded-[32px] px-6 py-20 text-center"><Package size={30} className="mx-auto text-[#A7ACD9]/60" /><h2 className="mt-5 font-h1 text-lg">Chưa có đơn đặt tranh</h2><p className="mt-2 text-sm text-[#919099]">Các yêu cầu và dự án của bạn sẽ xuất hiện tại đây.</p><Link href="/explore" className="mt-5 inline-block rounded-full bg-[#A7ACD9] px-5 py-3 text-sm font-semibold text-[#1F2335]">Khám phá nghệ sĩ</Link></div>}
    </div>
  </ProfileLayout>;
}
