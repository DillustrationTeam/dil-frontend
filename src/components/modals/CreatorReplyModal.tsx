'use client';

import React, { useState } from 'react';
import { X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { commissionService } from '@/services/commission.service';

interface CreatorReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionId: string;
  reviewComment?: string;
  reviewRating?: number;
  onSuccess?: () => void;
}

export default function CreatorReplyModal({
  isOpen,
  onClose,
  commissionId,
  reviewComment,
  reviewRating = 5,
  onSuccess,
}: CreatorReplyModalProps) {
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reply.trim()) return alert('Please write a reply.');
    setIsSubmitting(true);
    try {
      await commissionService.replyReview(commissionId, reply);
      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to submit reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < count ? 'text-[#8A6A1F]' : 'text-[#241F1A]'}>★</span>
    ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#FFFCF6]/95 border border-[#221E1A]/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between bg-[#FFFCF6]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3B4C86]/20 text-[#3B4C86] flex items-center justify-center border border-[#3B4C86]/40">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Reply to Review</h3>
              <p className="text-[11px] text-[#746A5F]">Your public response</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!submitted ? (
            <>
              {/* Client Review Preview */}
              {reviewComment && (
                <div className="p-4 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-2xl space-y-2">
                  <div className="flex text-base">{renderStars(reviewRating)}</div>
                  <p className="text-xs text-[#746A5F] italic">&ldquo;{reviewComment}&rdquo;</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-1.5">
                  Your Reply
                </label>
                <textarea
                  rows={5}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Thank the client, address feedback, or share context about this commission..."
                  className="w-full p-4 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-xl text-sm text-[#241F1A] text-[#746A5F] focus:outline-none focus:border-[#3B4C86]/30 focus:ring-1 focus:ring-[#3B4C86]/30"
                />
                <p className="text-[10px] text-[#746A5F] mt-1">This reply will appear publicly on your profile.</p>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#241F1A]">Reply Posted!</h4>
              <p className="text-xs text-[#746A5F]">Your response is now visible on your creator profile.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#221E1A]/10 bg-[#FFFCF6]/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6]"
          >
            {submitted ? 'Close' : 'Cancel'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reply.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#3B4C86] to-[#5F3F86] text-[#241F1A] shadow-lg shadow-[#3B4C86] hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : (
                <><MessageSquare className="w-4 h-4" /> Post Reply</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
