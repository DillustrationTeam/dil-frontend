'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { marketplaceService, MarketplaceArtwork } from '@/features/marketplace/services/marketplace.service';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';

export default function ArtworkDetailPage() {
  const params = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<MarketplaceArtwork | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorAcceptingOrders, setCreatorAcceptingOrders] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        const data = await marketplaceService.getArtworkById(params.id);
        setArtwork(data);
        marketplaceService.getCreatorById(data.creatorProfileId).then(profile => {
          setCreatorName(profile.displayName);
          setCreatorAcceptingOrders(profile.isAcceptingOrders);
        }).catch(() => {});
      } catch (error) {
        console.error('Failed to load artwork', error);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      loadArtwork();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-[#C7C5CF]">
        Loading artwork details...
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-[#C7C5CF]">
        Artwork not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-[#A7ACD9]">
        <Link href="/" className="hover:underline">Marketplace</Link>
        <span>/</span>
        <span className="text-[#C7C5CF]">Artwork details</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#1b1d29]">
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Featured artwork</p>
            <h1 className="mt-3 font-h1 text-3xl font-bold text-white">{artwork.title}</h1>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#C7C5CF]">Creator</p>
                <p className="text-lg font-semibold text-white">{creatorName ?? artwork.creatorName ?? 'Verified Creator'}</p>
              </div>
              <span className="rounded-full bg-[#A7ACD9]/15 px-3 py-1 text-xs uppercase tracking-wider text-[#A7ACD9]">
                {artwork.moderationStatus}
              </span>
            </div>
          </div>

          {artwork.description && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-[#C7C5CF]">Description</p>
              <p className="mt-2 text-white">{artwork.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {artwork.tags?.length ? (
              artwork.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-[#A7ACD9]/10 px-3 py-1 text-xs text-[#A7ACD9]">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-[#C7C5CF]">No tags available</span>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" disabled={creatorAcceptingOrders === false} onClick={() => setIsCommissionOpen(true)} className="flex-1 rounded-xl bg-[#A7ACD9] px-5 py-3 text-center font-bold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-50">
              {creatorAcceptingOrders === false ? 'Creator đang tạm ngưng nhận đơn' : 'Commission this artist'}
            </button>
            <button className="rounded-xl border border-white/10 px-5 py-3 font-medium text-white">
              Save
            </button>
          </div>
        </div>
      </div>
      {isCommissionOpen && <CreateCommissionModal creatorId={artwork.creatorProfileId} creatorName={creatorName ?? artwork.creatorName ?? 'Creator'} onClose={() => setIsCommissionOpen(false)} />}
    </div>
  );
}
