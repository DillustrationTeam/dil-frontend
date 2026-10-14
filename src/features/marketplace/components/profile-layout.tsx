import Image from 'next/image';
import type { ReactNode } from 'react';

export function ProfileLayout({
  name,
  bannerUrl,
  avatarUrl,
  sidebar,
  children,
}: {
  name: string;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#1F2335] px-4 py-6 text-[#E4E1E5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-[#292d44] sm:h-64">
          {bannerUrl ? <Image src={bannerUrl} alt={`${name} cover`} fill unoptimized className="object-cover" /> : <div className="h-full bg-[radial-gradient(ellipse_at_70%_15%,rgba(167,172,217,.2),transparent_50%),linear-gradient(130deg,#252a43,#1f2335_55%,#24322f)]" />}
          {avatarUrl && <span className="absolute bottom-4 left-5 h-16 w-16 overflow-hidden rounded-xl border-2 border-[#1F2335] bg-[#1F2335] sm:bottom-5 sm:left-7 sm:h-20 sm:w-20"><Image src={avatarUrl} alt={`${name} avatar`} fill unoptimized className="object-cover" /></span>}
        </div>
        <div className="mt-5 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="min-w-0">{sidebar}</aside>
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}

export function ProfileTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-white/10">
      {tabs.map((tab) => (
        <button key={tab.id} id={`profile-tab-${tab.id}`} type="button" role="tab" aria-selected={value === tab.id} onClick={() => onChange(tab.id)} className={`shrink-0 border-b-2 px-4 py-3 text-sm ${value === tab.id ? 'border-[#A7ACD9] text-white' : 'border-transparent text-[#919099] hover:text-white'}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}