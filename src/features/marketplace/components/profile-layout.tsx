'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

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
    <div className="min-h-screen bg-[var(--ink)] text-[var(--ivory)] font-[family-name:var(--font-ui)]">
      {/* Banner */}
      <div className="relative h-48 overflow-hidden bg-[var(--ink-3)] sm:h-64 lg:h-80 border-b border-[var(--hair)]">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`Ảnh bìa của ${name}`}
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-[var(--ink-3)] via-[var(--ink-2)] to-[var(--ink-4)] opacity-80"
          >
            <div className="absolute -right-16 -top-48 h-[600px] w-[900px] rotate-[-20deg] rounded-[50%] border-[40px] border-[var(--hair)]" />
            <div className="absolute -right-12 -top-32 h-[600px] w-[1000px] rotate-[-20deg] rounded-[50%] border border-[var(--hair-2)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/80 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-[1440px] gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[320px_minmax(0,1fr)] xl:px-12">
        <aside className="min-w-0 -mt-16 self-start lg:-mt-24">
          <div
            className="relative mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-[6px] border-[var(--ink)] bg-[var(--ink-3)] font-[family-name:var(--font-display)] text-5xl font-medium text-[var(--ivory)] shadow-xl sm:h-40 sm:w-40 lg:h-48 lg:w-48 lg:text-7xl"
            aria-label={`Avatar ${name}`}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={`Avatar ${name}`} fill unoptimized className="object-cover" />
            ) : (
              name.slice(0, 1).toUpperCase()
            )}
          </div>
          {sidebar}
        </aside>
        <section className="min-w-0 pt-0 lg:pt-8">{children}</section>
      </div>
    </div>
  );
}

export function ProfileTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Nội dung hồ sơ"
      className="flex gap-6 overflow-x-auto border-b border-[var(--hair)] sm:gap-8"
    >
      {tabs.map((tab, index) => (
        <button
          type="button"
          key={tab.id}
          id={`profile-tab-${tab.id}`}
          role="tab"
          tabIndex={value === tab.id ? 0 : -1}
          aria-controls={value === tab.id ? `profile-panel-${tab.id}` : undefined}
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            onChange(tabs[next].id);
            document.getElementById(`profile-tab-${tabs[next].id}`)?.focus();
          }}
          className={`shrink-0 border-b-2 pb-4 font-[family-name:var(--font-display)] text-base font-medium transition sm:text-xl cursor-pointer ${
            value === tab.id
              ? 'border-[var(--lumen)] text-[var(--ivory)]'
              : 'border-transparent text-[var(--ash)] hover:text-[var(--ivory)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
