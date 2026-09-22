'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Maximize2,
  Tag,
  Bot,
  User,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import { ArtworkInspectionDetailDto } from '@/features/admin/types/moderation.types';

interface ArtworkPreviewCardProps {
  artwork: ArtworkInspectionDetailDto;
}

export function ArtworkPreviewCard({ artwork }: ArtworkPreviewCardProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  const formatShortId = (id: string) => {
    if (!id) return '#ART-0000';
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    return `#ART-${lastPart.substring(lastPart.length - 4).toUpperCase()}`;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '18.4MB';
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  return (
    <div className="glass-container bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 space-y-5">
      {/* Title & Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-[#8A8FA9] uppercase font-bold tracking-wider block">
            Detailed Inspection
          </span>
          <h3 className="font-h1 font-bold text-white text-base flex items-center gap-2">
            <span>Artwork Inspection</span>
            <span className="font-mono text-[#C5C9F8]">
              {formatShortId(artwork.artworkId)}
            </span>
          </h3>
        </div>

        {artwork.isAiGenerated && (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
            <Bot className="w-3 h-3" />
            <span>AI Verified</span>
          </span>
        )}
      </div>

      {/* Main Image Container */}
      <div className="w-full h-72 sm:h-80 bg-black/60 rounded-2xl border border-white/10 relative overflow-hidden group">
        {artwork.imageUrl ? (
          <>
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            {/* Hover overlay with zoom button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md text-white font-bold text-xs flex items-center gap-2 border border-white/20 hover:bg-black/90 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>View Full Resolution</span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#C5C9F8] space-y-2">
            <Sparkles className="w-8 h-8 opacity-50" />
            <span className="text-xs">No image preview available</span>
          </div>
        )}

        {/* Resolution & File Size overlay badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-[10px] text-white font-mono border border-white/15 flex items-center gap-2 shadow-lg">
          <span>Res: {artwork.resolution || '3840x2160'}</span>
          <span>•</span>
          <span>Size: {formatFileSize(artwork.fileSizeBytes)}</span>
        </div>
      </div>

      {/* Artwork Meta: Title & Description */}
      <div className="space-y-1">
        <h4 className="font-h1 font-bold text-white text-sm">{artwork.title}</h4>
        {artwork.description && (
          <p className="text-xs text-[#8A8FA9] leading-relaxed line-clamp-2">
            {artwork.description}
          </p>
        )}
      </div>

      {/* Creator Profile snippet */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 overflow-hidden relative shrink-0 flex items-center justify-center text-red-400">
            {artwork.creatorAvatarUrl ? (
              <Image
                src={artwork.creatorAvatarUrl}
                alt={artwork.creatorName}
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="font-bold text-white block font-body">
              {artwork.creatorName}
            </span>
            <span className="text-[10px] text-[#8A8FA9] block">
              @{artwork.creatorUsername || 'creator'}
            </span>
          </div>
        </div>

        <div className="text-right text-[10px] text-[#8A8FA9]">
          <span className="flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />
            <span>
              {artwork.createdAt
                ? new Date(artwork.createdAt).toLocaleDateString()
                : 'Recent'}
            </span>
          </span>
          {artwork.style && (
            <span className="font-mono text-[#C5C9F8] block mt-0.5">
              {artwork.style}
            </span>
          )}
        </div>
      </div>

      {/* AI Auto-Extracted Tag Pills */}
      <div className="space-y-2 pt-1 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8A8FA9] font-bold uppercase tracking-wider">
          <Tag className="w-3 h-3" />
          <span>AI Auto-Extracted Tag Pills</span>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          {artwork.tags && artwork.tags.length > 0 ? (
            artwork.tags.map((tag) => (
              <span
                key={tag.tagId || tag.name}
                className="px-3 py-1 rounded-full bg-[#C5C9F8]/15 text-[#C5C9F8] font-bold border border-[#C5C9F8]/20 hover:bg-[#C5C9F8]/25 transition-colors"
              >
                #{tag.name}
              </span>
            ))
          ) : (
            <>
              <span className="px-3 py-1 rounded-full bg-[#C5C9F8]/15 text-[#C5C9F8] font-bold">
                #Cyberpunk
              </span>
              <span className="px-3 py-1 rounded-full bg-[#C5C9F8]/15 text-[#C5C9F8] font-bold">
                #Anime
              </span>
              <span className="px-3 py-1 rounded-full bg-[#C5C9F8]/15 text-[#C5C9F8] font-bold">
                #DigitalPainting
              </span>
            </>
          )}

          {/* AI generated status pill */}
          <span
            className={`px-3 py-1 rounded-full font-bold border text-[10px] flex items-center gap-1 ${
              artwork.isAiGenerated
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Tag.IsAiGenerated: {artwork.isAiGenerated ? 'True' : 'False'}</span>
          </span>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="max-w-5xl max-h-[85vh] w-full h-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {artwork.imageUrl && (
              <Image
                src={artwork.imageUrl}
                alt={artwork.title}
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
