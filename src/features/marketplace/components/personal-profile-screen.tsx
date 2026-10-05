'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Lock, Package, Palette } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import { Collections } from './collections';
import { ProfileLayout, ProfileTabs } from './profile-layout';

type PersonalTab = 'requested' | 'saved' | 'liked';
const tabs: { id: PersonalTab; label: string }[] = [{ id: 'requested', label: 'Đơn đã đặt' }, { id: 'saved', label: 'Đã lưu' }, { id: 'liked', label: 'Yêu thích' }];
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export function PersonalProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const isCreator = useAuthStore((s) => s.roles.some((role) => role.toLowerCase() === 'creator'));
  const [tab, setTab] = useState<PersonalTab>('requested');
  const [items, setItems] = useState<Commission[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError(''); setItems([]); setCreatorId(null);
      if (!authenticated) { setLoading(false); return; }
      const [commissions, profile] = await Promise.allSettled([commissionService.getByClient(), isCreator ? creatorProfileService.getMyProfile() : Promise.resolve(null)]);
      if (!active) return;
      if (commissions.status === 'fulfilled') setItems(commissions.value);
      else setError('Không thể tải đơn đã đặt. Vui lòng thử lại.');
      if (profile.status === 'fulfilled') setCreatorId(profile.value?.id ?? null);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [authenticated, user?.id, isCreator, retry]);

  if (!authenticated || !user) return <div className="py-20 text-center"><h1 className="font-h1 text-2xl">Hồ sơ của bạn</h1><Link href="/login" className="mt-4 inline-block text-[#A7ACD9]">Đăng nhập để xem hồ sơ</Link></div>;
  return <ProfileLayout name={user.fullName} bannerUrl={user.coverUrl} avatarUrl={user.avatarUrl} sidebar={<>
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#A7ACD9]">Personal profile</p>
    <h1 className="break-words font-h1 text-3xl font-semibold text-white">{user.fullName}</h1>
    <p className="mt-2 text-sm text-[#919099]">Thành viên Dillustration</p>
    <Link href="/client/commissions" className="mt-6 block rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold hover:bg-white/10">Quản lý đơn đặt tranh</Link>
    {creatorId ? <Link href={`/creators/${creatorId}`} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#A7ACD9] px-4 py-3 text-sm font-semibold text-[#1F2335]"><Palette size={16} />Xem profile nghệ sĩ</Link> : !isCreator ? <Link href="/creator-setup" className="mt-3 block rounded-full border border-[#A7ACD9]/30 px-4 py-3 text-center text-sm text-[#A7ACD9]">Trở thành nghệ sĩ</Link> : null}
    <p className="mt-7 text-sm leading-7 text-[#C7C5CF]">Không gian của bạn để theo dõi các dự án, lưu cảm hứng và tìm lại tác phẩm yêu thích.</p>
    <details className="mt-8 border-t border-white/10 pt-5 text-sm"><summary className="cursor-pointer font-medium">Thông tin tài khoản</summary><p className="mt-3 break-words text-[#919099]">{user.email}</p><p className="mt-2 text-[#919099]">Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p></details>
  </>}>
    <ProfileTabs tabs={tabs} value={tab} onChange={setTab} />
    <p className="mt-4 flex items-center gap-2 text-xs text-[#919099]"><Lock size={13} />Chỉ bạn xem được nội dung hồ sơ cá nhân này.</p>
    <div id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-tab-${tab}`} tabIndex={0} className="mt-7 focus-visible:outline-[#A7ACD9]">
      {tab !== 'requested' ? <Collections key={`${user.id}:${tab}`} embedded mode={tab} /> : loading ? <p className="py-16 text-center text-[#919099]">Đang tải đơn đặt tranh...</p> : error ? <div role="alert" className="glass-container rounded-3xl p-8 text-sm"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 text-[#A7ACD9] underline">Thử lại</button></div> : items.length ? <div className="space-y-4">{items.map((item) => {
        const href = ['PendingAcceptance', 'Negotiating', 'Cancelled'].includes(item.status) ? `/client/requests/${item.id}` : item.status === 'InProgress' && item.escrowStatus === 'Pending' ? `/payment/checkout/${item.id}` : `/workroom/${item.id}`;
        return <Link key={item.id} href={href} className="glass-container group flex items-center gap-4 rounded-3xl p-5 transition hover:border-[#A7ACD9]/40 sm:p-7"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#A7ACD9]/10 text-[#A7ACD9]"><Package size={24} /></span><span className="min-w-0 flex-1"><span className="text-[10px] text-[#A7ACD9]">{item.status}</span><span className="mt-1 block break-words font-h1 text-base font-semibold text-white">{item.title}</span><span className="mt-2 block text-xs text-[#919099]">{item.creatorName || 'Nghệ sĩ'} · {money(item.finalPrice ?? item.totalPrice ?? item.price ?? 0)}</span></span><ArrowUpRight size={20} className="shrink-0 text-[#919099] group-hover:text-[#A7ACD9]" /></Link>;
      })}</div> : <div className="glass-container rounded-[32px] px-6 py-20 text-center"><Package size={30} className="mx-auto text-[#A7ACD9]/60" /><h2 className="mt-5 font-h1 text-lg">Chưa có đơn đặt tranh</h2><p className="mt-2 text-sm text-[#919099]">Các yêu cầu và dự án của bạn sẽ xuất hiện tại đây.</p><Link href="/explore" className="mt-5 inline-block rounded-full bg-[#A7ACD9] px-5 py-3 text-sm font-semibold text-[#1F2335]">Khám phá nghệ sĩ</Link></div>}
    </div>
  </ProfileLayout>;
}
