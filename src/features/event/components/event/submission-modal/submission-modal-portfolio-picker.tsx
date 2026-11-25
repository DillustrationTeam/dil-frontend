'use client';

import React from 'react';
import { Search, Image as ImageIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#B24A26]">
          {isVie ? 'Chọn một tác phẩm từ bộ sưu tập của bạn' : 'Select an Artwork from Your Portfolio'}{' '}
          <span className="text-[#A8321C]">*</span>
        </label>
        {filteredArtworks.length > 0 && (
          <span className="text-[11px] text-[#6E6459]">
            {filteredArtworks.length} {isVie ? 'tác phẩm' : (filteredArtworks.length === 1 ? 'artwork' : 'artworks')} {isVie ? 'được tìm thấy' : 'found'}
          </span>
        )}
      </div>

      {/* Search filter for fast navigation */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6459]" />
        <input
          type="text"
          value={artworkSearch}
          onChange={(e) => {
            setArtworkSearch(e.target.value);
            setArtworksPage(1);
          }}
          placeholder={isVie ? 'Tìm kiếm tác phẩm theo tiêu đề...' : 'Search artworks by title...'}
          className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] pl-9 pr-3 py-2 text-xs text-[#241F1A] placeholder-[#6E6459] focus:border-brand-periwinkle focus:outline-none"
        />
      </div>

      {loadingArtworks ? (
        <div className="flex items-center justify-center p-12 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6]">
          <div className="size-6 animate-spin rounded-full border-2 border-brand-periwinkle border-t-transparent" />
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#221E1A]/10 p-8 text-center bg-[#FFFCF6]">
          <ImageIcon size={32} className="mx-auto text-outline/50 mb-2" />
          <p className="text-xs text-[#B24A26] mb-3">
            {isVie ? 'Không tìm thấy tác phẩm nào phù hợp.' : 'No matching artworks found.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setArtworkSearch('');
              setArtworksPage(1);
            }}
            className="text-xs font-semibold text-brand-periwinkle hover:underline cursor-pointer"
          >
            {isVie ? 'Xóa bộ lọc tìm kiếm' : 'Clear search filter'}
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
                      : 'border-[#221E1A]/10 hover:border-[#221E1A]/20'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.imageUrl} alt={art.title} className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F7F2E9]/85 via-[#F7F2E9]/85 to-transparent" />

                  <div className="absolute bottom-2 left-2 right-2 text-left">
                    <p className="font-h1 text-xs font-bold text-[#241F1A] line-clamp-1">{art.title}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 size-6 rounded-full bg-brand-periwinkle text-[#FFFCF6] flex items-center justify-center shadow-md">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalArtworkPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#221E1A]/10 mt-2">
              <span className="text-xs text-[#6E6459]">
                {isVie
                  ? `Trang ${artworksPage} / ${totalArtworkPages} (${filteredArtworks.length} tác phẩm, 9 mỗi trang)`
                  : `Page ${artworksPage} of ${totalArtworkPages} (${filteredArtworks.length} artworks, 9 per page)`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={artworksPage <= 1}
                  onClick={() => setArtworksPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-medium text-[#241F1A] hover:bg-[#F0E7D8] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>{isVie ? 'Trước' : 'Prev'}</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalArtworkPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setArtworksPage(p)}
                      className={`size-6 rounded-md text-xs font-semibold transition cursor-pointer ${
                        artworksPage === p
                          ? 'bg-brand-periwinkle text-[#FFFCF6]'
                          : 'text-[#6E6459] hover:bg-[#F0E7D8] hover:text-[#241F1A]'
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
                  className="flex items-center gap-1 rounded-lg border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 text-xs font-medium text-[#241F1A] hover:bg-[#F0E7D8] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <span>{isVie ? 'Tiếp' : 'Next'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Artwork Quick Indicator */}
      {selectedArtwork && (
        <div className="flex items-center justify-between rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-2 text-xs text-[#241F1A]">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedArtwork.imageUrl}
              alt={selectedArtwork.title}
              className="size-8 rounded-lg object-cover border border-[#221E1A]/10 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-brand-periwinkle block">
                {isVie ? 'Tác phẩm đã chọn' : 'Selected Artwork'}
              </span>
              <p className="font-semibold truncate">{selectedArtwork.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeselectArtwork}
            className="text-xs text-[#6E6459] hover:text-[#A8321C] transition ml-2 shrink-0 cursor-pointer"
          >
            {isVie ? 'Bỏ chọn' : 'Deselect'}
          </button>
        </div>
      )}
    </div>
  );
}
