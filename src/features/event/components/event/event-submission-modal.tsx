'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { UploadCloud, ShieldAlert, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { EventSubmissionDto } from '@/features/event/types/event.types';
import { eventSubmissionService } from '@/features/event/services/event-submission.service';
import { juryService } from '@/features/event/services/jury.service';
import { creatorProfileService } from '@/features/creator-studio/services/creator-profile.service';
import type { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';

import { SubmissionModalJuryNotice } from './submission-modal/submission-modal-jury-notice';
import { SubmissionModalHeader } from './submission-modal/submission-modal-header';
import { SubmissionModalNav, SubmissionMode } from './submission-modal/submission-modal-nav';
import { SubmissionModalPortfolioPicker } from './submission-modal/submission-modal-portfolio-picker';
import { SubmissionModalFileUploader } from './submission-modal/submission-modal-file-uploader';

interface EventSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSuccess: (submission: EventSubmissionDto) => void;
  userName?: string;
  userId?: string;
  isCreator?: boolean;
  isJuryMember?: boolean;
  existingSubmission?: EventSubmissionDto | null;
}

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
  userName,
  isCreator = true,
  isJuryMember,
  userId,
  existingSubmission,
}: EventSubmissionModalProps) {
  const [isJury, setIsJury] = useState(isJuryMember || false);
  const isEditing = Boolean(existingSubmission);
  const [mode, setMode] = useState<SubmissionMode>(
    existingSubmission ? (existingSubmission.artworkId ? 'existing' : 'upload') : 'existing'
  );

  useEffect(() => {
    async function checkJuryStatus() {
      if (isJuryMember !== undefined) {
        setIsJury(isJuryMember);
        return;
      }
      try {
        const juries = await juryService.getEventJuries(eventId);
        if (juries && juries.length > 0) {
          const profile = await creatorProfileService.getMyProfile().catch(() => null);
          const myCreatorId = profile?.id?.toLowerCase();
          const myUserId = userId?.toLowerCase();
          const myName = (userName || '').toLowerCase().trim();

          const match = juries.some((j) => {
            const jCreatorId = j.creatorId?.toLowerCase();
            const jId = j.id?.toLowerCase();
            const jDisplayName = (j.creatorDisplayName || '').toLowerCase().trim();
            const jName = (j.creatorName || '').toLowerCase().trim();

            if (myCreatorId && jCreatorId === myCreatorId) return true;
            if (myUserId && (jCreatorId === myUserId || jId === myUserId)) return true;
            if (myName && ((jDisplayName && jDisplayName === myName) || (jName && jName === myName))) return true;

            return false;
          });
          if (match) setIsJury(true);
        }
      } catch {
        // ignore
      }
    }
    void checkJuryStatus();
  }, [eventId, isJuryMember, userId, userName]);

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image size must be less than 25MB.');
      return;
    }

    setLocalFile(file);
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);

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
        try {
          finalImageUrl = await creatorProfileService.uploadArtworkImage(localFile);
        } catch {
          finalImageUrl = localPreviewUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200';
        }
      } else if (isEditing && existingSubmission) {
        finalArtworkId = existingSubmission.artworkId;
        finalImageUrl = existingSubmission.artworkImageUrl || '';
      }

      let resultSub: EventSubmissionDto;

      if (isEditing && existingSubmission) {
        resultSub = await eventSubmissionService.updateSubmission(existingSubmission.id, {
          title: title.trim(),
          description: description.trim(),
          artworkId: mode === 'existing' ? finalArtworkId : undefined,
          imageUrl: mode === 'upload' && localFile ? finalImageUrl : undefined,
          thumbnailUrl: mode === 'upload' && localFile ? finalImageUrl : undefined,
          isAiGenerated: false,
        });

        toast.success('Your contest entry has been updated successfully!');
      } else {
        resultSub = await eventSubmissionService.submitArtwork(eventId, {
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

  if (isJury) {
    return <SubmissionModalJuryNotice onClose={onClose} eventTitle={eventTitle} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#161926] shadow-2xl">
        {/* Header */}
        <SubmissionModalHeader isEditing={isEditing} eventTitle={eventTitle} onClose={onClose} />

        {/* 2 Choices Navigation Tabs */}
        <SubmissionModalNav mode={mode} setMode={setMode} />

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
            <SubmissionModalPortfolioPicker
              filteredArtworks={filteredArtworks}
              artworkSearch={artworkSearch}
              setArtworkSearch={setArtworkSearch}
              loadingArtworks={loadingArtworks}
              selectedArtwork={selectedArtwork}
              onSelectArtwork={handleSelectExisting}
              onDeselectArtwork={() => {
                setSelectedArtwork(null);
                setTitle('');
                setDescription('');
              }}
              artworksPage={artworksPage}
              setArtworksPage={setArtworksPage}
              totalArtworkPages={totalArtworkPages}
              paginatedArtworks={paginatedArtworks}
            />
          )}

          {/* CHOICE 2: UPLOAD FROM PC */}
          {mode === 'upload' && (
            <SubmissionModalFileUploader
              localPreviewUrl={localPreviewUrl}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onRemoveFile={() => {
                setLocalFile(null);
                setLocalPreviewUrl(null);
              }}
            />
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
