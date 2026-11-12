'use client';

import { useState } from 'react';
import { Crown, FolderHeart, Sparkles, Truck } from 'lucide-react';
import { Collections } from '@/features/marketplace';
import { MyCollectionScreen, PhysicalDeliveryManager } from '@/features/auction';
import { OwnedArtworksScreen } from '@/features/client';

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<'all_owned' | 'exclusive' | 'deliveries' | 'albums'>(
    'all_owned',
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Thanh chuyển đổi tab bộ sưu tập */}
      <div className="mb-6 flex border-b border-white/10 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all_owned')}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition shrink-0 ${
            activeTab === 'all_owned'
              ? 'border-brand-periwinkle text-brand-periwinkle'
              : 'border-transparent text-outline hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          Tất cả tác phẩm sở hữu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exclusive')}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition shrink-0 ${
            activeTab === 'exclusive'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-outline hover:text-white'
          }`}
        >
          <Crown size={16} className={activeTab === 'exclusive' ? 'text-amber-400' : ''} />
          Bộ sưu tập tranh đấu giá
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-bold transition ${
            activeTab === 'deliveries'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-outline hover:text-white'
          }`}
        >
          <Truck size={16} className={activeTab === 'deliveries' ? 'text-emerald-400' : ''} />
          Đơn giao tranh vật lý
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('albums')}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition shrink-0 ${
            activeTab === 'albums'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-outline hover:text-white'
          }`}
        >
          <FolderHeart size={16} />
          Album &amp; Yêu thích
        </button>
      </div>

      {activeTab === 'all_owned' && <OwnedArtworksScreen />}
      {activeTab === 'exclusive' && <MyCollectionScreen />}
      {activeTab === 'deliveries' && <PhysicalDeliveryManager />}
      {activeTab === 'albums' && <Collections />}
    </div>
  );
}
