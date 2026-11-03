'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { clientProfileService } from '@/features/marketplace/services/client-profile.service';
import type { ClientProfileDto, ClientStatisticsDto } from '@/features/marketplace/types/client-profile.types';

export function ClientProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<ClientProfileDto | null>(null);
  const [statistics, setStatistics] = useState<ClientStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([clientProfileService.getClientById(id), clientProfileService.getClientStatistics(id)])
      .then(([nextProfile, nextStatistics]) => {
        if (active) {
          setProfile(nextProfile);
          setStatistics(nextStatistics);
        }
      })
      .catch(() => { if (active) setProfile(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <main className="min-h-[70vh] bg-[#1F2335] p-12 text-center text-[#C7C5CF]">Đang tải hồ sơ…</main>;
  if (!profile) return <main className="min-h-[70vh] bg-[#1F2335] p-12 text-center text-[#C7C5CF]">Không tìm thấy hồ sơ.</main>;

  return (
    <main className="min-h-[70vh] bg-[#1F2335] px-4 py-10 text-[#E4E1E5] sm:px-6">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
        <div className="relative h-44 bg-[#292d44]">{profile.coverUrl && <Image src={profile.coverUrl} alt="Ảnh bìa" fill unoptimized className="object-cover" />}</div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4">{profile.avatarUrl ? <span className="relative h-16 w-16 overflow-hidden rounded-xl"><Image src={profile.avatarUrl} alt={profile.fullName} fill unoptimized className="object-cover" /></span> : null}<div><h1 className="font-h1 text-2xl font-bold text-white">{profile.fullName}</h1><p className="mt-1 text-xs text-[#919099]">Tham gia {new Date(profile.joinedAt).toLocaleDateString('vi-VN')}</p></div></div>
          {profile.bio && <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#C7C5CF]">{profile.bio}</p>}
          <div className="mt-6 grid grid-cols-2 gap-3"><Metric label="Commission hoàn thành" value={statistics?.completedCommissionCount ?? 0} /><Metric label="Tranh chấp" value={statistics?.disputeCount ?? 0} /></div>
          {!!profile.interestTags.length && <div className="mt-5 flex flex-wrap gap-2">{profile.interestTags.map((tag) => <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#C7C5CF]">{tag}</span>)}</div>}
        </div>
      </article>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/10 p-4"><p className="text-xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-[#919099]">{label}</p></div>;
}