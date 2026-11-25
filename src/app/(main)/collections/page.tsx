'use client';

import { useState } from 'react';
import { Crown, FolderHeart, Sparkles } from 'lucide-react';
import { Collections } from '@/features/marketplace';
import { MyCollectionScreen } from '@/features/auction';
import { OwnedArtworksScreen } from '@/features/client';

type TabKey = 'all_owned' | 'exclusive' | 'albums';

const TABS: { key: TabKey; label: string; icon: typeof Sparkles; activeClass: string; iconClass: string }[] = [
  {
    key: 'all_owned',
    label: 'Tất cả tác phẩm sở hữu',
    icon: Sparkles,
    activeClass: 'border-brand-periwinkle text-brand-periwinkle',
    iconClass: '',
  },
  {
    key: 'exclusive',
    label: 'Bộ sưu tập tranh đấu giá',
    icon: Crown,
    activeClass: 'border-[#8A6A1F]/30 text-[#8A6A1F]',
    iconClass: 'text-[#8A6A1F]',
  },
  {
    key: 'albums',
    label: 'Album & Yêu thích',
    icon: FolderHeart,
    activeClass: 'border-[#5F3F86]/30 text-[#5F3F86]',
    iconClass: '',
  },
];

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all_owned');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Thanh chuyển đổi tab bộ sưu tập */}
      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-[#221E1A]/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-bold transition ${
                isActive ? tab.activeClass : 'border-transparent text-outline hover:text-[#241F1A]'
              }`}
            >
              <Icon size={16} className={isActive ? tab.iconClass : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'all_owned' && <OwnedArtworksScreen />}
      {activeTab === 'exclusive' && <MyCollectionScreen />}
      {activeTab === 'albums' && <Collections />}
    </div>
  );
}
