'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Palette, UserCheck, Trophy, ExternalLink, ThumbsUp, ShieldAlert } from 'lucide-react';
import type { EventSubmissionDto } from '@/features/event/types/event.types';
import type { TabType } from './event-detail-tab-nav';
import { SubmissionDisputeModal } from './submission-dispute-modal';

interface EventTabArtworksProps {
  filteredArtworks: EventSubmissionDto[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'votes' | 'newest';
  setSortBy: (sort: 'votes' | 'newest') => void;
  isSubmissionOpen: boolean;
  setActiveTab: (tab: TabType) => void;
  effectiveUserId: string | null;
  votingId: string | null;
  handleVote: (submissionId: string, hasVoted?: boolean) => void;
  isCreatorOrClient?: boolean;
}

export function EventTabArtworks({
  filteredArtworks,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  isSubmissionOpen,
  setActiveTab,
  effectiveUserId,
  votingId,
  handleVote,
  isCreatorOrClient = false,
}: EventTabArtworksProps) {
  const [disputeTarget, setDisputeTarget] = useState<EventSubmissionDto | null>(null);
  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161926] p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8FA9]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artworks or artists..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder-[#8A8FA9] focus:border-brand-periwinkle focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A8FA9]">Sort:</span>
            <button
              type="button"
              onClick={() => setSortBy('votes')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                sortBy === 'votes'
                  ? 'bg-brand-periwinkle text-brand-navy'
                  : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
              }`}
            >
              Most Votes
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-brand-periwinkle text-brand-navy'
                  : 'bg-white/5 text-[#A7ACD9] hover:bg-white/10'
              }`}
            >
              Newest
            </button>
          </div>
        </div>
      </div>

      {/* Artworks Grid */}
      {filteredArtworks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center">
          <Palette size={40} className="mx-auto text-outline/50 mb-3" />
          <h3 className="font-h1 text-lg font-bold text-white">No submissions found</h3>
          <p className="mt-1 text-xs text-[#8A8FA9] max-w-md mx-auto">
            {searchQuery
              ? 'No artworks matched your search criteria. Try a different query.'
              : 'Be the pioneer creator to submit your original artwork for this competition! Go to My Submission tab to enter.'}
          </p>
          {isSubmissionOpen && (
            <button
              type="button"
              onClick={() => setActiveTab('my-submission')}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-brand-periwinkle/30 bg-brand-periwinkle/15 px-6 py-2.5 text-xs font-bold text-brand-periwinkle hover:bg-brand-periwinkle/25 transition cursor-pointer"
            >
              <UserCheck size={16} />
              <span>Go to My Submission</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.map((sub) => {
            const isMine = effectiveUserId && sub.submitterId === effectiveUserId;
            const artworkLink = sub.artworkId ? `/artworks/${sub.artworkId}` : '#';

            return (
              <article
                key={sub.id}
                className={`group overflow-hidden rounded-3xl border bg-[#161926] shadow-lg transition duration-200 hover:-translate-y-1 ${
                  isMine
                    ? 'border-brand-periwinkle/50 ring-1 ring-brand-periwinkle/30'
                    : 'border-white/10 hover:border-brand-periwinkle/30'
                }`}
              >
                <Link
                  href={artworkLink}
                  className="relative aspect-[4/3] w-full block overflow-hidden bg-black/40 group/img cursor-pointer"
                >
                  {sub.artworkImageUrl || sub.artworkThumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sub.artworkImageUrl || sub.artworkThumbnailUrl || ''}
                      alt={sub.title}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-outline">
                      No preview available
                    </div>
                  )}

                  {isMine && (
                    <div className="absolute left-3 top-3 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/90 px-3 py-1 text-[11px] font-extrabold text-brand-navy shadow-md backdrop-blur-md">
                      My Entry
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-white backdrop-blur-[2px]">
                    <ExternalLink size={14} />
                    <span>View Artwork</span>
                  </div>
                </Link>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A7ACD9] font-medium">@{sub.submitterName || 'Artist'}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                      <Trophy size={13} /> {sub.voteCount} votes
                    </span>
                  </div>

                  <Link href={artworkLink} className="block group/title cursor-pointer">
                    <h4 className="font-h1 text-base font-bold text-white line-clamp-1 group-hover/title:text-brand-periwinkle group-hover/title:underline transition">
                      {sub.title}
                    </h4>
                  </Link>

                  {sub.description && (
                    <p className="line-clamp-2 text-xs text-[#8A8FA9]">{sub.description}</p>
                  )}

                  <div className="pt-2 flex items-center justify-center gap-2">
                    {/* Voting button: Only show on creator and client side */}
                    {isCreatorOrClient && (
                      <button
                        type="button"
                        onClick={() => handleVote(sub.id, sub.hasVoted)}
                        disabled={votingId === sub.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition active:scale-95 cursor-pointer text-center ${
                          sub.hasVoted
                            ? 'border border-brand-periwinkle bg-brand-periwinkle/20 text-brand-periwinkle'
                            : 'bg-white/10 hover:bg-brand-periwinkle hover:text-brand-navy text-white'
                        }`}
                      >
                        <ThumbsUp size={14} className={sub.hasVoted ? 'fill-current' : ''} />
                        <span>{sub.hasVoted ? 'Voted' : 'Vote'}</span>
                      </button>
                    )}

                    {/* Raise Dispute button: Always visible on other artists' submissions */}
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!effectiveUserId) {
                            import('react-hot-toast').then(({ default: toast }) => {
                              toast.error('Please log in to raise a dispute.');
                            });
                            return;
                          }
                          setDisputeTarget(sub);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 px-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer text-center"
                        title="Raise a dispute for this submission"
                      >
                        <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                        <span className="truncate">Raise Dispute</span>
                      </button>
                    )}


                    <Link
                      href={artworkLink}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 px-2 text-xs font-semibold text-[#A7ACD9] hover:bg-white/10 hover:text-white transition cursor-pointer text-center"
                      title="View artwork details"
                    >
                      <ExternalLink size={13} className="shrink-0" />
                      <span>Details</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Submission Dispute Modal */}
      {disputeTarget && (
        <SubmissionDisputeModal
          submission={disputeTarget}
          onClose={() => setDisputeTarget(null)}
        />
      )}
    </div>
  );
}
