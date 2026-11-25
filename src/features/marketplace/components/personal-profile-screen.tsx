'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Languages,
  Lock,
  MapPin,
  MoreVertical,
  Package,
  Palette,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { clientProfileService } from '../services/client-profile.service';
import { marketplaceService } from '../services/marketplace.service';
import {
  ClientProfileDto,
  ClientReviewDto,
  ClientStatisticsDto,
  FollowedCreatorDto,
  FollowerUserDto,
} from '../types/client-profile.types';
import { Collections } from './collections';
import { ProfileLayout, ProfileTabs } from './profile-layout';
import {
  PROFILE_TAB_DEFINITIONS,
  PersonalTab,
  getVisibleOrderedTabs,
  loadProfileTabPreferences,
} from '@/features/profile-settings/utils/profile-tab-preferences';

const ROLE_LABELS: Record<string, string> = {
  Creator: 'Nghệ sĩ',
  Client: 'Khách hàng',
};

function getRoleBadges(roles: string[] | undefined | null, fallback?: 'Creator' | 'Client') {
  const safeRoles = roles ?? [];
  const unique = Array.from(new Set(safeRoles.length > 0 ? safeRoles : fallback ? [fallback] : []));
  return ['Creator', 'Client']
    .filter((role) => unique.includes(role))
    .map((role) => ({ key: role, label: ROLE_LABELS[role] ?? role, isCreator: role === 'Creator' }));
}

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const MAX_VISIBLE_TAGS = 6;
const MAX_VISIBLE_LANGUAGES = 4;

export function PersonalProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isCreator = useAuthStore((s) => s.roles.some((role) => role.toLowerCase() === 'creator'));
  const [tabs, setTabs] = useState(PROFILE_TAB_DEFINITIONS);
  const [tab, setTab] = useState<PersonalTab>('reputation');
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'following' | 'followers'>('following');
  const [items, setItems] = useState<Commission[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [profile, setProfile] = useState<ClientProfileDto | null>(null);
  const [statistics, setStatistics] = useState<ClientStatisticsDto | null>(null);
  const [reviews, setReviews] = useState<ClientReviewDto[]>([]);
  const [following, setFollowing] = useState<FollowedCreatorDto[]>([]);
  const [followers, setFollowers] = useState<FollowerUserDto[]>([]);
  const [openFollowMenuId, setOpenFollowMenuId] = useState<string | null>(null);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const [showBioModal, setShowBioModal] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    setIsBioClamped(el.scrollHeight > el.clientHeight + 1);
  }, [profile?.bio]);

  useEffect(() => {
    const visibleTabs = getVisibleOrderedTabs(loadProfileTabPreferences());
    if (visibleTabs.length === 0) return;
    setTabs(visibleTabs);
    setTab((current) => (visibleTabs.some((item) => item.id === current) ? current : visibleTabs[0].id));
  }, []);

  useEffect(() => {
    // Chờ Zustand persist đọc xong localStorage rồi mới quyết định — kiểm tra
    // authenticated ngay khi mount sẽ luôn thấy false (giá trị mặc định) và
    // đá nhầm người dùng đã đăng nhập ra /login mỗi lần F5 hoặc mở link thẳng.
    if (hasHydrated && (!authenticated || !user)) router.replace('/login?returnUrl=%2Fprofile%2Fme');
  }, [hasHydrated, authenticated, router, user]);

  useEffect(() => {
    if (!showFollowingModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFollowingModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showFollowingModal]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!hasHydrated) return;
      setLoading(true); setError(''); setItems([]); setCreatorId(null);
      if (!authenticated || !user) { setLoading(false); return; }
      const [commissions, creatorProfile, clientProfile, clientStats, clientReviews, clientFollowing, clientFollowers] = await Promise.allSettled([
        commissionService.getByClient(),
        isCreator ? creatorProfileService.getMyProfile() : Promise.resolve(null),
        clientProfileService.getClientById(user.id),
        clientProfileService.getClientStatistics(user.id),
        clientProfileService.getClientReviews(user.id),
        clientProfileService.getClientFollowing(user.id),
        clientProfileService.getClientFollowers(user.id),
      ]);
      if (!active) return;
      if (commissions.status === 'fulfilled') setItems(commissions.value);
      else setError('Không thể tải đơn đã đặt. Vui lòng thử lại.');
      if (creatorProfile.status === 'fulfilled') setCreatorId(creatorProfile.value?.id ?? null);
      setProfile(clientProfile.status === 'fulfilled' ? clientProfile.value : null);
      setStatistics(clientStats.status === 'fulfilled' ? clientStats.value : null);
      setReviews(clientReviews.status === 'fulfilled' ? clientReviews.value : []);
      setFollowing(clientFollowing.status === 'fulfilled' ? clientFollowing.value : []);
      setFollowers(clientFollowers.status === 'fulfilled' ? clientFollowers.value : []);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [hasHydrated, authenticated, user, isCreator, retry]);

  if (!hasHydrated) {
    return null;
  }

  if (!authenticated || !user) {
    return <div className="py-20 text-center"><h1 className="font-h1 text-2xl">Hồ sơ của bạn</h1><Link href="/login" className="mt-4 inline-block text-[#B24A26]">Đăng nhập để xem hồ sơ</Link></div>;
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const handleUnfollow = async (creatorProfileId: string) => {
    setOpenFollowMenuId(null);
    setUnfollowingId(creatorProfileId);
    try {
      await marketplaceService.unfollowCreator(creatorProfileId);
      setFollowing((current) => current.filter((creator) => creator.creatorProfileId !== creatorProfileId));
    } catch {
      // bỏ qua: nếu API lỗi, danh sách giữ nguyên và user có thể thử lại
    } finally {
      setUnfollowingId(null);
    }
  };

  return <>
  <ProfileLayout name={user.fullName} bannerUrl={profile?.coverUrl ?? user.coverUrl} avatarUrl={profile?.avatarUrl ?? user.avatarUrl} sidebar={<>
    <Link href="/settings" className="inline-block rounded-xl border border-[#221E1A]/10 px-4 py-2 text-sm text-[#241F1A]">Sửa trang cá nhân</Link>

    <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#B24A26]">Hồ sơ cá nhân</p>
    <h1 className="break-words font-h1 text-3xl font-semibold text-[#241F1A]">{user.fullName}</h1>
    <p className="mt-2 text-sm text-[#746A5F]">Thành viên Dillustration</p>

    <div className="mt-3 flex items-center gap-4">
      <button
        type="button"
        onClick={() => { setFollowModalTab('following'); setShowFollowingModal(true); }}
        className="flex items-center gap-1.5 text-sm text-[#6E6459] transition hover:text-[#241F1A]"
      >
        <Users size={15} className="text-[#B24A26]" />
        <span><strong className="text-[#241F1A]">{following.length}</strong> Đang theo dõi</span>
      </button>
      <button
        type="button"
        onClick={() => { setFollowModalTab('followers'); setShowFollowingModal(true); }}
        className="flex items-center gap-1.5 text-sm text-[#6E6459] transition hover:text-[#241F1A]"
      >
        <Users size={15} className="text-[#B24A26]" />
        <span><strong className="text-[#241F1A]">{followers.length}</strong> Người theo dõi</span>
      </button>
    </div>

    <Link href="/client/commissions" className="mt-6 block rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-4 py-3 text-center text-sm font-semibold hover:bg-[#F0E7D8]">Quản lý đơn đặt tranh</Link>
    {creatorId ? <Link href={`/creators/${creatorId}`} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#B24A26] px-4 py-3 text-sm font-semibold text-[#F7F2E9]"><Palette size={16} />Xem profile nghệ sĩ</Link> : !isCreator ? <Link href="/creator-setup" className="mt-3 block rounded-full border border-[#B24A26]/30 px-4 py-3 text-center text-sm text-[#B24A26]">Trở thành nghệ sĩ</Link> : null}

    <div className="mt-7 rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
      <p className="text-xs uppercase tracking-wider text-[#746A5F]">Thông tin cơ bản</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[#6E6459]">
        <li>
          <p ref={bioRef} className="line-clamp-[15] whitespace-pre-line break-words">
            {profile?.bio || 'Không gian của bạn để theo dõi các dự án, lưu cảm hứng và tìm lại tác phẩm yêu thích.'}
          </p>
          {isBioClamped && (
            <button
              type="button"
              onClick={() => setShowBioModal(true)}
              className="mt-1 text-xs font-semibold text-[#B24A26] hover:underline"
            > Xem thêm </button>
          )}
        </li>
        {!!profile?.interestTags.length && (
          <li className="flex flex-wrap gap-1.5 pt-1">
            {profile.interestTags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <span key={tag} className="rounded-full bg-[#B24A26]/10 px-2.5 py-1 text-xs text-[#B24A26]">{tag}</span>
            ))}
            {profile.interestTags.length > MAX_VISIBLE_TAGS && (
              <span
                className="rounded-full bg-[#FFFCF6] px-2.5 py-1 text-xs text-[#746A5F]"
                title={profile.interestTags.slice(MAX_VISIBLE_TAGS).join(', ')}
              >
                +{profile.interestTags.length - MAX_VISIBLE_TAGS}
              </span>
            )}
          </li>
        )}
        <li className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0 text-[#746A5F]" />
          <span>Tham gia từ {new Date(profile?.joinedAt ?? user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
        </li>
        {profile?.country && (
          <li className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0 text-[#746A5F]" />
            <span>{profile.country}</span>
          </li>
        )}
        {profile?.timezone && (
          <li className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-[#746A5F]" />
            <span>{profile.timezone}</span>
          </li>
        )}
        {!!profile?.preferredLanguages.length && (
          <li className="flex items-center gap-2">
            <Languages size={14} className="shrink-0 text-[#746A5F]" />
            <span className="truncate" title={profile.preferredLanguages.join(', ')}>
              {profile.preferredLanguages.slice(0, MAX_VISIBLE_LANGUAGES).join(', ')}
              {profile.preferredLanguages.length > MAX_VISIBLE_LANGUAGES &&
                ` +${profile.preferredLanguages.length - MAX_VISIBLE_LANGUAGES}`}
            </span>
          </li>
        )}
      </ul>
    </div>

    <details className="mt-5 border-t border-[#221E1A]/10 pt-5 text-sm">
      <summary className="cursor-pointer font-medium">Liên kết mạng xã hội</summary>
      <div className="mt-3 space-y-1.5">
        {user.socialLinks?.length ? (
          user.socialLinks.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="block truncate text-[#B24A26] underline">
              {url}
            </a>
          ))
        ) : (
          <p className="text-[#746A5F]">Chưa thêm liên kết mạng xã hội nào.</p>
        )}
      </div>
    </details>
  </>}>
    <ProfileTabs tabs={tabs} value={tab} onChange={setTab} />
    <p className="mt-4 flex items-center gap-2 text-xs text-[#746A5F]"><Lock size={13} />Chỉ bạn xem được nội dung hồ sơ cá nhân này.</p>
    <div id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-tab-${tab}`} tabIndex={0} className="mt-7 focus-visible:outline-[#B24A26]">
      {tab === 'reputation' ? (
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-h1 text-xl font-bold text-[#241F1A]">{statistics?.completedCommissionCount ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#746A5F]">Đơn hoàn thành</p>
            </div>
            <div>
              <p className="font-h1 text-xl font-bold text-[#241F1A]">{statistics?.disputeCount ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#746A5F]">Tranh chấp</p>
            </div>
            <div>
              <p className="font-h1 text-xl font-bold text-[#241F1A]">
                {averageRating !== null ? averageRating.toFixed(1) : '—'}
                {averageRating !== null && <Star className="ml-1 inline h-3.5 w-3.5 fill-[#B24A26] text-[#B24A26]" />}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#746A5F]">{reviews.length} đánh giá từ họa sĩ</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-[#221E1A]/10 pt-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-[#6E6459]">Chưa có đánh giá nào.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-[#FFFCF6] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#B24A26]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="text-xs text-[#746A5F]">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-[#6E6459]">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      ) : tab !== 'requested' ? <Collections key={`${user.id}:${tab}`} embedded mode={tab} /> : loading ? <p className="py-16 text-center text-[#746A5F]">Đang tải đơn đặt tranh...</p> : error ? <div role="alert" className="glass-container rounded-3xl p-8 text-sm"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 text-[#B24A26] underline">Thử lại</button></div> : items.length ? <div className="space-y-4">{items.map((item) => {
        const href = ['PendingAcceptance', 'Negotiating', 'Cancelled'].includes(item.status) ? `/client/requests/${item.id}` : item.status === 'InProgress' && item.escrowStatus === 'Pending' ? `/payment/checkout/${item.id}` : `/workroom/${item.id}`;
        return <Link key={item.id} href={href} className="glass-container group flex items-center gap-4 rounded-3xl p-5 transition hover:border-[#B24A26]/40 sm:p-7"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#B24A26]/10 text-[#B24A26]"><Package size={24} /></span><span className="min-w-0 flex-1"><span className="text-[10px] text-[#B24A26]">{item.status}</span><span className="mt-1 block break-words font-h1 text-base font-semibold text-[#241F1A]">{item.title}</span><span className="mt-2 block text-xs text-[#746A5F]">{item.creatorName || 'Nghệ sĩ'} · {money(item.finalPrice ?? item.totalPrice ?? item.price ?? 0)}</span></span><ArrowUpRight size={20} className="shrink-0 text-[#746A5F] group-hover:text-[#B24A26]" /></Link>;
      })}</div> : <div className="glass-container rounded-[32px] px-6 py-20 text-center"><Package size={30} className="mx-auto text-[#B24A26]/60" /><h2 className="mt-5 font-h1 text-lg">Chưa có đơn đặt tranh</h2><p className="mt-2 text-sm text-[#746A5F]">Các yêu cầu và dự án của bạn sẽ xuất hiện tại đây.</p><Link href="/explore" className="mt-5 inline-block rounded-full bg-[#B24A26] px-5 py-3 text-sm font-semibold text-[#F7F2E9]">Khám phá nghệ sĩ</Link></div>}
    </div>
  </ProfileLayout>

  {showFollowingModal && createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setShowFollowingModal(false)}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#F0E7D8]/55 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-[min(32rem,85vh)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setShowFollowingModal(false)}
          aria-label="Đóng"
          className="absolute right-4 top-4 rounded-full p-2 text-[#746A5F] transition hover:bg-[#F0E7D8] hover:text-[#241F1A]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-b border-[#221E1A]/10 pr-10 sm:gap-6">
          <button
            type="button"
            onClick={() => setFollowModalTab('following')}
            className={`shrink-0 whitespace-nowrap pb-3 text-sm font-bold transition sm:text-base ${followModalTab === 'following' ? 'border-b-2 border-[#B24A26] text-[#241F1A]' : 'text-[#746A5F] hover:text-[#241F1A]'}`}
          >
            Đang theo dõi ({following.length})
          </button>
          <button
            type="button"
            onClick={() => setFollowModalTab('followers')}
            className={`shrink-0 whitespace-nowrap pb-3 text-sm font-bold transition sm:text-base ${followModalTab === 'followers' ? 'border-b-2 border-[#B24A26] text-[#241F1A]' : 'text-[#746A5F] hover:text-[#241F1A]'}`}
          >
            Người theo dõi ({followers.length})
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {followModalTab === 'following' ? (
            following.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Users size={26} className="text-[#B24A26]/60" />
                <p className="text-sm text-[#746A5F]">Chưa theo dõi nghệ sĩ nào.</p>
                <Link href="/explore" onClick={() => setShowFollowingModal(false)} className="text-sm font-semibold text-[#B24A26] underline-offset-2 hover:underline"> Khám phá nghệ sĩ </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {following.map((creator) => (
                  <div
                    key={creator.creatorProfileId}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#221E1A]/10"
                  >
                    <Link
                      href={`/creators/${creator.creatorProfileId}`}
                      onClick={() => setShowFollowingModal(false)}
                      className="absolute inset-0 z-0"
                      aria-label={creator.displayName}
                    />
                    <span className="relative z-0 aspect-square w-full overflow-hidden bg-[#B24A26]/20">
                      {creator.avatarUrl ? (
                        <Image src={creator.avatarUrl} alt={creator.displayName} fill unoptimized className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[#B24A26]">
                          {creator.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>

                    <span className="relative z-0 flex min-w-0 flex-1 items-start justify-between gap-2 p-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#241F1A]">{creator.displayName}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2">
                          {getRoleBadges(creator.roles, 'Creator').map((badge) => (
                            <span
                              key={badge.key}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                badge.isCreator ? 'text-[#B24A26]' : 'text-[#6E6459]'
                              }`}
                            >
                              {badge.isCreator ? <Palette size={10} /> : <Users size={10} />}
                              {badge.label}
                            </span>
                          ))}
                        </span>
                      </span>

                      <span className="relative z-20 shrink-0">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setOpenFollowMenuId((current) => (current === creator.creatorProfileId ? null : creator.creatorProfileId));
                          }}
                          aria-label="Tuỳ chọn"
                          disabled={unfollowingId === creator.creatorProfileId}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[#746A5F] transition hover:bg-[#F0E7D8] hover:text-[#241F1A] disabled:opacity-50"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {openFollowMenuId === creator.creatorProfileId && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setOpenFollowMenuId(null)} />
                            <div className="absolute bottom-full right-0 z-30 mb-2 w-32 overflow-hidden rounded-xl border border-[#221E1A]/10 bg-[#F7F2E9] shadow-xl">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  void handleUnfollow(creator.creatorProfileId);
                                }}
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#A8321C] transition hover:bg-[#F0E7D8]"
                              > Hủy theo dõi </button>
                            </div>
                          </>
                        )}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : followers.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Users size={26} className="text-[#B24A26]/60" />
              <p className="text-sm text-[#746A5F]">Chưa có người theo dõi nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {followers.map((follower) => (
                <div
                  key={follower.userId}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#221E1A]/10"
                >
                  <span className="relative aspect-square w-full overflow-hidden bg-[#B24A26]/20">
                    {follower.avatarUrl ? (
                      <Image src={follower.avatarUrl} alt={follower.displayName} fill unoptimized className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[#B24A26]">
                        {follower.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 p-2.5">
                    <span className="block truncate text-sm font-bold text-[#241F1A]">{follower.displayName}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      {getRoleBadges(follower.roles).map((badge) => (
                        <span
                          key={badge.key}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            badge.isCreator ? 'text-[#B24A26]' : 'text-[#6E6459]'
                          }`}
                        >
                          {badge.isCreator ? <Palette size={10} /> : <Users size={10} />}
                          {badge.label}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )}

  {showBioModal && createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setShowBioModal(false)}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#F0E7D8]/55 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setShowBioModal(false)}
          aria-label="Đóng"
          className="absolute right-4 top-4 rounded-full p-2 text-[#746A5F] transition hover:bg-[#F0E7D8] hover:text-[#241F1A]"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="shrink-0 pr-10 text-xs uppercase tracking-wider text-[#B24A26]">Thông tin cơ bản</p>
        <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto text-sm text-[#6E6459]">
          <p className="whitespace-pre-line break-words">{profile?.bio}</p>
          {!!profile?.interestTags.length && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.interestTags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#B24A26]/10 px-2.5 py-1 text-xs text-[#B24A26]">{tag}</span>
              ))}
            </div>
          )}
          <p className="flex items-center gap-2 pt-1">
            <Calendar size={14} className="shrink-0 text-[#746A5F]" />
            <span>Tham gia từ {new Date(profile?.joinedAt ?? user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
          </p>
          {profile?.country && (
            <p className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-[#746A5F]" />
              <span>{profile.country}</span>
            </p>
          )}
          {profile?.timezone && (
            <p className="flex items-center gap-2">
              <Clock size={14} className="shrink-0 text-[#746A5F]" />
              <span>{profile.timezone}</span>
            </p>
          )}
          {!!profile?.preferredLanguages.length && (
            <p className="flex items-center gap-2">
              <Languages size={14} className="shrink-0 text-[#746A5F]" />
              <span>{profile.preferredLanguages.join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )}
  </>;
}
