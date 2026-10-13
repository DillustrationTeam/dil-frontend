'use client';

import React from 'react';
import { Search, Image as ImageIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';

interface SubmissionModalPortfolioPickerProps {
  filteredArtworks: ArtworkDto[];
  artworkSearch: string;
  setArtworkSearch: (q: string) => void;
  loadingArtworks: boolean;
  selectedArtwork: ArtworkDto | null;
  onSelectArtwork: (art: ArtworkDto) => void;
  onDeselectArtwork: () => void;
  artworksPage: number;
  setArtworksPage: React.Dispatch<React.SetStateAction<number>>;
  totalArtworkPages: number;
  paginatedArtworks: ArtworkDto[];
}

export function SubmissionModalPortfolioPicker({
  filteredArtworks,
  artworkSearch,
  setArtworkSearch,
  loadingArtworks,
  selectedArtwork,
  onSelectArtwork,
  onDeselectArtwork,
  artworksPage,
  setArtworksPage,
  totalArtworkPages,
  paginatedArtworks,
}: SubmissionModalPortfolioPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#A7ACD9]">
          Select an Artwork from Your Portfolio <span className="text-rose-400">*</span>
        </label>
        {filteredArtworks.length > 0 && (
          <span className="text-[11px] text-[#8A8FA9]">
            {filteredArtworks.length} {filteredArtworks.length === 1 ? 'artwork' : 'artworks'} found
          </span>
        )}
      </div>

      {/* Search filter for fast navigation */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8FA9]" />
        <input
          type="text"
          value={artworkSearch}
          onChange={(e) => {
            setArtworkSearch(e.target.value);
            setArtworksPage(1);
          }}
          placeholder="Search artworks by title..."
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
        />
      </div>

      {loadingArtworks ? (
        <div className="flex items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="size-6 animate-spin rounded-full border-2 border-brand-periwinkle border-t-transparent" />
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center bg-white/[0.01]">
          <ImageIcon size={32} className="mx-auto text-outline/50 mb-2" />
          <p className="text-xs text-[#A7ACD9] mb-3">No matching artworks found.</p>
          <button
            type="button"
            onClick={() => {
              setArtworkSearch('');
              setArtworksPage(1);
            }}
            className="text-xs font-semibold text-brand-periwinkle hover:underline cursor-pointer"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <>
          {/* Grid: 3 columns x 3 rows = 9 artworks per page */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paginatedArtworks.map((art) => {
              const isSelected = selectedArtwork?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => onSelectArtwork(art)}
                  className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-periwinkle shadow-[0_0_15px_rgba(167,172,217,0.4)] scale-[0.98]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.imageUrl} alt={art.title} className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute bottom-2 left-2 right-2 text-left">
                    <p className="font-h1 text-xs font-bold text-white line-clamp-1">{art.title}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 size-6 rounded-full bg-brand-periwinkle text-brand-navy flex items-center justify-center shadow-md">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalArtworkPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 mt-2">
              <span className="text-xs text-[#8A8FA9]">
                Page {artworksPage} of {totalArtworkPages} ({filteredArtworks.length} artworks, 9 per page)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={artworksPage <= 1}
                  onClick={() => setArtworksPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalArtworkPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setArtworksPage(p)}
                      className={`size-6 rounded-md text-xs font-semibold transition cursor-pointer ${
                        artworksPage === p
                          ? 'bg-brand-periwinkle text-brand-navy'
                          : 'text-[#8A8FA9] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={artworksPage >= totalArtworkPages}
                  onClick={() => setArtworksPage((p) => Math.min(totalArtworkPages, p + 1))}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Artwork Quick Indicator */}
      {selectedArtwork && (
        <div className="flex items-center justify-between rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-2 text-xs text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedArtwork.imageUrl}
              alt={selectedArtwork.title}
              className="size-8 rounded-lg object-cover border border-white/15 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-brand-periwinkle block">Selected Artwork</span>
              <p className="font-semibold truncate">{selectedArtwork.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeselectArtwork}
            className="text-xs text-[#8A8FA9] hover:text-rose-400 transition ml-2 shrink-0 cursor-pointer"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}
