'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

export function ProfileLayout({ name, bannerUrl, avatarUrl, sidebar, children }: { name: string; bannerUrl?: string | null; avatarUrl?: string | null; sidebar: ReactNode; children: ReactNode }) {
  return <div className="min-h-screen bg-[#1F2335] font-body text-[#E4E1E5]">
    <div className="relative h-48 overflow-hidden bg-[#2b304b] sm:h-64 lg:h-80">
      {bannerUrl ? <Image src={bannerUrl} alt={`Ảnh bìa của ${name}`} fill unoptimized sizes="100vw" className="object-cover" /> : <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,#A7ACD944,transparent_65%)]"><div className="absolute -right-16 -top-48 h-[600px] w-[900px] rotate-[-20deg] rounded-[50%] border-[40px] border-[#A7ACD9]/10" /><div className="absolute -right-12 -top-32 h-[600px] w-[1000px] rotate-[-20deg] rounded-[50%] border border-[#A7ACD9]/20" /></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F2335]/45 to-transparent" />
    </div>
    <div className="relative mx-auto grid max-w-[1440px] gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[300px_minmax(0,1fr)] xl:px-12">
      <aside className="min-w-0 -mt-16 self-start lg:-mt-24">
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-[6px] border-[#1F2335] bg-[#A7ACD9] font-h1 text-5xl font-semibold text-[#1F2335] shadow-xl sm:h-40 sm:w-40 lg:h-48 lg:w-48 lg:text-7xl" aria-label={`Avatar ${name}`}>
          {avatarUrl ? <Image src={avatarUrl} alt={`Avatar ${name}`} fill unoptimized className="object-cover" /> : name.slice(0, 1).toUpperCase()}
        </div>
        {sidebar}
      </aside>
      <section className="min-w-0 pt-0 lg:pt-8">{children}</section>
    </div>
  </div>;
}

export function ProfileTabs<T extends string>({ tabs, value, onChange }: { tabs: readonly { id: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <div role="tablist" aria-label="Nội dung hồ sơ" className="flex gap-6 overflow-x-auto border-b border-white/10 sm:gap-8">{tabs.map((tab, index) => <button type="button" key={tab.id} id={`profile-tab-${tab.id}`} role="tab" tabIndex={value === tab.id ? 0 : -1} aria-controls={value === tab.id ? `profile-panel-${tab.id}` : undefined} aria-selected={value === tab.id} onClick={() => onChange(tab.id)} onKeyDown={(event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    document.getElementById(`profile-tab-${tabs[next].id}`)?.focus();
  }} className={`shrink-0 border-b-2 pb-4 font-h1 text-base font-semibold transition sm:text-xl ${value === tab.id ? 'border-[#A7ACD9] text-white' : 'border-transparent text-[#919099] hover:text-[#E4E1E5]'} focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A7ACD9]`}>{tab.label}</button>)}</div>;
}
