'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Palette, UserCheck, Trophy, ExternalLink, ThumbsUp, ShieldAlert } from 'lucide-react';
import type { EventSubmissionDto } from '@/features/event/types/event.types';
import type { TabType } from './event-detail-tab-nav';
import { SubmissionDisputeModal } from './submission-dispute-modal';
import { useLanguage } from '@/context/language-context';

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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const [disputeTarget, setDisputeTarget] = useState<EventSubmissionDto | null>(null);

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6459]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isVie ? 'Tìm tác phẩm hoặc họa sĩ...' : 'Search artworks or artists...'}
            className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-9 pr-4 text-xs text-[#241F1A] placeholder-[#6E6459] focus:border-brand-periwinkle focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6E6459]">{isVie ? 'Sắp xếp:' : 'Sort:'}</span>
            <button
              type="button"
              onClick={() => setSortBy('votes')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                sortBy === 'votes'
                  ? 'bg-brand-periwinkle text-[#FFFCF6]'
                  : 'bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8]'
              }`}
            >
              {isVie ? 'Nhiều bình chọn nhất' : 'Most Votes'}
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-brand-periwinkle text-[#FFFCF6]'
                  : 'bg-[#FFFCF6] text-[#B24A26] hover:bg-[#F0E7D8]'
              }`}
            >
              {isVie ? 'Mới nhất' : 'Newest'}
            </button>
          </div>
        </div>
      </div>

      {/* Artworks Grid */}
      {filteredArtworks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#221E1A]/10 p-16 text-center">
          <Palette size={40} className="mx-auto text-outline/50 mb-3" />
          <h3 className="font-h1 text-lg font-bold text-[#241F1A]">
            {isVie ? 'Chưa có bài dự thi nào' : 'No submissions found'}
          </h3>
          <p className="mt-1 text-xs text-[#6E6459] max-w-md mx-auto">
            {isVie
              ? searchQuery
                ? 'Không có tác phẩm nào khớp với tiêu chí tìm kiếm. Hãy thử từ khóa khác.'
                : 'Hãy là người đầu tiên nộp tác phẩm nguyên bản cho cuộc thi này! Chuyển sang mục Bài dự thi của tôi để bắt đầu.'
              : searchQuery
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
              <span>{isVie ? 'Đến mục Bài dự thi của tôi' : 'Go to My Submission'}</span>
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
                className={`group overflow-hidden rounded-3xl border bg-[#FFFCF6] shadow-lg transition duration-200 hover:-translate-y-1 ${
                  isMine
                    ? 'border-brand-periwinkle/50 ring-1 ring-brand-periwinkle/30'
                    : 'border-[#221E1A]/10 hover:border-brand-periwinkle/30'
                }`}
              >
                <Link
                  href={artworkLink}
                  className="relative aspect-[4/3] w-full block overflow-hidden bg-[#F0E7D8] group/img cursor-pointer"
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
                      {isVie ? 'Không có ảnh xem trước' : 'No preview available'}
                    </div>
                  )}

                  {isMine && (
                    <div className="absolute left-3 top-3 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/90 px-3 py-1 text-[11px] font-extrabold text-[#241F1A] shadow-md backdrop-blur-md">
                      {isVie ? 'Bài của tôi' : 'My Entry'}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[#F0E7D8] opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-[#241F1A] backdrop-blur-[2px]">
                    <ExternalLink size={14} />
                    <span>{isVie ? 'Xem tác phẩm' : 'View Artwork'}</span>
                  </div>
                </Link>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#B24A26] font-medium">@{sub.submitterName || (isVie ? 'Họa sĩ' : 'Artist')}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8A6A1F]">
                      <Trophy size={13} /> {sub.voteCount} {isVie ? 'bình chọn' : 'votes'}
                    </span>
                  </div>

                  <Link href={artworkLink} className="block group/title cursor-pointer">
                    <h4 className="font-h1 text-base font-bold text-[#241F1A] line-clamp-1 group-hover/title:text-brand-periwinkle group-hover/title:underline transition">
                      {sub.title}
                    </h4>
                  </Link>

                  {sub.description && (
                    <p className="line-clamp-2 text-xs text-[#6E6459]">{sub.description}</p>
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
                            : 'bg-[#F0E7D8] hover:bg-brand-periwinkle hover:text-[#FFFCF6] text-[#241F1A]'
                        }`}
                      >
                        <ThumbsUp size={14} className={sub.hasVoted ? 'fill-current' : ''} />
                        <span>{isVie ? (sub.hasVoted ? 'Đã bình chọn' : 'Bình chọn') : (sub.hasVoted ? 'Voted' : 'Vote')}</span>
                      </button>
                    )}

                    {/* Raise Dispute button: Always visible on other artists' submissions */}
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!effectiveUserId) {
                            import('react-hot-toast').then(({ default: toast }) => {
                              toast.error(isVie ? 'Vui lòng đăng nhập để gửi khiếu nại.' : 'Please log in to raise a dispute.');
                            });
                            return;
                          }
                          setDisputeTarget(sub);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 py-2.5 px-2 text-xs font-semibold text-[#A8321C] hover:bg-[#A8321C]/20 hover:text-[#A8321C] transition cursor-pointer text-center"
                        title={isVie ? 'Gửi khiếu nại cho bài dự thi này' : 'Raise a dispute for this submission'}
                      >
                        <ShieldAlert size={14} className="text-[#A8321C] shrink-0" />
                        <span className="truncate">{isVie ? 'Khiếu nại' : 'Raise Dispute'}</span>
                      </button>
                    )}


                    <Link
                      href={artworkLink}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2.5 px-2 text-xs font-semibold text-[#B24A26] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer text-center"
                      title={isVie ? 'Xem chi tiết bài dự thi' : 'View artwork details'}
                    >
                      <ExternalLink size={13} className="shrink-0" />
                      <span>{isVie ? 'Chi tiết' : 'Details'}</span>
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
