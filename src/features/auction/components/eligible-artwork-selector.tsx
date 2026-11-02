'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, CircleAlert, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { auctionService, auctionError } from '../services/auction.service';
import type { EligibleArtworkDto } from '../types/auction.types';

export interface EligibleArtworkSelectorProps {
  selectedArtworkId: string;
  onSelect: (artworkId: string, artwork?: EligibleArtworkDto) => void;
  reloadTrigger?: number;
}

export function EligibleArtworkSelector({ selectedArtworkId, onSelect, reloadTrigger }: EligibleArtworkSelectorProps) {
  const [artworks, setArtworks] = useState<EligibleArtworkDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const fetchArtworks = useCallback(async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await auctionService.getEligibleArtworks(cursor, 10);
      if (cursor) {
        setArtworks((prev) => [...prev, ...res.items]);
      } else {
        setArtworks(res.items);
      }
      setNextCursor(res.nextCursor);
    } catch (err: unknown) {
      setError(auctionError(err) || 'Không tải được danh sách tranh đủ điều kiện.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchRef = useRef(fetchArtworks);
  useEffect(() => {
    fetchRef.current = fetchArtworks;
  });

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await fetchRef.current();
    })();
  }, [reloadTrigger]);

  const selectedArtwork = artworks.find((a) => a.artworkId === selectedArtworkId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-on-surface-variant">
          Chọn tác phẩm tranh đưa lên đấu giá <span className="text-red-400">*</span>
        </label>
        <button
          type="button"
          onClick={() => fetchArtworks()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[11px] text-outline hover:text-brand-periwinkle"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Tải lại danh sách
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          <CircleAlert size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !artworks.length ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-brand-navy/60 py-6 text-xs text-outline">
          <RefreshCw size={16} className="mr-2 animate-spin text-brand-periwinkle" />
          Đang tải danh sách tranh của bạn...
        </div>
      ) : artworks.length === 0 ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          Bạn chưa có tác phẩm nào đủ điều kiện để tạo phiên đấu giá (hoặc các tác phẩm hiện tại đã thuộc một phiên đang hoạt động).
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-3 text-left focus:border-brand-periwinkle focus:outline-none focus:ring-2 focus:ring-brand-periwinkle/30"
          >
            {selectedArtwork ? (
              <div className="flex items-center gap-3">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-black/40 border border-white/10">
                  {selectedArtwork.thumbnailUrl || selectedArtwork.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedArtwork.thumbnailUrl || selectedArtwork.imageUrl}
                      alt={selectedArtwork.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-outline">
                      <ImageIcon size={16} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-h1 text-sm font-bold text-on-surface line-clamp-1">{selectedArtwork.title}</p>
                  <p className="text-[11px] text-outline">ID: {selectedArtwork.artworkId}</p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-outline">-- Bấm để chọn tác phẩm từ thư viện của bạn --</span>
            )}
            <ChevronDown size={18} className={`shrink-0 text-outline transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div
              role="listbox"
              tabIndex={-1}
              className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/15 bg-brand-navy p-2 shadow-2xl backdrop-blur-xl"
            >
              {artworks.map((item) => {
                const isSelected = item.artworkId === selectedArtworkId;
                return (
                  <div
                    key={item.artworkId}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => {
                      onSelect(item.artworkId, item);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(item.artworkId, item);
                        setIsOpen(false);
                      }
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition focus:outline-none focus:bg-white/10 ${
                      isSelected ? 'bg-brand-periwinkle/20 border border-brand-periwinkle/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-black/40 border border-white/10">
                        {item.thumbnailUrl || item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnailUrl || item.imageUrl} alt={item.title} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-outline">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-h1 text-sm font-bold text-on-surface">{item.title}</p>
                        <p className="text-[11px] text-outline">Phong cách: {item.style || 'Kỹ thuật số'}</p>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-brand-periwinkle" />}
                  </div>
                );
              })}

              {nextCursor && (
                <div className="pt-2 text-center border-t border-white/10 mt-1">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchArtworks(nextCursor);
                    }}
                    className="text-xs font-semibold text-brand-periwinkle hover:underline disabled:opacity-50"
                  >
                    {loadingMore ? 'Đang tải...' : 'Tải thêm tranh...'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
