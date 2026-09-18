'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { marketplaceService, MarketplaceArtwork } from '@/features/marketplace/services/marketplace.service';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [artworks, setArtworks] = useState<MarketplaceArtwork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const FILTERS = ['All', 'Cyberpunk', 'Anime', 'Vtuber', 'Dark Fantasy', 'Concept Art', 'Chibi', 'Sci-Fi'];

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const results = await marketplaceService.getArtworks();
        setArtworks(results);
      } catch {
        setArtworks([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = artworks.filter((a) => {
    const matchQuery =
      !query ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      (a.creatorName ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (a.tags ?? []).some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchFilter =
      activeFilter === 'All' ||
      (a.tags ?? []).some((t) => t.toLowerCase() === activeFilter.toLowerCase());
    return matchQuery && matchFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Search Header */}
      <div className="mb-10 space-y-6">
        <div>
          <h1 className="font-h1 text-3xl font-bold text-white">Search Artworks</h1>
          <p className="text-[#919099] text-sm mt-1">Discover creators and curated collections</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#919099] text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, artist, or style..."
            className="w-full h-14 pl-14 pr-6 bg-[#1b1b1e] border border-white/10 rounded-2xl text-[#e4e1e5] placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#A7ACD9] focus:border-[#A7ACD9] transition-all text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#919099] hover:text-white"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'bg-[#A7ACD9] text-[#1F2335] font-semibold'
                  : 'border border-white/10 text-[#919099] hover:border-[#A7ACD9] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[24px] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          <p className="text-xs text-[#919099] mb-6">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
            {query && <span> for &ldquo;<span className="text-[#A7ACD9]">{query}</span>&rdquo;</span>}
          </p>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.id}`}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#1b1d29] hover:border-[#A7ACD9]/40 transition-all"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white leading-tight">{artwork.title}</h3>
                    <span className="text-[10px] text-[#A7ACD9] bg-[#A7ACD9]/10 px-2 py-0.5 rounded-full whitespace-nowrap">New</span>
                  </div>
                  <p className="text-xs text-[#C7C5CF]">{artwork.creatorName ?? 'Verified creator'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(artwork.tags ?? []).slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#C7C5CF]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl text-[#919099]">search_off</span>
          </div>
          <p className="text-[#e4e1e5] font-semibold">No results found</p>
          <p className="text-[#919099] text-sm max-w-xs mx-auto">
            Try adjusting your search query or filter to find what you&apos;re looking for.
          </p>
          <button
            onClick={() => { setQuery(''); setActiveFilter('All'); }}
            className="mt-4 px-6 py-2 border border-[#A7ACD9]/30 text-[#A7ACD9] rounded-full text-sm hover:border-[#A7ACD9] transition-all"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-14 bg-white/5 rounded-2xl animate-pulse max-w-2xl mb-10" />
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[24px] bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
