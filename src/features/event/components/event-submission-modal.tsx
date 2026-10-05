'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  UploadCloud,
  Sparkles,
  ShieldAlert,
  FolderHeart,
  MonitorUp,
  Check,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { EventSubmissionDto } from '../types/event.types';
import { eventService } from '../services/event.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import type { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';

interface EventSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSuccess: (submission: EventSubmissionDto) => void;
  userName?: string;
  userId?: string;
  isCreator?: boolean;
  existingSubmission?: EventSubmissionDto | null;
}

type SubmissionMode = 'existing' | 'upload';

const ARTWORKS_PAGE_SIZE = 9;



export function EventSubmissionModal(props: EventSubmissionModalProps) {
  if (!props.isOpen) return null;
  return <EventSubmissionModalInner key={props.existingSubmission?.id || 'new'} {...props} />;
}

function EventSubmissionModalInner({
  onClose,
  eventId,
  eventTitle,
  onSuccess,
  isCreator = true,
  existingSubmission,
}: EventSubmissionModalProps) {
  const isEditing = Boolean(existingSubmission);
  const [mode, setMode] = useState<SubmissionMode>(
    existingSubmission ? (existingSubmission.artworkId ? 'existing' : 'upload') : 'existing'
  );

  // Existing artworks state
  const [myArtworks, setMyArtworks] = useState<ArtworkDto[]>([]);
  const [loadingArtworks, setLoadingArtworks] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkDto | null>(null);
  const [artworkSearch, setArtworkSearch] = useState('');
  const [artworksPage, setArtworksPage] = useState(1);

  // Local file upload state
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(
    existingSubmission?.artworkImageUrl || existingSubmission?.artworkThumbnailUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared form fields
  const [title, setTitle] = useState(existingSubmission?.title || '');
  const [description, setDescription] = useState(existingSubmission?.description || '');
  const [agreed, setAgreed] = useState(Boolean(existingSubmission));
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's existing artworks when modal is open
  useEffect(() => {
    async function loadArtworks() {
      setLoadingArtworks(true);
      try {
        const list = await creatorProfileService.getMyArtworks();
        setMyArtworks(list || []);
        if (existingSubmission?.artworkId && list && list.length > 0) {
          const matched = list.find((a) => a.id === existingSubmission.artworkId);
          if (matched) {
            setSelectedArtwork(matched);
            setMode('existing');
          }
        }
      } catch {
        setMyArtworks([]);
      } finally {
        setLoadingArtworks(false);
      }
    }

    void loadArtworks();
  }, [existingSubmission?.artworkId]);

  // Filter artworks by search query
  const filteredArtworks = myArtworks.filter((art) =>
    art.title.toLowerCase().includes(artworkSearch.trim().toLowerCase())
  );

  // Pagination calculations (9 items per page)
  const totalArtworkPages = Math.max(1, Math.ceil(filteredArtworks.length / ARTWORKS_PAGE_SIZE));
  const paginatedArtworks = filteredArtworks.slice(
    (artworksPage - 1) * ARTWORKS_PAGE_SIZE,
    artworksPage * ARTWORKS_PAGE_SIZE
  );

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image size must be less than 25MB.');
      return;
    }

    setLocalFile(file);
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);

    // Auto fill title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  // Handle selecting an existing artwork
  const handleSelectExisting = (art: ArtworkDto) => {
    setSelectedArtwork(art);
    setTitle(art.title);
    setDescription(art.description || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCreator) {
      toast.error('Only registered creators can participate in this contest. Please set up your creator profile.');
      return;
    }

    if (mode === 'existing') {
      if (!selectedArtwork) {
        toast.error('Please select an artwork from your collection.');
        return;
      }
    } else {
      if (!localFile && !localPreviewUrl) {
        toast.error('Please select an artwork file from your PC.');
        return;
      }
    }

    if (!title.trim()) {
      toast.error('Please enter an artwork title.');
      return;
    }

    if (!agreed) {
      toast.error('You must confirm that this artwork is your original creation.');
      return;
    }

    setSubmitting(true);
    try {
      let finalArtworkId: string | undefined = undefined;
      let finalImageUrl = '';

      if (mode === 'existing' && selectedArtwork) {
        finalArtworkId = selectedArtwork.id;
        finalImageUrl = selectedArtwork.imageUrl;
      } else if (localFile) {
        // Attempt to upload image to server
        try {
          finalImageUrl = await creatorProfileService.uploadArtworkImage(localFile);
        } catch {
          // Fallback to preview URL in development
          finalImageUrl = localPreviewUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200';
        }
      } else if (isEditing && existingSubmission) {
        finalArtworkId = existingSubmission.artworkId;
        finalImageUrl = existingSubmission.artworkImageUrl || '';
      }

      let resultSub: EventSubmissionDto;

      if (isEditing && existingSubmission) {
        // Cập nhật bài dự thi cũ (Update submission)
        resultSub = await eventService.updateSubmission(existingSubmission.id, {
          title: title.trim(),
          description: description.trim(),
          artworkId: mode === 'existing' ? finalArtworkId : undefined,
          imageUrl: mode === 'upload' && localFile ? finalImageUrl : undefined,
          thumbnailUrl: mode === 'upload' && localFile ? finalImageUrl : undefined,
          isAiGenerated: false,
        });

        toast.success('Your contest entry has been updated successfully!');
      } else {
        // Nộp bài dự thi mới (Submit new entry)
        resultSub = await eventService.submitArtwork(eventId, {
          eventId,
          artworkId: finalArtworkId,
          title: title.trim(),
          description: description.trim(),
          imageUrl: finalImageUrl,
          thumbnailUrl: finalImageUrl,
          isAiGenerated: false,
        });

        toast.success('Your artwork has been submitted successfully to the contest!');
      }

      onSuccess(resultSub);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit artwork. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#161926] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-periwinkle/20 text-brand-periwinkle">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-h1 text-lg font-bold text-white">
                {isEditing ? 'Edit Contest Entry' : 'Submit Contest Artwork'}
              </h3>
              <p className="text-xs text-[#8A8FA9] line-clamp-1">{eventTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 Choices Navigation Tabs */}
        <div className="flex border-b border-white/10 px-6 bg-white/[0.015]">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition cursor-pointer ${
              mode === 'existing'
                ? 'border-brand-periwinkle text-brand-periwinkle'
                : 'border-transparent text-[#8A8FA9] hover:text-white'
            }`}
          >
            <FolderHeart size={15} />
            <span>Select from My Artworks</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition cursor-pointer ${
              mode === 'upload'
                ? 'border-brand-periwinkle text-brand-periwinkle'
                : 'border-transparent text-[#8A8FA9] hover:text-white'
            }`}
          >
            <MonitorUp size={15} />
            <span>Upload from PC</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {!isCreator && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-300">Creator Profile Required</p>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Contest submissions are exclusively reserved for verified Creators. Please complete your creator profile to submit artwork.
                </p>
                <Link
                  href="/creator-setup"
                  className="inline-block text-xs font-bold text-brand-periwinkle underline mt-1 hover:text-white"
                >
                  Set up Creator Profile →
                </Link>
              </div>
            </div>
          )}

          {/* CHOICE 1: SELECT EXISTING ARTWORK */}
          {mode === 'existing' && (
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
                          onClick={() => handleSelectExisting(art)}
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

                  {/* Pagination Controls (Page Size = 9) */}
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
                    onClick={() => {
                      setSelectedArtwork(null);
                      setTitle('');
                      setDescription('');
                    }}
                    className="text-xs text-[#8A8FA9] hover:text-rose-400 transition ml-2 shrink-0 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CHOICE 2: UPLOAD FROM PC */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-2">
                  Select Artwork File from Your PC (Local Storage) <span className="text-rose-400">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />

                {localPreviewUrl ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black/40 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={localPreviewUrl} alt="Preview" className="size-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-brand-navy shadow-md cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocalFile(null);
                          setLocalPreviewUrl(null);
                        }}
                        className="rounded-xl bg-rose-500/80 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.02] hover:border-brand-periwinkle/60 hover:bg-white/[0.04] transition cursor-pointer"
                  >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mb-3">
                      <MonitorUp size={28} />
                    </div>
                    <p className="font-h1 text-sm font-bold text-white">Click or drag & drop artwork from your PC</p>
                    <p className="text-xs text-[#8A8FA9] mt-1">Supports PNG, JPG, JPEG, WEBP (Max 25MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submission Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
              Artwork Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Celestial Guardian of Neo-Saigon"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A7ACD9] mb-1.5">
              Artist Statement / Lore
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your creative process, technique, storytelling, or tools used..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
            />
          </div>

          {/* Originality Confirmation */}
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                By entering this contest, you certify that this artwork is 100% original work created by you, adhering strictly to contest rules and copyright regulations.
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="size-4 rounded border-white/20 bg-white/5 text-brand-periwinkle focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-white">
                I verify this is my original work and accept the official competition rules.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-[#A7ACD9] hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !isCreator}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-6 py-2.5 text-xs font-bold text-brand-navy shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="size-3.5 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
                  <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>{isEditing ? 'Update Entry' : 'Submit Artwork'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
