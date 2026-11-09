'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Plus,
  Clock,
  ArrowLeftRight,
  Upload,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ImageIcon,
  Loader2,
  XCircle,
  ArrowLeft,
  Calendar,
  X,
  Gavel,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { ArtTradeDto, TradeStatus } from '@/types/art-trade.types';
import { artTradeService } from '@/services/art-trade.service';
import { parseNoteWithAttachments, formatNoteWithAttachments } from '../utils/trade-attachment.utils';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';
import type { NotificationDto } from '@/features/notification/types/notification.types';
import { useArtTradeRealtime } from '../hooks/use-art-trade-realtime';
import { TradeDisputeBanner } from './TradeDisputeBanner';
import { TradeDisputeModal } from './TradeDisputeModal';
import { TradeChatRoom } from './TradeChatRoom';
import toast from 'react-hot-toast';

interface TradeStationProps {
  tradeId?: string;
  initialData?: ArtTradeDto | null;
}

const isValidGuid = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function TradeStation({ tradeId, initialData }: TradeStationProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [trade, setTrade] = useState<ArtTradeDto | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(!initialData && !!tradeId && isValidGuid(tradeId));
  const [uploadingSide, setUploadingSide] = useState<'initiator' | 'receiver' | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [respondingProposal, setRespondingProposal] = useState<boolean>(false);
  const [sideBNote, setSideBNote] = useState<string>('');
  const [sideBImages, setSideBImages] = useState<string[]>([]);
  const [isUploadingSideBAttachment, setIsUploadingSideBAttachment] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reference' | 'submission' | 'chat'>('reference');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'chat' || tabParam === 'submission' || tabParam === 'reference') {
        setActiveTab(tabParam);
      }
    }
  }, []);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);

  const initiatorFileInputRef = useRef<HTMLInputElement>(null);
  const receiverFileInputRef = useRef<HTMLInputElement>(null);

  // Load trade data
  useEffect(() => {
    if (!tradeId || tradeId === 'create' || !isValidGuid(tradeId)) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchTrade() {
      try {
        setLoading(true);
        const data = await artTradeService.getById(tradeId!);
        if (isMounted) setTrade(data);
      } catch (err: unknown) {
        console.error('Error fetching trade data:', err);
        toast.error(isVie ? 'Không thể tải thông tin trao đổi.' : 'Failed to load trade data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTrade();
    return () => {
      isMounted = false;
    };
  }, [tradeId, isVie]);

  useEffect(() => {
    if (trade?.receiverResponseNote) {
      const parsed = parseNoteWithAttachments(trade.receiverResponseNote);
      setSideBNote(parsed.text);
      setSideBImages(parsed.images);
    } else {
      setSideBNote('');
      setSideBImages([]);
    }
  }, [trade?.receiverResponseNote]);

  // Real-time: khi đối tác thao tác, tải lại trade ngay (không cần F5)
  const handleRealtimeChange = useCallback(
    (n: NotificationDto) => {
      if (!tradeId || !isValidGuid(tradeId)) return;
      artTradeService
        .getById(tradeId)
        .then((fresh) => {
          setTrade(fresh);
          toast(n.notificationTitle, { icon: '🔔' });
        })
        .catch(() => undefined);
    },
    [tradeId],
  );
  useArtTradeRealtime(tradeId, handleRealtimeChange);

  const handleUploadSideBAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingSideBAttachment(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await artTradeService.uploadAttachment(files[i]);
        newUrls.push(url);
      }
      setSideBImages((prev) => [...prev, ...newUrls]);
      toast.success(isVie ? `Đã đính kèm ${newUrls.length} ảnh mẫu.` : `Attached ${newUrls.length} reference image(s).`);
    } catch (err) {
      console.error(err);
      toast.error(isVie ? 'Tải ảnh đính kèm thất bại.' : 'Failed to upload attachment.');
    } finally {
      setIsUploadingSideBAttachment(false);
      event.target.value = '';
    }
  };

  const handleRemoveSideBImage = (indexToRemove: number) => {
    setSideBImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
        <p className="text-sm font-medium">{isVie ? 'Đang tải thông tin trao đổi...' : 'Loading trade information...'}</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="p-8 text-center text-red-400 glass-container rounded-2xl max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold mb-1">{isVie ? 'Không tìm thấy trao đổi' : 'Trade Not Found'}</h3>
        <p className="text-sm text-gray-400">
          {isVie ? 'Không thể truy xuất thông tin phiên trao đổi tranh này.' : 'Could not retrieve information for this art trade session.'}
        </p>
        <Link
          href="/art-trades"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> {isVie ? 'Quay lại danh sách' : 'Back to My Trades'}
        </Link>
      </div>
    );
  }

  const currentUserId = currentUser?.id?.toLowerCase();
  const isCurrentUserInitiator = !!currentUserId && (currentUserId === trade.initiator?.id?.toLowerCase() || currentUser?.fullName === trade.initiator?.fullName);
  const isCurrentUserReceiver = !!currentUserId && (currentUserId === trade.receiver?.id?.toLowerCase() || currentUser?.fullName === trade.receiver?.fullName);
  const isReceiverRole = isCurrentUserReceiver || !isCurrentUserInitiator;

  const isProposed = trade.status === 'Proposed' || (trade.status as unknown) === 1 || (trade.status as unknown) === '1';
  const isAccepted =
    trade.status === 'Accepted' ||
    trade.status === 'BothSubmitted' ||
    (trade.status as unknown) === 2 ||
    (trade.status as unknown) === '2' ||
    (trade.status as unknown) === 3 ||
    (trade.status as unknown) === '3';
  const isCompleted =
    trade.status === 'Completed' ||
    (trade.status as unknown) === 4 ||
    (trade.status as unknown) === '4';
  const isDisputed =
    trade.status === 'Disputed' ||
    (trade.status as unknown) === 7 ||
    (trade.status as unknown) === '7';
  const isCancelledOrRejected =
    trade.status === 'Cancelled' ||
    trade.status === 'Rejected' ||
    (trade.status as unknown) === 5 ||
    (trade.status as unknown) === '5' ||
    (trade.status as unknown) === 6 ||
    (trade.status as unknown) === '6';

  // Handle responding to proposal (Accept or Decline)
  const handleRespondProposal = async (accept: boolean) => {
    if (!trade?.id) return;
    try {
      setRespondingProposal(true);
      const finalNote = accept ? formatNoteWithAttachments(sideBNote, sideBImages) : undefined;
      const updated = await artTradeService.respond(trade.id, {
        accept,
        responseNote: finalNote,
        requestNote: finalNote,
      });
      setTrade(updated);
      toast.success(
        accept
          ? (isVie ? 'Đã chấp nhận đề nghị! Phòng trao đổi tranh đã bắt đầu.' : 'Proposal accepted! Trade Room is now open.')
          : (isVie ? 'Đã từ chối đề nghị trao đổi.' : 'Proposal declined.')
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to process proposal.';
      toast.error(msg);
    } finally {
      setRespondingProposal(false);
    }
  };

  // Side A confirms after Side B accepted (both sides must accept)
  const handleConfirmProposal = async () => {
    if (!trade?.id) return;
    try {
      setRespondingProposal(true);
      const updated = await artTradeService.confirmProposal(trade.id);
      setTrade(updated);
      toast.success(isVie ? 'Cả hai bên đã chấp nhận! Phòng trao đổi tranh đã bắt đầu.' : 'Both sides accepted! Trade Room is now open.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to confirm proposal.';
      toast.error(msg);
    } finally {
      setRespondingProposal(false);
    }
  };

  // Handle cancelling proposal by initiator
  const handleCancelProposal = async () => {
    if (!trade?.id) return;
    const confirmMsg = isVie
      ? 'Bạn có chắc chắn muốn hủy đề nghị trao đổi tranh này không?'
      : 'Are you sure you want to cancel this trade proposal?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setRespondingProposal(true);
      const updated = await artTradeService.cancel(trade.id, { reason: 'Initiator cancelled proposal before acceptance' });
      setTrade(updated);
      toast.success(isVie ? 'Đã hủy đề nghị trao đổi.' : 'Trade proposal cancelled.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel proposal.';
      toast.error(msg);
    } finally {
      setRespondingProposal(false);
    }
  };

  // Handle artwork submission upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, side: 'initiator' | 'receiver') => {
    const file = event.target.files?.[0];
    if (!file || !trade?.id) return;

    try {
      setUploadingSide(side);
      const updated = await artTradeService.submitArtwork(trade.id, file);
      setTrade(updated);
      toast.success(isVie ? 'Đã nộp tranh và tạo ảnh watermark thành công!' : 'Artwork submitted & watermarked preview generated!');
    } catch (err: unknown) {
      console.error(err);
      toast.error(isVie ? 'Tải tranh lên thất bại. Vui lòng kiểm tra định dạng file (PNG, JPG, PSD, CLIP).' : 'Failed to upload artwork. Please verify format (PNG, JPG, PSD, CLIP).');
    } finally {
      setUploadingSide(null);
    }
  };

  // Handle trade cancellation with modal
  const handleConfirmCancelTrade = async () => {
    if (!trade?.id) return;
    const finalReason = cancelReason.trim();
    if (!finalReason) {
      toast.error(isVie ? 'Vui lòng nhập lý do hủy giao dịch.' : 'Please enter a cancellation reason.');
      return;
    }

    try {
      setCancelling(true);
      const updated = await artTradeService.cancel(trade.id, { reason: finalReason });
      setTrade(updated);
      setShowCancelModal(false);
      setCancelReason('');
      toast.success(isVie ? 'Đã hủy cuộc trao đổi tranh.' : 'Trade cancelled successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel trade.';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  // Handle confirmation
  const handleConfirmSatisfaction = async (side: 'initiator' | 'receiver') => {
    if (!trade?.id) return;

    try {
      setConfirming(true);
      const updated = await artTradeService.confirm(trade.id, side);
      setTrade(updated);
      toast.success(isVie ? 'Đã xác nhận hài lòng!' : 'Satisfaction confirmed!');
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || (isVie ? 'Không thể xác nhận sự hài lòng.' : 'Could not confirm trade satisfaction.'));
    } finally {
      setConfirming(false);
    }
  };

  const isWatermarkRemoved =
    trade?.status === 'Completed' ||
    (trade?.status as unknown) === 4 ||
    (trade?.status as unknown) === '4' ||
    (Boolean(trade?.isInitiatorConfirmed) && Boolean(trade?.isReceiverConfirmed));

  const getStatusBadge = (status: TradeStatus) => {
    const s = status as unknown;
    if (s === 'Proposed' || s === 1 || s === '1') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" /> {isVie ? 'Chờ phản hồi đề nghị' : 'Proposal Pending'}
        </span>
      );
    }
    if (s === 'Accepted' || s === 2 || s === '2') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Clock className="w-3.5 h-3.5" /> {isVie ? 'Giai đoạn vẽ tranh' : 'Drawing Phase'}
        </span>
      );
    }
    if (s === 'BothSubmitted' || s === 3 || s === '3') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5" /> {isVie ? 'Đã nộp cả hai bên (Chờ duyệt)' : 'Both Submitted (Under Review)'}
        </span>
      );
    }
    if (s === 'Completed' || s === 4 || s === '4') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> {isVie ? 'Giao dịch hoàn tất' : 'Trade Completed'}
        </span>
      );
    }
    if (s === 'Disputed' || s === 7 || s === '7') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <AlertCircle className="w-3.5 h-3.5" /> {isVie ? 'Đang có khiếu nại' : 'Under Dispute'}
        </span>
      );
    }
    if (s === 'Cancelled' || s === 'Rejected' || s === 5 || s === '5' || s === 6 || s === '6') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/30">
          <XCircle className="w-3.5 h-3.5" /> {isVie ? 'Đã kết thúc / Hủy' : 'Cancelled / Rejected'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-300 border border-gray-500/30">
        {status}
      </span>
    );
  };

  /* =========================================================================
     VIEW 1: PROPOSAL PENDING STAGE (Chưa accept proposal)
     Revert lại layout 2 bên đối ứng nhưng giữ hướng dẫn mô tả chung & cho phép
     Side B edit yêu cầu vẽ và đính kèm nhiều ảnh tham khảo (CreatorProfile style).
     ========================================================================= */
  if (isProposed) {
    const parsedInitiatorNote = parseNoteWithAttachments(trade.initiatorRequestNote);
    const parsedReceiverNote = parseNoteWithAttachments(trade.receiverRequestNote);
    const parsedReceiverResponse = parseNoteWithAttachments(trade.receiverResponseNote);

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/art-trades"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>{isVie ? 'Quay lại danh sách Trao đổi' : 'Back to My Trades'}</span>
          </Link>
        </div>

        <div className="glass-container rounded-3xl p-6 md:p-10 border border-white/10 bg-[#14151e]/85 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="pb-8 mb-8 border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {isVie ? 'Đề nghị trao đổi tranh' : 'Art Trade Proposal'}
              </span>
              <span className="text-gray-500">•</span>
              {getStatusBadge(trade.status)}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-h1">
              {trade.title}
            </h1>

            {/* Hướng dẫn & Mô tả chung - Giữ lại như yêu cầu */}
            {trade.description && (
              <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">
                  {isVie ? 'Hướng dẫn & Mô tả chung' : 'General Overview & Guidelines'}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {trade.description}
                </p>
              </div>
            )}

            {trade.submissionDeadlineAt && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {isVie ? 'Hạn hoàn thành tranh dự kiến:' : 'Proposed Deadline:'}{' '}
                  <strong className="text-white">{new Date(trade.submissionDeadlineAt).toLocaleDateString()}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Two Participant Avatars */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            {/* Initiator */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full border-2 border-indigo-500/50 overflow-hidden bg-indigo-950/60 flex items-center justify-center shrink-0">
                {trade.initiator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trade.initiator.avatarUrl} alt={trade.initiator.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-indigo-200">{trade.initiator.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                  {isVie ? 'Người khởi tạo (Side A)' : 'Initiator (Side A)'}
                </span>
                <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  {trade.initiator.fullName}
                  {isCurrentUserInitiator && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {isVie ? 'Bạn' : 'You'}
                    </span>
                  )}
                </h4>
              </div>
            </div>

            {/* Exchange Symbol */}
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
            </div>

            {/* Receiver */}
            <div className="flex items-center gap-3.5 justify-start md:justify-end text-left md:text-right">
              <div className="min-w-0 order-2 md:order-1">
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">
                  {isVie ? 'Người nhận (Side B)' : 'Receiver (Side B)'}
                </span>
                <h4 className="text-sm font-bold text-white truncate flex items-center justify-start md:justify-end gap-1.5">
                  {trade.receiver.fullName}
                  {isCurrentUserReceiver && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {isVie ? 'Bạn' : 'You'}
                    </span>
                  )}
                </h4>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-purple-500/50 overflow-hidden bg-purple-950/60 flex items-center justify-center shrink-0 order-1 md:order-2">
                {trade.receiver.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trade.receiver.avatarUrl} alt={trade.receiver.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-purple-200">{trade.receiver.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Proposal Pledges & Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Side A pledge */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block mb-2">
                  {isVie ? `Cam kết vẽ từ ${trade.initiator.fullName} (Side A)` : `What ${trade.initiator.fullName} pledges to draw`}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {parsedInitiatorNote.text || (isVie ? 'Sáng tác tranh nguyên tác theo yêu cầu trao đổi.' : 'Pledged custom artwork.')}
                </p>

                {/* Side A Reference Images (Read-only Gallery) */}
                {parsedInitiatorNote.images.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-indigo-500/10">
                    <span className="text-[10px] uppercase tracking-wider text-indigo-400/80 font-semibold block mb-2">
                      {isVie ? `Ảnh mẫu tham khảo (${parsedInitiatorNote.images.length})` : `Reference Images (${parsedInitiatorNote.images.length})`}
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {parsedInitiatorNote.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewModalUrl(imgUrl)}
                          className="relative aspect-square rounded-xl overflow-hidden border border-indigo-500/20 bg-black/40 cursor-pointer hover:border-indigo-400 group transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Ref" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side B request - READ ONLY (Partner's request sent to Side B) */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    {isVie ? `Yêu cầu vẽ từ đối tác (${trade.initiator.fullName} gửi cho ${trade.receiver.fullName})` : `What ${trade.initiator.fullName} requested from ${trade.receiver.fullName}`}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {parsedReceiverNote.text || (isVie ? 'Chưa có mô tả yêu cầu cụ thể.' : 'Requested artwork details.')}
                  </p>

                  {/* Partner's Reference Images (Read-only Gallery) */}
                  {parsedReceiverNote.images.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-purple-500/10">
                      <span className="text-[10px] uppercase tracking-wider text-purple-400/80 font-semibold block mb-2">
                        {isVie ? `Ảnh mẫu tham khảo (${parsedReceiverNote.images.length})` : `Reference Images (${parsedReceiverNote.images.length})`}
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {parsedReceiverNote.images.map((imgUrl, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewModalUrl(imgUrl)}
                            className="relative aspect-square rounded-xl overflow-hidden border border-purple-500/20 bg-black/40 cursor-pointer hover:border-purple-400 group transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt="Ref" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Creator's Own Request / Response Section (Mục riêng cho Creator thêm ảnh của riêng mình) */}
          <div className="mb-8 p-6 rounded-2xl bg-[#171827] border border-purple-500/30 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">
                  {isCurrentUserReceiver
                    ? (isVie ? 'Yêu cầu & Ảnh mẫu của riêng bạn (Creator)' : 'Your Request & Reference Images')
                    : (isVie ? `Yêu cầu & Ảnh mẫu từ Creator (${trade.receiver.fullName})` : `Creator's Request & References (${trade.receiver.fullName})`)}
                </h3>
              </div>
              {isCurrentUserReceiver && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  {isVie ? 'Mục riêng của Creator' : 'Creator Section'}
                </span>
              )}
            </div>

            {isCurrentUserReceiver && !trade.receiverAcceptedAt ? (
              /* Editable for Creator */
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-gray-300 font-semibold mb-1.5">
                    {isVie ? 'Mô tả / Yêu cầu vẽ bạn muốn đối tác thực hiện cho bạn (Tùy chọn):' : 'What you would like your partner to draw for you (Optional):'}
                  </label>
                  <textarea
                    value={sideBNote}
                    onChange={(e) => setSideBNote(e.target.value)}
                    placeholder={isVie ? 'Mô tả chi tiết nhân vật, trang phục, dáng vẽ, hoặc phong cách bạn muốn đối tác vẽ cho mình...' : 'Describe character, outfit, pose or style you want them to draw for you...'}
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-[#10111a] border border-purple-500/30 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                  />
                </div>

                {/* Creator Multiple Image Upload Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold">
                      {isVie ? 'Ảnh mẫu tham khảo của riêng bạn (Đính kèm nhiều ảnh)' : 'Your Reference Images (Attach multiple)'}
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {sideBImages.length} {isVie ? 'ảnh đã chọn' : 'selected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {sideBImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-purple-500/40 bg-black/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Creator Ref ${idx + 1}`}
                          onClick={() => setPreviewModalUrl(imgUrl)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSideBImage(idx)}
                          className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white hover:bg-rose-600 transition flex cursor-pointer shadow-md"
                          title={isVie ? 'Xóa ảnh này' : 'Remove image'}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-purple-400/40 bg-purple-950/20 text-purple-300 hover:border-purple-400 hover:bg-purple-900/30 hover:text-white transition">
                      {isUploadingSideBAttachment ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mb-0.5" />
                          <span className="text-[10px] font-medium">{isVie ? 'Thêm ảnh' : 'Add image'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingSideBAttachment}
                        onChange={handleUploadSideBAttachment}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Read-only for Initiator or other users */
              <div>
                {parsedReceiverResponse.text || parsedReceiverResponse.images.length > 0 ? (
                  <div>
                    {parsedReceiverResponse.text && (
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap mb-3">
                        {parsedReceiverResponse.text}
                      </p>
                    )}
                    {parsedReceiverResponse.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {parsedReceiverResponse.images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewModalUrl(imgUrl)}
                            className="relative aspect-square overflow-hidden rounded-xl border border-purple-500/30 bg-black/40 cursor-pointer hover:border-purple-400 group transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt="Creator Ref" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {isVie
                      ? 'Họa sĩ chưa cập nhật ghi chú hoặc ảnh mẫu của riêng mình (sẽ được bổ sung khi họa sĩ xác nhận đề nghị).'
                      : 'The creator has not yet added their own notes or reference images.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* DECISION & ACTION PANEL */}
          {isReceiverRole && trade.receiverAcceptedAt ? (
            /* Receiver already accepted -> waiting for Side A */
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1.5">
                {isVie ? 'Bạn đã chấp nhận đề nghị' : 'You accepted this proposal'}
              </h3>
              <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                {isVie
                  ? `Đang chờ ${trade.initiator.fullName} xác nhận lại. Trade Room chỉ mở khi cả hai bên cùng chấp nhận.`
                  : `Waiting for ${trade.initiator.fullName} to confirm. The Trade Room opens once both sides accept.`}
              </p>
            </div>
          ) : isReceiverRole ? (
            /* Receiver sees Accept / Decline buttons */
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900 border border-indigo-500/30 text-center">
              <h3 className="text-base font-bold text-white mb-1.5">
                {isVie ? `Bạn nhận được đề nghị trao đổi tranh từ ${trade.initiator.fullName}` : `You received this trade proposal from ${trade.initiator.fullName}`}
              </h3>
              <p className="text-xs text-gray-300 max-w-lg mx-auto mb-5 leading-relaxed">
                {isVie
                  ? 'Bạn có thể chỉnh sửa yêu cầu và ảnh mẫu mong muốn ở khung trên. Sau khi bạn chấp nhận, đối tác cần xác nhận lại; phòng vẽ tranh (Trade Room) chỉ mở khi cả hai bên cùng chấp nhận.'
                  : 'You can edit your drawing requests and attach reference images above. After you accept, your partner must confirm too; the Trade Room unlocks only when both sides accept.'}
              </p>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleRespondProposal(false)}
                  disabled={respondingProposal}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold text-gray-300 transition cursor-pointer disabled:opacity-50"
                >
                  {isVie ? 'Từ chối' : 'Decline Proposal'}
                </button>

                <button
                  type="button"
                  onClick={() => handleRespondProposal(true)}
                  disabled={respondingProposal}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {respondingProposal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {isVie ? 'Đang xử lý...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> {isVie ? 'Chấp nhận đề nghị' : 'Accept Proposal'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Initiator sees waiting state / confirm state */
            trade.receiverAcceptedAt ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <h3 className="text-base font-bold text-white mb-1.5">
                {isVie ? `${trade.receiver.fullName} đã chấp nhận đề nghị` : `${trade.receiver.fullName} accepted your proposal`}
              </h3>
              <p className="text-xs text-gray-300 max-w-md mx-auto mb-5 leading-relaxed">
                {isVie
                  ? 'Hãy xem lại yêu cầu & ảnh mẫu của đối tác ở trên. Khi bạn xác nhận, phòng vẽ tranh sẽ chính thức mở.'
                  : 'Review your partner’s request and references above. Once you confirm, the Trade Room opens.'}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleCancelProposal}
                  disabled={respondingProposal}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold text-gray-300 transition cursor-pointer disabled:opacity-50"
                >
                  {isVie ? 'Hủy đề nghị' : 'Cancel Proposal'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProposal}
                  disabled={respondingProposal}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {respondingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isVie ? 'Xác nhận & bắt đầu' : 'Confirm & Start'}
                </button>
              </div>
            </div>
            ) : (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                {isVie ? `Đang chờ ${trade.receiver.fullName} phản hồi` : `Waiting for ${trade.receiver.fullName} to accept`}
              </h3>
              <p className="text-xs text-gray-300 max-w-md mx-auto mb-5 leading-relaxed">
                {isVie
                  ? 'Đề nghị của bạn đã được gửi thành công. Phòng vẽ tranh (Trade Room) sẽ mở ngay sau khi đối tác chấp nhận lời mời.'
                  : 'Your proposal was sent. The Trade Room will unlock as soon as your partner accepts.'}
              </p>

              <button
                type="button"
                onClick={handleCancelProposal}
                disabled={respondingProposal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-gray-400 text-xs font-semibold border border-white/10 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isVie ? 'Hủy lời mời này' : 'Cancel Proposal'}</span>
              </button>
            </div>
            )
          )}

          {/* Safe Escrow Notice */}
          <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-gray-400">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              {isVie
                ? 'Phòng nộp tranh gốc và cấp watermark xem trước chỉ mở sau khi lời mời được chấp nhận. Toàn bộ quá trình được bảo hộ bởi hệ thống Escrow không tính phí.'
                : 'Artwork submission and watermark preview generation will unlock once the proposal is accepted. Both sides are protected by zero-fee escrow.'}
            </p>
          </div>
        </div>

        {/* Image Preview Lightbox Modal */}
        {previewModalUrl && (
          <div
            onClick={() => setPreviewModalUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-[#161722]" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewModalUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  /* =========================================================================
     VIEW 2: CANCELLED OR REJECTED STAGE
     ========================================================================= */
  if (isCancelledOrRejected) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="glass-container rounded-3xl p-8 md:p-12 border border-white/10 bg-[#14151e]/80 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            {trade.status === 'Rejected'
              ? (isVie ? 'Đề nghị trao đổi đã bị từ chối' : 'Trade Proposal Declined')
              : (isVie ? 'Cuộc trao đổi tranh đã bị hủy' : 'Art Trade Cancelled')}
          </h2>
          <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">
            {trade.rejectionReason || trade.cancellationReason || (isVie ? 'Phiên trao đổi này đã kết thúc.' : 'This trade session has ended.')}
          </p>
          <Link
            href="/art-trades"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" /> {isVie ? 'Quay lại danh sách Trao đổi' : 'Back to My Trades'}
          </Link>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VIEW 3: ACTIVE DRAWING ROOM (Accepted / BothSubmitted / Completed)
     ========================================================================= */
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/art-trades"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>{isVie ? 'Quay lại danh sách Trao đổi' : 'Back to My Trades'}</span>
        </Link>
      </div>

      {/* Trade Dispute Status Banner (shown when trade is currently under dispute) */}
      {isDisputed && (
        <TradeDisputeBanner trade={trade} className="mb-6" />
      )}

      {/* Main Trade Room Container */}
      <div
        className="glass-container rounded-3xl p-6 md:p-10 border border-white/10 bg-[#14151e]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        {/* Subtle Ambient Background Glows */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header with Title and Status */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                {isVie ? 'Phòng trao đổi tranh' : 'Art Trade Station'}
              </span>
              <span className="text-gray-500">•</span>
              {getStatusBadge(trade.status)}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-h1">
              {trade.title}
            </h1>
            {trade.description && (
              <p className="text-sm text-gray-400 mt-1 max-w-2xl">{trade.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Secure Trade Protection / Completion Badge */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs border ${
              isWatermarkRemoved
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300'
            }`}>
              {isWatermarkRemoved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isVie ? 'Giao dịch hoàn tất • Đã gỡ bỏ Watermark' : 'Trade Completed • Watermarks Removed'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{isVie ? 'Watermark xem trước & Ký quỹ an toàn' : 'Watermarked Preview & Dual Escrow Protection'}</span>
                </>
              )}
            </div>

            {/* Quick Switch to Chat */}
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-900/30'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>{isVie ? 'Phòng trò chuyện' : 'Trade Chat'}</span>
            </button>
          </div>
        </div>

        {/* TWO PARTICIPANT AVATARS */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 mb-10">
          {/* Participant A (Initiator) Avatar Circle */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-3">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-indigo-500/60 shadow-xl overflow-hidden ring-4 ring-indigo-500/20 bg-gradient-to-tr from-indigo-900 to-slate-800 flex items-center justify-center">
                {trade.initiator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={trade.initiator.avatarUrl}
                    alt={trade.initiator.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl md:text-3xl font-bold text-indigo-200">
                    {trade.initiator.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-semibold text-white text-base md:text-lg flex items-center justify-center gap-1.5">
                {trade.initiator.fullName}
                {isCurrentUserInitiator && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {isVie ? 'Bạn' : 'You'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-indigo-300 font-medium">Initiator (Side A)</p>
            </div>
          </div>

          {/* Center Trade Crest / Exchange Arrows */}
          <div className="flex flex-col items-center justify-center py-2 md:py-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300 shadow-inner group hover:scale-105 transition">
              <ArrowLeftRight className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mt-2">
              Exchange
            </span>
          </div>

          {/* Participant B (Receiver) Avatar Circle */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-3">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-purple-500/60 shadow-xl overflow-hidden ring-4 ring-purple-500/20 bg-gradient-to-tr from-purple-900 to-slate-800 flex items-center justify-center">
                {trade.receiver.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={trade.receiver.avatarUrl}
                    alt={trade.receiver.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl md:text-3xl font-bold text-purple-200">
                    {trade.receiver.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-semibold text-white text-base md:text-lg flex items-center justify-center gap-1.5">
                {trade.receiver.fullName}
                {isCurrentUserReceiver && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {isVie ? 'Bạn' : 'You'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-purple-300 font-medium">Receiver (Side B)</p>
            </div>
          </div>
        </div>

        {/* TAB NAVBAR: Reference <-> Artwork Submission <-> Trade Chat */}
        <div className="mb-6 flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {([
            { key: 'reference', label: isVie ? 'Tham khảo' : 'Reference', Icon: ImageIcon },
            { key: 'submission', label: isVie ? 'Nộp tranh' : 'Artwork Submission', Icon: Upload },
            { key: 'chat', label: isVie ? 'Phòng trao đổi' : 'Trade Chat', Icon: MessageSquare },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1 — REFERENCE */}
        {activeTab === 'reference' && (
        <section className="mb-8">
        {(() => {
          const parsedInit = parseNoteWithAttachments(trade.initiatorRequestNote);
          const parsedRecv = parseNoteWithAttachments(trade.receiverRequestNote);
          const parsedResp = parseNoteWithAttachments(trade.receiverResponseNote);
          const hasResp = !!(parsedResp.text || parsedResp.images.length > 0);
          return (
            <div className="space-y-6">
              {/* Line 1: Pledge (Side A) + Request (Side B), side by side with distinct colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 min-h-[260px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-3">
                    {isVie ? `Cam kết vẽ từ ${trade.initiator.fullName} (Side A)` : `What ${trade.initiator.fullName} pledges to draw`}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {parsedInit.text || (isVie ? 'Sáng tác tranh nguyên tác theo yêu cầu.' : 'Custom artwork.')}
                  </p>
                  {parsedInit.images.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-indigo-500/10">
                      <span className="text-[11px] uppercase tracking-wider text-indigo-400/80 font-semibold block mb-3">
                        {isVie ? `Ảnh mẫu tham khảo (${parsedInit.images.length})` : `Reference Images (${parsedInit.images.length})`}
                      </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {parsedInit.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewModalUrl(imgUrl)}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-indigo-500/20 bg-black/40 cursor-pointer hover:border-indigo-400 group transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Ref" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                      ))}
                    </div>
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 min-h-[260px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-3">
                    {isVie ? `Yêu cầu vẽ từ đối tác (${trade.initiator.fullName} gửi cho ${trade.receiver.fullName})` : `What ${trade.initiator.fullName} requested from ${trade.receiver.fullName}`}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {parsedRecv.text || (isVie ? 'Chưa có mô tả yêu cầu cụ thể.' : 'Requested artwork details.')}
                  </p>
                  {parsedRecv.images.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-purple-500/10">
                      <span className="text-[11px] uppercase tracking-wider text-purple-400/80 font-semibold block mb-3">
                        {isVie ? `Ảnh mẫu tham khảo (${parsedRecv.images.length})` : `Reference Images (${parsedRecv.images.length})`}
                      </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {parsedRecv.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewModalUrl(imgUrl)}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-purple-500/20 bg-black/40 cursor-pointer hover:border-purple-400 group transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Ref" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                      ))}
                    </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Line 2: Creator's own references */}
              <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/20 min-h-[200px]">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-3">
                  {isVie ? `Yêu cầu & Ảnh mẫu từ Creator (${trade.receiver.fullName})` : `Creator's Request & References (${trade.receiver.fullName})`}
                </span>
                {hasResp ? (
                  <>
                    {parsedResp.text && (
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{parsedResp.text}</p>
                    )}
                    {parsedResp.images.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-amber-500/10">
                        <span className="text-[11px] uppercase tracking-wider text-amber-400/80 font-semibold block mb-3">
                          {isVie ? `Ảnh mẫu từ Creator (${parsedResp.images.length})` : `Creator Images (${parsedResp.images.length})`}
                        </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {parsedResp.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewModalUrl(imgUrl)}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-amber-500/20 bg-black/40 cursor-pointer hover:border-amber-400 group transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Ref" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                      ))}
                    </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {isVie ? 'Creator chưa thêm ghi chú hoặc ảnh mẫu riêng.' : 'The creator has not added their own notes or reference images.'}
                  </p>
                )}
              </div>
            </div>
          );
        })()}
        </section>
        )}

        {/* TAB 2 — ARTWORK SUBMISSION */}
        {activeTab === 'submission' && (
        <section className="mb-8">

        {/* TWO ROUND-CORNERED SQUARES FOR SUBMITTED ARTWORK (APPLIED WATERMARK) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Square A: Initiator's Submitted Artwork */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2 px-1">
              <span>{trade.initiator.fullName}&apos;s Artwork</span>
              {trade.initiatorSubmittedAt ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pending Artwork
                </span>
              )}
            </div>

            {/* Round-cornered Square Container */}
            <div className="relative aspect-square w-full rounded-2xl md:rounded-3xl border-2 border-white/10 bg-[#161722] overflow-hidden group shadow-2xl flex flex-col items-center justify-center">
              {trade.initiatorPreviewUrl ? (
                <>
                  {/* The Artwork Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trade.initiatorPreviewUrl}
                    alt="Side A Submitted Artwork"
                    onClick={() => setPreviewModalUrl(trade.initiatorPreviewUrl || null)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    title={isVie ? 'Click để phóng to tác phẩm' : 'Click to zoom artwork'}
                  />

                  {isWatermarkRemoved ? (
                    /* Watermark Removed Badge Indicator */
                    <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isVie ? 'Đã gỡ Watermark' : 'Watermark Removed'}</span>
                    </div>
                  ) : (
                    <>
                      {/* Watermark Diagonal Overlay */}
                      <div className="absolute inset-0 bg-black/25 pointer-events-none flex items-center justify-center overflow-hidden">
                        <div className="select-none text-white/30 font-black text-xl md:text-2xl tracking-[0.3em] uppercase -rotate-45 border-y-2 border-white/20 py-3 px-12 text-center whitespace-nowrap bg-black/40 backdrop-blur-[1px]">
                          DILLUSTRATION • PREVIEW ONLY
                        </div>
                      </div>

                      {/* Watermark Badge Indicator */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[11px] text-white/90 font-medium flex items-center gap-1.5 shadow-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Watermark Protected</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Empty / Upload State for Side A */
                <div className="p-6 text-center flex flex-col items-center justify-center w-full h-full">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-4">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">No Artwork Submitted Yet</h4>
                  <p className="text-xs text-gray-400 max-w-xs mb-4">
                    {isCurrentUserInitiator
                      ? 'Upload your finished original file (PNG, JPG, PSD, CLIP). The system will automatically apply a watermark preview.'
                      : 'Waiting for partner to finish and upload artwork preview.'}
                  </p>

                  {isCurrentUserInitiator && (
                    <>
                      <input
                        type="file"
                        ref={initiatorFileInputRef}
                        accept=".png,.jpg,.jpeg,.psd,.clip"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'initiator')}
                      />
                      <button
                        type="button"
                        onClick={() => initiatorFileInputRef.current?.click()}
                        disabled={uploadingSide === 'initiator' || isDisputed}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingSide === 'initiator' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" /> Submit Artwork
                          </>
                        )}
                      </button>
                      {isDisputed && (
                        <span className="text-[11px] text-red-400 mt-2 block">
                          {isVie ? 'Tạm khóa do đang có khiếu nại' : 'Submission locked due to active dispute'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Square B: Receiver's Submitted Artwork */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2 px-1">
              <span>{trade.receiver.fullName}&apos;s Artwork</span>
              {trade.receiverSubmittedAt ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pending Artwork
                </span>
              )}
            </div>

            {/* Round-cornered Square Container */}
            <div className="relative aspect-square w-full rounded-2xl md:rounded-3xl border-2 border-white/10 bg-[#161722] overflow-hidden group shadow-2xl flex flex-col items-center justify-center">
              {trade.receiverPreviewUrl ? (
                <>
                  {/* The Artwork Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trade.receiverPreviewUrl}
                    alt="Side B Submitted Artwork"
                    onClick={() => setPreviewModalUrl(trade.receiverPreviewUrl || null)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    title={isVie ? 'Click để phóng to tác phẩm' : 'Click to zoom artwork'}
                  />

                  {isWatermarkRemoved ? (
                    /* Watermark Removed Badge Indicator */
                    <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isVie ? 'Đã gỡ Watermark' : 'Watermark Removed'}</span>
                    </div>
                  ) : (
                    <>
                      {/* Watermark Diagonal Overlay */}
                      <div className="absolute inset-0 bg-black/25 pointer-events-none flex items-center justify-center overflow-hidden">
                        <div className="select-none text-white/30 font-black text-xl md:text-2xl tracking-[0.3em] uppercase -rotate-45 border-y-2 border-white/20 py-3 px-12 text-center whitespace-nowrap bg-black/40 backdrop-blur-[1px]">
                          DILLUSTRATION • PREVIEW ONLY
                        </div>
                      </div>

                      {/* Watermark Badge Indicator */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[11px] text-white/90 font-medium flex items-center gap-1.5 shadow-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Watermark Protected</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Empty / Upload State for Side B */
                <div className="p-6 text-center flex flex-col items-center justify-center w-full h-full">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-4">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">No Artwork Submitted Yet</h4>
                  <p className="text-xs text-gray-400 max-w-xs mb-4">
                    {isCurrentUserReceiver
                      ? 'Upload your finished original file (PNG, JPG, PSD, CLIP). The system will automatically apply a watermark preview.'
                      : 'Waiting for partner to finish and upload artwork preview.'}
                  </p>

                  {isCurrentUserReceiver && (
                    <>
                      <input
                        type="file"
                        ref={receiverFileInputRef}
                        accept=".png,.jpg,.jpeg,.psd,.clip"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'receiver')}
                      />
                      <button
                        type="button"
                        onClick={() => receiverFileInputRef.current?.click()}
                        disabled={uploadingSide === 'receiver' || isDisputed}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingSide === 'receiver' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" /> Submit Artwork
                          </>
                        )}
                      </button>
                      {isDisputed && (
                        <span className="text-[11px] text-red-400 mt-2 block">
                          {isVie ? 'Tạm khóa do đang có khiếu nại' : 'Submission locked due to active dispute'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TWO PARTS FOR CONFIRMATION BUTTONS FOR BOTH PARTIES — Both can confirm satisfaction at the same time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
          {/* Confirmation Part A (For Participant 1) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-300">
                {trade.initiator.fullName}&apos;s Confirmation
              </span>
              {trade.isInitiatorConfirmed ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pending Confirmation</span>
              )}
            </div>

            {trade.isInitiatorConfirmed ? (
              <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmed Satisfaction</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmSatisfaction('initiator')}
                disabled={confirming || isDisputed}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm Satisfaction
                  </>
                )}
              </button>
            )}
            {isDisputed && !trade.isInitiatorConfirmed && (
              <p className="text-[11px] text-red-400 mt-2 text-center">
                {isVie ? 'Tạm khóa do đang có khiếu nại' : 'Locked due to active dispute'}
              </p>
            )}
          </div>

          {/* Confirmation Part B (For Participant 2) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-purple-300">
                {trade.receiver.fullName}&apos;s Confirmation
              </span>
              {trade.isReceiverConfirmed ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pending Confirmation</span>
              )}
            </div>

            {trade.isReceiverConfirmed ? (
              <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmed Satisfaction</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmSatisfaction('receiver')}
                disabled={confirming || isDisputed}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm Satisfaction
                  </>
                )}
              </button>
            )}
            {isDisputed && !trade.isReceiverConfirmed && (
              <p className="text-[11px] text-red-400 mt-2 text-center">
                {isVie ? 'Tạm khóa do đang có khiếu nại' : 'Locked due to active dispute'}
              </p>
            )}
          </div>
        </div>

        {/* Cancellation & Dispute Bar at Bottom of VIEW 3 */}
        {trade.status !== 'Completed' && (
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold text-gray-300 block">
                {isDisputed
                  ? (isVie ? 'Giao dịch đang có khiếu nại tranh chấp' : 'Trade Under Active Dispute')
                  : (isVie ? 'Vấn đề phát sinh hoặc hủy giao dịch?' : 'Need to report an issue or cancel?')}
              </span>
              <span className="text-[11px] text-gray-500">
                {isDisputed
                  ? (isVie
                    ? 'Quản trị viên đang phân xử hồ sơ. Các thao tác hủy hoặc hoàn tất tạm thời bị khóa.'
                    : 'Administrators are arbitrating. Cancellation and completion are locked.')
                  : (isVie
                    ? 'Bạn có thể hủy nếu hai bên đồng thuận, hoặc gửi khiếu nại nếu đối tác nộp tranh AI, vi phạm bản quyền.'
                    : 'You can cancel by mutual agreement, or file a dispute if your partner submitted AI art or violated terms.')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {isAccepted && !isCompleted && !isDisputed && (
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition cursor-pointer"
                >
                  <Gavel className="w-4 h-4 text-red-400" />
                  <span>{isVie ? 'Khiếu nại vi phạm' : 'Raise Dispute'}</span>
                </button>
              )}

              {!isDisputed && (
                <button
                  type="button"
                  onClick={() => {
                    setCancelReason('');
                    setShowCancelModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>{isVie ? 'Hủy giao dịch này' : 'Cancel This Trade'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        </section>
        )}

        {/* TAB 3 — TRADE CHAT ROOM */}
        {activeTab === 'chat' && (
          <section className="mb-8">
            <TradeChatRoom
              trade={trade}
              currentUser={currentUser}
              onOpenDispute={() => setShowDisputeModal(true)}
            />
          </section>
        )}

        {/* COMPLETED CELEBRATION (No download button, watermark removed on both sides) */}
        {trade.status === 'Completed' && (
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-indigo-950/60 border border-emerald-500/30 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isVie ? 'Giao dịch trao đổi hoàn tất thành công!' : 'Art Trade Successfully Completed!'}
            </h3>
            <p className="text-xs text-gray-300 max-w-md">
              {isVie
                ? 'Cả hai bên đã xác nhận hài lòng. Hình mờ (watermark) đã được gỡ bỏ hoàn toàn cho tác phẩm của cả hai bên.'
                : 'Both parties have confirmed satisfaction. Watermarks have been removed from the artworks of both sides.'}
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-[#161722]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewModalUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Modal Dialog */}
      {showCancelModal && (
        <div
          onClick={() => setShowCancelModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#161726] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isVie ? 'Hủy cuộc trao đổi tranh' : 'Cancel Art Trade'}
                </h3>
                <p className="text-xs text-gray-400">
                  {isVie ? 'Thao tác này sẽ chấm dứt lượt trao đổi và không thể hoàn tác.' : 'This will end the trade session and cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-gray-300">
                {isVie ? 'Lý do hủy giao dịch *' : 'Reason for cancellation *'}
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  isVie ? 'Hai bên thỏa thuận hủy' : 'Mutual agreement',
                  isVie ? 'Đối tác không phản hồi' : 'Partner unresponsive',
                  isVie ? 'Thay đổi kế hoạch cá nhân' : 'Change of plans',
                  isVie ? 'Không thống nhất được yêu cầu vẽ' : 'Cannot agree on request',
                ].map((quickR) => (
                  <button
                    key={quickR}
                    type="button"
                    onClick={() => setCancelReason(quickR)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      cancelReason === quickR
                        ? 'bg-rose-500/25 border-rose-500/50 text-rose-200 font-semibold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {quickR}
                  </button>
                ))}
              </div>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isVie ? 'Nhập chi tiết lý do bạn muốn hủy giao dịch này...' : 'Describe why you want to cancel this trade...'}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#10111a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition cursor-pointer"
              >
                {isVie ? 'Đóng' : 'Keep Trade'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelTrade}
                disabled={cancelling || !cancelReason.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isVie ? 'Đang hủy...' : 'Cancelling...'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isVie ? 'Xác nhận hủy' : 'Confirm Cancel'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Dispute Filing Modal */}
      {trade && (
        <TradeDisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          trade={trade}
          onDisputeSuccess={(updated) => {
            if (updated) {
              setTrade(updated);
            } else if (trade.id) {
              void artTradeService.getById(trade.id).then(setTrade);
            }
          }}
        />
      )}
    </div>
  );
}

export default TradeStation;
