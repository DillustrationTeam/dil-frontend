'use client';

import React from 'react';
import Link from 'next/link';
import {
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Palette,
  Sparkles,
  ExternalLink,
  Share2,
  Edit3,
  UploadCloud,
  FolderHeart,
  MonitorUp,
  Clock,
  Trash2,
  Maximize2,
} from 'lucide-react';
import type { EventSubmissionDto } from '@/features/event/types/event.types';
import type { JuryMemberInfo } from '@/features/event/types/jury.types';
import type { TabType } from './event-detail-tab-nav';

interface EventTabMySubmissionProps {
  effectiveUserId: string | null;
  isJuryMember: boolean;
  currentJury: JuryMemberInfo | null;
  isCreator: boolean;
  mySubmission: EventSubmissionDto | null;
  eventId: string;
  eventTitle: string;
  isSubmissionOpen: boolean;
  setActiveTab: (tab: TabType) => void;
  onOpenSubmitModal: () => void;
  onCopyLink: () => void;
  currentUserFullName?: string | null;
  onWithdrawSubmission?: (submissionId: string) => void;
  isAnnounced?: boolean;
}

export function EventTabMySubmission({
  effectiveUserId,
  isJuryMember,
  currentJury,
  isCreator,
  mySubmission,
  eventId,
  isSubmissionOpen,
  setActiveTab,
  onOpenSubmitModal,
  onCopyLink,
  currentUserFullName,
  onWithdrawSubmission,
  isAnnounced = false,
}: EventTabMySubmissionProps) {
  return (
    <div className="space-y-6">
      {!effectiveUserId ? (
        // Case: Not logged in
        <div className="rounded-3xl border border-white/10 bg-[#161926] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h3 className="font-h1 text-xl font-bold text-white">Sign In to View Your Submission</h3>
          <p className="mt-2 text-sm text-[#8A8FA9] leading-relaxed max-w-md mx-auto">
            Connect your Dillustration account to submit your contest entry, check real-time community votes, and track your standing on the Wall of Fame.
          </p>
          <Link
            href={`/login?redirect=/events/${eventId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-periwinkle px-8 py-3 text-xs font-bold text-brand-navy shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <LogIn size={15} />
            <span>Sign In Now</span>
          </Link>
        </div>
      ) : isJuryMember ? (
        // Case: User is a Jury / Head Jury member for this event
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-[#161926] to-[#161926] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 mb-3">
            <ShieldCheck size={13} />
            <span>Jury Member Restricted</span>
          </div>
          <h3 className="font-h1 text-xl sm:text-2xl font-bold text-white">
            Jury Members Are Not Eligible to Enter
          </h3>
          <p className="mt-3 text-sm text-[#A7ACD9] leading-relaxed max-w-md mx-auto">
            You are currently serving as a <strong className="text-white">{currentJury?.isHeadJury ? 'Head Jury Member' : 'Jury Member'}</strong> for this competition. Per Dillustration contest policies, evaluation panel members cannot enter submissions or vote to ensure absolute impartiality.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/events/${eventId}/jury`}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-7 py-3.5 text-xs font-bold text-white shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Open Jury Workspace</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('artworks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-semibold text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <span>Browse Contest Entries</span>
            </button>
          </div>
        </div>
      ) : !isCreator && !mySubmission ? (
        // Case: Logged in but NOT a Creator
        <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[#161926] to-[#161926] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 mx-auto mb-4">
            <Palette size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 mb-3">
            <Sparkles size={13} />
            <span>Creator Exclusive</span>
          </div>
          <h3 className="font-h1 text-xl sm:text-2xl font-bold text-white">
            Only Creators Can Participate in Contests
          </h3>
          <p className="mt-3 text-sm text-[#A7ACD9] leading-relaxed max-w-md mx-auto">
            Event submissions are reserved exclusively for registered Creators on Dillustration. Complete your Creator Profile to showcase your portfolio, submit artworks, and compete for community awards.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/creator-setup"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-xs font-bold text-brand-navy shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Palette size={16} />
              <span>Become a Creator</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('artworks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-semibold text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <span>Browse & Vote Artworks</span>
            </button>
          </div>
        </div>
      ) : mySubmission ? (
        // Case: User has submitted an artwork
        <div className="rounded-3xl border border-brand-periwinkle/30 bg-gradient-to-br from-brand-periwinkle/10 via-[#161926] to-[#161926] p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Artwork Preview */}
            <div className="w-full lg:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-inner relative group">
              <Link
                href={mySubmission.artworkId ? `/artworks/${mySubmission.artworkId}` : '#'}
                className="size-full block cursor-pointer"
              >
                {mySubmission.artworkImageUrl || mySubmission.artworkThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mySubmission.artworkImageUrl || mySubmission.artworkThumbnailUrl || ''}
                    alt={mySubmission.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-outline">
                    Preview not available
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-white backdrop-blur-[2px]">
                  <ExternalLink size={15} />
                  <span>View Artwork Page</span>
                </div>
              </Link>

              {/* View Full Resolution icon button in top-right corner */}
              {mySubmission.artworkImageUrl && (
                <a
                  href={mySubmission.artworkImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-xl bg-black/60 border border-white/20 text-white shadow-lg backdrop-blur-md hover:bg-black/90 hover:scale-105 active:scale-95 transition cursor-pointer"
                  title="View Full Resolution"
                >
                  <Maximize2 size={16} />
                </a>
              )}
            </div>

            {/* Right: Submission Info & Performance */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-300">
                    Active Entry
                  </span>
                  {mySubmission.aiScanPassed && (
                    <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-1 text-xs font-bold text-brand-periwinkle">
                      Originality Verified
                    </span>
                  )}
                </div>

                <Link
                  href={mySubmission.artworkId ? `/artworks/${mySubmission.artworkId}` : '#'}
                  className="block group/title cursor-pointer"
                >
                  <h2 className="font-h1 text-2xl sm:text-3xl font-extrabold text-white group-hover/title:text-brand-periwinkle group-hover/title:underline transition">
                    {mySubmission.title}
                  </h2>
                </Link>
                <p className="mt-1 text-xs text-[#8A8FA9]">
                  Submitted by @{mySubmission.submitterName || currentUserFullName || 'You'} •{' '}
                  {new Date(mySubmission.submittedAt).toLocaleDateString('en-US')}
                </p>
              </div>

              {mySubmission.description && (
                <p className="text-sm text-[#A7ACD9] leading-relaxed whitespace-pre-line bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  {mySubmission.description}
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Community Votes
                  </span>
                  <p className="mt-1 font-h1 text-2xl font-extrabold text-white">
                    {mySubmission.voteCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle">
                    Jury Evaluation
                  </span>
                  <p className="mt-1 font-h1 text-2xl font-extrabold text-white">
                    {isAnnounced && mySubmission.score ? `${mySubmission.score} / 100` : 'Pending Review'}
                  </p>
                </div>
              </div>

              {isAnnounced && mySubmission.adminNote && (
                <div className="rounded-2xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Jury Feedback &amp; Notes
                  </span>
                  <p className="text-xs text-[#A7ACD9] leading-relaxed whitespace-pre-line italic">
                    &ldquo;{mySubmission.adminNote}&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                {mySubmission.artworkId && (
                  <Link
                    href={`/artworks/${mySubmission.artworkId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-periwinkle px-5 py-2.5 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <ExternalLink size={15} />
                    <span>View Artwork Page</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onCopyLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Share2 size={15} />
                  <span>Share My Artwork</span>
                </button>


                {isSubmissionOpen && (
                  <button
                    type="button"
                    onClick={onOpenSubmitModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-5 py-2.5 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>Edit Submission</span>
                  </button>
                )}

                {onWithdrawSubmission && (
                  <button
                    type="button"
                    onClick={() => onWithdrawSubmission(mySubmission.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer"
                    title="Withdraw your submission from this contest"
                  >
                    <Trash2 size={15} className="text-rose-400" />
                    <span>Withdraw Submission</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Case: Logged in but has not submitted yet
        <div className="rounded-3xl border border-white/10 bg-[#161926] p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 mx-auto mb-4">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-h1 text-xl sm:text-2xl font-bold text-white">
            You Haven&apos;t Submitted an Entry Yet
          </h3>
          <p className="mt-2 text-sm text-[#8A8FA9] leading-relaxed max-w-md mx-auto">
            {isSubmissionOpen
              ? 'Submissions are currently open! You can submit an existing artwork from your portfolio or upload a new creation from your PC.'
              : 'The submission window for this contest is currently closed. Stay tuned for the next competition stage!'}
          </p>

          {isSubmissionOpen ? (
            <div className="mt-8 space-y-6">
              {/* Visual cards showing the 2 choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-brand-periwinkle/15 text-brand-periwinkle flex items-center justify-center shrink-0">
                    <FolderHeart size={20} />
                  </div>
                  <div>
                    <h4 className="font-h1 text-xs font-bold text-white">Option 1: From My Artworks</h4>
                    <p className="text-[11px] text-[#8A8FA9] mt-1 leading-relaxed">
                      Select directly from your published artworks on Dillustration.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                    <MonitorUp size={20} />
                  </div>
                  <div>
                    <h4 className="font-h1 text-xs font-bold text-white">Option 2: Upload from PC</h4>
                    <p className="text-[11px] text-[#8A8FA9] mt-1 leading-relaxed">
                      Upload a digital artwork file directly from your local computer storage.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenSubmitModal}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-periwinkle to-[#c2c7f6] px-8 py-3.5 text-xs font-bold text-brand-navy shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                <UploadCloud size={16} />
                <span>Submit Artwork</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs text-[#A7ACD9]">
              <Clock size={15} />
              <span>Submission deadline has passed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
