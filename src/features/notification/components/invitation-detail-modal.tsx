'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, Calendar, Check, CircleAlert, Crown, ExternalLink, Loader2, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { notificationService } from '../services/notification.service';
import type { EventInvitationDto } from '../types/notification.types';

interface InvitationDetailModalProps {
  invitationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onResponded?: (invitationId: string, status: 'Accepted' | 'Declined') => void;
}

export function InvitationDetailModal({
  invitationId,
  isOpen,
  onClose,
  onResponded,
}: InvitationDetailModalProps) {
  const [invitation, setInvitation] = useState<EventInvitationDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !invitationId) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setInvitation(null);
          setError(null);
          setConfirmDecline(false);
        }
      });
      return;
    }

    void Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
        setConfirmDecline(false);
      }
    });

    notificationService
      .getInvitation(invitationId)
      .then((data) => {
        if (isMounted) setInvitation(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không tải được thông tin lời mời.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, invitationId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleAccept() {
    if (!invitationId) return;
    setActionLoading('accept');
    try {
      const updated = await notificationService.acceptInvitation(invitationId);
      setInvitation(updated);
      toast.success('Bạn đã chấp nhận lời mời tham gia Ban giám khảo sự kiện!');
      onResponded?.(invitationId, 'Accepted');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể chấp nhận lời mời.'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline() {
    if (!invitationId) return;
    setActionLoading('decline');
    try {
      const updated = await notificationService.declineInvitation(invitationId);
      setInvitation(updated);
      toast.success('Đã từ chối lời mời tham gia Ban giám khảo sự kiện.');
      setConfirmDecline(false);
      onResponded?.(invitationId, 'Declined');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể từ chối lời mời.'));
    } finally {
      setActionLoading(null);
    }
  }

  const isPending = invitation?.status?.toLowerCase() === 'pending';
  const isAccepted = invitation?.status?.toLowerCase() === 'accepted';
  const isDeclined = invitation?.status?.toLowerCase() === 'declined';
  const isCanceled = invitation?.status?.toLowerCase() === 'canceled';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-container relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#F0E7D8] p-0 text-on-surface shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Banner area */}
        <div className="relative h-44 w-full bg-gradient-to-br from-brand-navy via-brand-purple/40 to-brand-periwinkle/30 overflow-hidden">
          {invitation?.eventBannerUrl ? (
            <Image
              src={invitation.eventBannerUrl}
              alt={invitation.eventTitle || 'Banner sự kiện'}
              fill
              className="object-cover opacity-60"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#FFFCF6]">
              <Award size={48} className="text-[#241F1A]/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F0E7D8] via-[#F0E7D8]/60 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-[#221E1A]/20 bg-[#F0E7D8] p-1.5 text-[#241F1A]/80 transition hover:bg-[#E5D8C2] hover:text-[#241F1A]"
            title="Đóng"
          >
            <X size={18} />
          </button>

          {/* Top role pill */}
          <div className="absolute left-6 bottom-4 right-6 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-lg ${
                invitation?.isHeadJury
                  ? 'border border-[#8A6A1F]/40 bg-[#8A6A1F]/20 text-[#8A6A1F]'
                  : 'border border-brand-periwinkle/40 bg-brand-periwinkle/20 text-brand-periwinkle'
              }`}
            >
              {invitation?.isHeadJury ? (
                <>
                  <Crown size={14} className="text-[#8A6A1F]" /> Trưởng ban giám khảo </>
              ) : (
                <>
                  <Award size={14} /> Ban giám khảo </>
              )}
            </span>

            {/* Status badge */}
            {isPending && (
              <span className="inline-flex items-center rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8A6A1F]"> Chờ phản hồi </span>
            )}
            {isAccepted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#2F6B63]/40 bg-[#2F6B63]/15 px-2.5 py-0.5 text-xs font-semibold text-[#2F6B63]">
                <Check size={12} /> Đã chấp nhận </span>
            )}
            {isDeclined && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#A8321C]/40 bg-[#A8321C]/15 px-2.5 py-0.5 text-xs font-semibold text-[#A8321C]">
                <X size={12} /> Đã từ chối </span>
            )}
            {isCanceled && (
              <span className="inline-flex items-center rounded-full border border-[#221E1A]/20 bg-[#F0E7D8] px-2.5 py-0.5 text-xs font-medium text-outline"> Đã hủy </span>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4 py-6 text-center">
              <Loader2 size={32} className="mx-auto animate-spin text-brand-periwinkle" />
              <p className="text-xs text-outline">Đang tải thông tin lời mời...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-4 text-sm text-[#A8321C]">
              <div className="flex items-center gap-2">
                <CircleAlert size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : invitation ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-h1 text-xl font-bold text-[#241F1A]">
                  {invitation.eventTitle || 'Lời mời tham gia sự kiện'}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Bạn nhận được lời mời tham gia với vai trò{' '}
                  <span className="font-semibold text-[#241F1A]">
                    {invitation.isHeadJury ? 'Trưởng ban giám khảo' : 'Giám khảo'}
                  </span>{' '}
                  cho sự kiện này.
                </p>
              </div>

              {/* Meta information card */}
              <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="flex items-center gap-1.5 text-outline">
                    <User size={14} /> Người gửi: </span>
                  <span className="font-medium text-[#241F1A]">
                    {invitation.sentFromAdminName || 'Ban tổ chức / quản trị viên'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="flex items-center gap-1.5 text-outline">
                    <Calendar size={14} /> Ngày gửi: </span>
                  <span className="font-medium text-[#241F1A]">
                    {new Date(invitation.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                {invitation.respondedAt && (
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5 text-outline">
                      <Check size={14} /> Thời gian phản hồi: </span>
                    <span className="font-medium text-[#241F1A]">
                      {new Date(invitation.respondedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Information text */}
              <div className="rounded-2xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 p-3.5 text-xs leading-relaxed text-on-surface-variant">
                {isPending && (
                  <p>
                    📌 Khi chấp nhận, bạn sẽ chính thức tham gia Ban giám khảo và có quyền chấm điểm
                    các bài dự thi trong giai đoạn chấm thi của cuộc thi.
                  </p>
                )}
                {isAccepted && (
                  <p className="text-[#2F6B63]">
                    ✓ Bạn đã chấp nhận lời mời này. Bạn có thể vào xem trang sự kiện và các bài dự thi
                    khi đến giai đoạn chấm bài.
                  </p>
                )}
                {isDeclined && (
                  <p className="text-[#A8321C]">
                    ✕ Bạn đã từ chối lời mời tham gia sự kiện này.
                  </p>
                )}
                {isCanceled && (
                  <p className="text-outline"> Lời mời này đã được Ban tổ chức hủy bỏ. </p>
                )}
              </div>

              {/* Action buttons */}
              {isPending && !confirmDecline && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={handleAccept}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2F6B63] to-[#2F6B63] px-5 py-2.5 text-xs font-bold text-[#241F1A] shadow-lg shadow-[#2F6B63] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === 'accept' ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Chấp nhận lời mời
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => setConfirmDecline(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-2.5 text-xs font-semibold text-[#A8321C] transition hover:bg-[#A8321C]/20 disabled:opacity-50"
                  >
                    <X size={15} /> Từ chối </button>
                </div>
              )}

              {/* Inline decline confirmation */}
              {isPending && confirmDecline && (
                <div className="rounded-2xl border border-[#A8321C]/40 bg-[#A8321C]/10 p-3.5 text-xs animate-in fade-in">
                  <p className="font-semibold text-[#A8321C]"> Bạn có chắc chắn muốn từ chối lời mời này? </p>
                  <p className="mt-1 text-[11px] text-[#A8321C]"> Hành động này không thể hoàn tác sau khi xác nhận. </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoading !== null}
                      onClick={handleDecline}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#A8321C]/12 px-3.5 py-1.5 text-xs font-bold text-[#241F1A] transition hover:bg-[#A8321C]/12 disabled:opacity-50"
                    >
                      {actionLoading === 'decline' ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <X size={13} />
                      )}
                      Xác nhận từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDecline(false)}
                      className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3 py-1.5 text-xs text-on-surface-variant hover:text-[#241F1A]"
                    > Hủy </button>
                  </div>
                </div>
              )}

              {/* View event page link */}
              {invitation.eventId && (
                <div className="pt-2 text-center">
                  <Link
                    href={`/events/${invitation.eventId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-periwinkle hover:underline"
                  > Xem trang chi tiết cuộc thi <ExternalLink size={13} />
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
