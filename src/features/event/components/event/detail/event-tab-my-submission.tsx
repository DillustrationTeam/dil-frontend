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
import { useLanguage } from '@/context/language-context';
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  return (
    <div className="space-y-6">
      {!effectiveUserId ? (
        // Case: Not logged in
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-periwinkle/15 text-brand-periwinkle mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h3 className="font-h1 text-xl font-bold text-[#241F1A]">
            {isVie ? 'Đăng nhập để xem bài dự thi của bạn' : 'Sign In to View Your Submission'}
          </h3>
          <p className="mt-2 text-sm text-[#6E6459] leading-relaxed max-w-md mx-auto">
            {isVie
              ? 'Kết nối tài khoản Dillustration của bạn để nộp tác phẩm, theo dõi lượt bình chọn cộng đồng và kiểm tra vị trí trên Bảng vinh danh.'
              : 'Connect your Dillustration account to submit your contest entry, check real-time community votes, and track your standing on the Wall of Fame.'}
          </p>
          <Link
            href={`/login?redirect=/events/${eventId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-periwinkle px-8 py-3 text-xs font-bold text-[#FFFCF6] shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <LogIn size={15} />
            <span>{isVie ? 'Đăng nhập ngay' : 'Sign In Now'}</span>
          </Link>
        </div>
      ) : isJuryMember ? (
        // Case: User is a Jury / Head Jury member for this event
        <div className="glass-container rounded-3xl border-brand-periwinkle/30 p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-periwinkle/20 text-brand-periwinkle mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-periwinkle/40 bg-brand-periwinkle/15 px-3.5 py-1 text-xs font-bold text-brand-periwinkle mb-3">
            <ShieldCheck size={13} />
            <span>{isVie ? 'Giới hạn dành cho Ban giám khảo' : 'Jury Member Restricted'}</span>
          </div>
          <h3 className="font-h1 text-xl sm:text-2xl font-bold text-[#241F1A]">
            {isVie ? 'Thành viên Ban giám khảo không thể tham gia dự thi' : 'Jury Members Are Not Eligible to Enter'}
          </h3>
          <p className="mt-3 text-sm text-[#B24A26] leading-relaxed max-w-md mx-auto">
            {isVie ? (
              <>
                Bạn hiện đang giữ vai trò{' '}
                <strong className="text-[#241F1A]">
                  {currentJury?.isHeadJury ? 'Trưởng ban giám khảo' : 'Thành viên ban giám khảo'}
                </strong>{' '}
                cho cuộc thi này. Theo quy chế của Dillustration, thành viên ban giám khảo không thể gửi bài thi hoặc bình chọn nhằm đảm bảo tính công tâm tuyệt đối.
              </>
            ) : (
              <>
                You are currently serving as a{' '}
                <strong className="text-[#241F1A]">
                  {currentJury?.isHeadJury ? 'Head Jury Member' : 'Jury Member'}
                </strong>{' '}
                for this competition. Per Dillustration contest policies, evaluation panel members cannot enter submissions or vote to ensure absolute impartiality.
              </>
            )}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/events/${eventId}/jury`}
              className="commission-primary inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-xs shadow-xl active:scale-95 transition cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{isVie ? 'Mở không gian giám khảo' : 'Open Jury Workspace'}</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('artworks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] px-6 py-3.5 text-xs font-semibold text-[#B24A26] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer"
            >
              <span>{isVie ? 'Xem các bài dự thi' : 'Browse Contest Entries'}</span>
            </button>
          </div>
        </div>
      ) : !isCreator && !mySubmission ? (
        // Case: Logged in but NOT a Creator
        <div className="rounded-3xl border border-[#8A6A1F]/40 bg-gradient-to-br from-[#8A6A1F] via-[#FFFCF6] to-[#FFFCF6] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#8A6A1F]/15 text-[#8A6A1F] mx-auto mb-4">
            <Palette size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/20 px-3.5 py-1 text-xs font-bold text-[#8A6A1F] mb-3">
            <Sparkles size={13} />
            <span>{isVie ? 'Dành riêng cho Họa sĩ' : 'Creator Exclusive'}</span>
          </div>
          <h3 className="font-h1 text-xl sm:text-2xl font-bold text-[#241F1A]">
            {isVie ? 'Chỉ Họa sĩ mới có thể tham gia cuộc thi' : 'Only Creators Can Participate in Contests'}
          </h3>
          <p className="mt-3 text-sm text-[#B24A26] leading-relaxed max-w-md mx-auto">
            {isVie
              ? 'Việc nộp bài dự thi chỉ dành riêng cho các Họa sĩ đã đăng ký trên Dillustration. Hãy hoàn thiện hồ sơ Họa sĩ để trưng bày hồ sơ tác phẩm, gửi tác phẩm và tranh tài nhận giải thưởng.'
              : 'Event submissions are reserved exclusively for registered Creators on Dillustration. Complete your Creator Profile to showcase your portfolio, submit artworks, and compete for community awards.'}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/creator-setup"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8A6A1F] to-[#8A6A1F] px-7 py-3.5 text-xs font-bold text-[#FFFCF6] shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Palette size={16} />
              <span>{isVie ? 'Trở thành Họa sĩ' : 'Become a Creator'}</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('artworks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] px-6 py-3.5 text-xs font-semibold text-[#B24A26] hover:bg-[#F0E7D8] hover:text-[#241F1A] transition cursor-pointer"
            >
              <span>{isVie ? 'Xem và bình chọn tác phẩm' : 'Browse & Vote Artworks'}</span>
            </button>
          </div>
        </div>
      ) : mySubmission ? (
        // Case: User has submitted an artwork
        <div className="rounded-3xl border border-brand-periwinkle/30 bg-gradient-to-br from-brand-periwinkle/10 via-[#FFFCF6] to-[#FFFCF6] p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Artwork Preview */}
            <div className="w-full lg:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden border border-[#221E1A]/10 bg-[#E5D8C2] shadow-inner relative group">
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
                    {isVie ? 'Không có hình ảnh' : 'Preview not available'}
                  </div>
                )}
                <div className="absolute inset-0 bg-[#F0E7D8] opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-[#241F1A] backdrop-blur-[2px]">
                  <ExternalLink size={15} />
                  <span>{isVie ? 'Xem trang tác phẩm' : 'View Artwork Page'}</span>
                </div>
              </Link>

              {/* View Full Resolution icon button in top-right corner */}
              {mySubmission.artworkImageUrl && (
                <a
                  href={mySubmission.artworkImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-xl bg-[#E5D8C2] border border-[#221E1A]/20 text-[#241F1A] shadow-lg backdrop-blur-md hover:bg-[#F0E7D8]/90 hover:scale-105 active:scale-95 transition cursor-pointer"
                  title={isVie ? 'Xem ảnh gốc độ phân giải cao' : 'View Full Resolution'}
                >
                  <Maximize2 size={16} />
                </a>
              )}
            </div>

            {/* Right: Submission Info & Performance */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-full border border-[#2F6B63]/40 bg-[#2F6B63]/20 px-3 py-1 text-xs font-bold text-[#2F6B63]">
                    {isVie ? 'Đang tham gia' : 'Active Entry'}
                  </span>
                  {mySubmission.aiScanPassed && (
                    <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3 py-1 text-xs font-bold text-brand-periwinkle">
                      {isVie ? 'Đã xác thực bản quyền gốc' : 'Originality Verified'}
                    </span>
                  )}
                </div>

                <Link
                  href={mySubmission.artworkId ? `/artworks/${mySubmission.artworkId}` : '#'}
                  className="block group/title cursor-pointer"
                >
                  <h2 className="font-h1 text-2xl sm:text-3xl font-extrabold text-[#241F1A] group-hover/title:text-brand-periwinkle group-hover/title:underline transition">
                    {mySubmission.title}
                  </h2>
                </Link>
                <p className="mt-1 text-xs text-[#6E6459]">
                  {isVie ? 'Được nộp bởi' : 'Submitted by'} @{mySubmission.submitterName || currentUserFullName || (isVie ? 'Bạn' : 'You')} •{' '}
                  {new Date(mySubmission.submittedAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-US')}
                </p>
              </div>

              {mySubmission.description && (
                <p className="text-sm text-[#B24A26] leading-relaxed whitespace-pre-line bg-[#FFFCF6] border border-[#221E1A]/10 p-4 rounded-xl">
                  {mySubmission.description}
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A6A1F]">
                    {isVie ? 'Bình chọn cộng đồng' : 'Community Votes'}
                  </span>
                  <p className="mt-1 font-h1 text-2xl font-extrabold text-[#241F1A]">
                    {mySubmission.voteCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle">
                    {isVie ? 'Điểm đánh giá GK' : 'Jury Evaluation'}
                  </span>
                  <p className="mt-1 font-h1 text-2xl font-extrabold text-[#241F1A]">
                    {isAnnounced && mySubmission.score
                      ? `${mySubmission.score} / 100`
                      : (isVie ? 'Chờ chấm điểm' : 'Pending Review')}
                  </p>
                </div>
              </div>

              {isAnnounced && mySubmission.adminNote && (
                <div className="rounded-2xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-periwinkle flex items-center gap-1.5">
                    <Sparkles size={13} />
                    {isVie ? 'Nhận xét từ Ban giám khảo' : 'Jury Feedback & Notes'}
                  </span>
                  <p className="text-xs text-[#B24A26] leading-relaxed whitespace-pre-line italic">
                    &ldquo;{mySubmission.adminNote}&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                {mySubmission.artworkId && (
                  <Link
                    href={`/artworks/${mySubmission.artworkId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-periwinkle px-5 py-2.5 text-xs font-bold text-[#FFFCF6] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <ExternalLink size={15} />
                    <span>{isVie ? 'Xem trang tác phẩm' : 'View Artwork Page'}</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onCopyLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-5 py-2.5 text-xs font-bold text-[#241F1A] hover:bg-[#F0E7D8] transition cursor-pointer"
                >
                  <Share2 size={15} />
                  <span>{isVie ? 'Chia sẻ bài thi' : 'Share My Artwork'}</span>
                </button>

                {isSubmissionOpen && (
                  <button
                    type="button"
                    onClick={onOpenSubmitModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-periwinkle to-[#8C3718] px-5 py-2.5 text-xs font-bold text-[#241F1A] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>{isVie ? 'Chỉnh sửa bài thi' : 'Edit Submission'}</span>
                  </button>
                )}

                {onWithdrawSubmission && (
                  <button
                    type="button"
                    onClick={() => onWithdrawSubmission(mySubmission.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-5 py-2.5 text-xs font-bold text-[#A8321C] hover:bg-[#A8321C]/20 hover:text-[#A8321C] transition cursor-pointer"
                    title={isVie ? 'Rút bài thi của bạn khỏi cuộc thi này' : 'Withdraw your submission from this contest'}
                  >
                    <Trash2 size={15} className="text-[#A8321C]" />
                    <span>{isVie ? 'Rút bài thi' : 'Withdraw Submission'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Case: Logged in but has not submitted yet
        <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#8A6A1F]/15 text-[#8A6A1F] mx-auto mb-4">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-h1 text-xl sm:text-2xl font-bold text-[#241F1A]">
            {isVie ? 'Bạn chưa gửi bài dự thi nào' : 'You Haven\'t Submitted an Entry Yet'}
          </h3>
          <p className="mt-2 text-sm text-[#6E6459] leading-relaxed max-w-md mx-auto">
            {isSubmissionOpen
              ? (isVie
                  ? 'Giai đoạn nộp bài đang diễn ra! Bạn có thể chọn tác phẩm có sẵn từ bộ sưu tập hoặc tải lên tác phẩm mới từ máy tính.'
                  : 'Submissions are currently open! You can submit an existing artwork from your portfolio or upload a new creation from your PC.')
              : (isVie
                  ? 'Thời hạn nộp bài cho cuộc thi này đã kết thúc. Hãy theo dõi các vòng thi tiếp theo!'
                  : 'The submission window for this contest is currently closed. Stay tuned for the next competition stage!')}
          </p>

          {isSubmissionOpen ? (
            <div className="mt-8 space-y-6">
              {/* Visual cards showing the 2 choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-brand-periwinkle/15 text-brand-periwinkle flex items-center justify-center shrink-0">
                    <FolderHeart size={20} />
                  </div>
                  <div>
                    <h4 className="font-h1 text-xs font-bold text-[#241F1A]">
                      {isVie ? 'Lựa chọn 1: Từ tác phẩm của tôi' : 'Option 1: From My Artworks'}
                    </h4>
                    <p className="text-[11px] text-[#6E6459] mt-1 leading-relaxed">
                      {isVie
                        ? 'Chọn trực tiếp từ các tác phẩm bạn đã xuất bản trên Dillustration.'
                        : 'Select directly from your published artworks on Dillustration.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-[#8A6A1F]/15 text-[#8A6A1F] flex items-center justify-center shrink-0">
                    <MonitorUp size={20} />
                  </div>
                  <div>
                    <h4 className="font-h1 text-xs font-bold text-[#241F1A]">
                      {isVie ? 'Lựa chọn 2: Tải lên từ máy tính' : 'Option 2: Upload from PC'}
                    </h4>
                    <p className="text-[11px] text-[#6E6459] mt-1 leading-relaxed">
                      {isVie
                        ? 'Tải lên trực tiếp tệp hình ảnh kỹ thuật số từ ổ cứng máy tính của bạn.'
                        : 'Upload a digital artwork file directly from your local computer storage.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenSubmitModal}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-periwinkle to-[#8C3718] px-8 py-3.5 text-xs font-bold text-[#241F1A] shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                <UploadCloud size={16} />
                <span>{isVie ? 'Nộp tác phẩm' : 'Submit Artwork'}</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-5 py-2.5 text-xs text-[#B24A26]">
              <Clock size={15} />
              <span>{isVie ? 'Thời hạn nộp bài đã kết thúc' : 'Submission deadline has passed'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
