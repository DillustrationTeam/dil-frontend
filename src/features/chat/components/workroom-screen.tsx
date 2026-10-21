'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  Clock,
  Download,
  Eye,
  FileArchive,
  FileText,
  Globe,
  Lock,
  Maximize2,
  Paperclip,
  RefreshCw,
  Send,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react';

import { chatService } from '../services/chat.service';
import { WorkroomProgressPanel } from './workroom-progress-panel';
import { useChatHub } from '../hooks/use-chat-hub';
import { useAutoTranslate } from '../hooks/use-auto-translate';
import type { ChatMessageDto, ChatRoomDto } from '../types/chat.types';
import { PageLoader } from '@/features/navigation';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { Commission, CommissionStatus, Milestone } from '@/types/commission.types';

import SubmitMilestoneModal from '@/components/modals/SubmitMilestoneModal';
import ApprovalRevisionModal from '@/components/modals/ApprovalRevisionModal';
import FinalDeliveryModal from '@/components/modals/FinalDeliveryModal';
import CreatorReplyModal from '@/components/modals/CreatorReplyModal';
import DisputeDetailsModal from '@/components/modals/DisputeDetailsModal';
import ReviewRatingModal from '@/components/modals/ReviewRatingModal';
import CancelRefundModal from '@/components/modals/CancelRefundModal';
import RaiseDisputeModal from '@/components/modals/RaiseDisputeModal';
import WorkroomTermsModal from '@/components/modals/WorkroomTermsModal';

/** Tin nhắn đã hiện trên UI nhưng server chưa phát lại (chờ SignalR). */
interface PendingMessage {
  tempId: string;
  body: string;
}

const workroomMessageSchema = z.string().trim().max(4000, 'Tin nhắn tối đa 4000 ký tự.');

/** Trích xuất URL hoàn chỉnh cho attachment / WIP preview (ghép API host nếu url dạng tương đối). */
function resolveAttachmentUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5075/api/v1';
  const origin = baseUrl.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function WorkroomScreen({ roomId, userId }: { roomId: string; userId: string | null }) {
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputBody, setInputBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [depositingEscrow, setDepositingEscrow] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [autoTranslate, toggleAutoTranslate] = useAutoTranslate();
  const [translatingIds, setTranslatingIds] = useState<string[]>([]);
  const [failedTranslationIds, setFailedTranslationIds] = useState<string[]>([]);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);

  // States cho Atelier Binder UI Right Page View & Zoom & Milestone Switcher
  const [rightPageView, setRightPageView] = useState<'canvas' | 'brief' | 'milestones'>('canvas');
  const [zoomScale] = useState<number>(1);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  // States cho các Modal Hợp đồng & Cột mốc
  const [commission, setCommission] = useState<Commission | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDisputeDetailsModal, setShowDisputeDetailsModal] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Auto-detect clipping: Tự động nhận diện khoảng trống lề ngoài để thu gọn tab nếu bị khuất
  const binderRef = useRef<HTMLDivElement>(null);
  const [hasRightSpace, setHasRightSpace] = useState(true);
  const [hasLeftSpace, setHasLeftSpace] = useState(true);

  useEffect(() => {
    const checkSpace = () => {
      if (binderRef.current) {
        const parent = binderRef.current.parentElement || document.body;
        const parentRect = parent.getBoundingClientRect();
        const rect = binderRef.current.getBoundingClientRect();

        // Đo khoảng trống khả dụng tới viền khung chứa (main layout container)
        const rightClearance = parentRect.right - rect.right;
        const leftClearance = rect.left - parentRect.left;

        // Cần ít nhất 140px lề khả dụng để bung tab 135px mà không bị sát mép/khuất màn hình
        setHasRightSpace(rightClearance >= 140);
        setHasLeftSpace(leftClearance >= 140);
      }
    };

    checkSpace();
    window.addEventListener('resize', checkSpace);
    return () => window.removeEventListener('resize', checkSpace);
  }, []);

  const currentMemberRole = useMemo(() => {
    if (!userId) return undefined;
    const member = room?.members.find((m) => m.userId.toLowerCase() === userId.toLowerCase());
    return member?.memberRole?.toLowerCase();
  }, [room, userId]);

  const isCreator = currentMemberRole === 'creator';

  const partnerDisplayName = useMemo(() => {
    if (!room?.members || !userId) return isCreator ? 'Khách hàng' : 'Họa sĩ';
    const partner = room.members.find((m) => m.userId.toLowerCase() !== userId.toLowerCase());
    return partner?.fullName || (isCreator ? 'Khách hàng' : 'Họa sĩ');
  }, [room, userId, isCreator]);

  const isClient = currentMemberRole === 'client';
  const activeRole: 'client' | 'creator' = isCreator ? 'creator' : 'client';
  const commissionStatus: CommissionStatus = commission?.status ?? 'InProgress';

  const acceptedTermsVersion = currentMemberRole === 'client'
    ? commission?.clientTermsVersion
    : currentMemberRole === 'creator'
      ? commission?.creatorTermsVersion
      : null;
  const currentTermsVersion = commission?.currentWorkroomTermsVersion ?? '1.0';
  const showTermsModal = Boolean(
    commission
    && commission.status !== 'Completed'
    && commission.status !== 'Cancelled'
    && (currentMemberRole === 'client' || currentMemberRole === 'creator')
    && acceptedTermsVersion !== currentTermsVersion,
  );

  const handleAcceptWorkroomTerms = useCallback(async () => {
    if (!commission || acceptingTerms) return;
    setAcceptingTerms(true);
    setTermsError(null);
    try {
      setCommission(await commissionService.acceptWorkroomTerms(commission.id));
    } catch (err: unknown) {
      setTermsError(extractErrorMessage(err, 'Không thể ghi nhận xác nhận điều khoản.'));
    } finally {
      setAcceptingTerms(false);
    }
  }, [commission, acceptingTerms]);

  const isCommissionEnded = useMemo(() => {
    return (
      commissionStatus === 'Completed' ||
      commissionStatus === 'Cancelled'
    );
  }, [commissionStatus]);

  const isChatDisabled = Boolean(room?.isLocked || isCommissionEnded);

  const handleSelectFile = useCallback((file: File) => {
    setSelectedFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImg = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
    if (isImg) {
      setSelectedFilePreview(URL.createObjectURL(file));
    } else {
      setSelectedFilePreview(null);
    }
  }, []);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
      setSelectedFilePreview(null);
    }
  }, [selectedFilePreview]);

  const sortedMilestones = useMemo(() => {
    if (!commission?.milestones) return [];
    return [...commission.milestones].sort((a, b) => a.sequence - b.sequence);
  }, [commission]);

  const allMilestonesApproved = useMemo(() => {
    if (
      commissionStatus === 'SubmittedFinal' ||
      commissionStatus === 'Delivered' ||
      commissionStatus === 'Completed'
    ) {
      return true;
    }
    if (sortedMilestones.length === 0) return false;
    return sortedMilestones.every((m) => m.status === 'Approved');
  }, [sortedMilestones, commissionStatus]);

  const activeStageMilestone = useMemo(() => {
    if (sortedMilestones.length === 0) return null;
    if (allMilestonesApproved || (commission?.currentStage && commission.currentStage > sortedMilestones.length)) {
      return sortedMilestones[sortedMilestones.length - 1];
    }
    return (
      sortedMilestones.find((m) => m.sequence === commission?.currentStage) ??
      sortedMilestones.find((m) => m.status !== 'Approved') ??
      sortedMilestones[sortedMilestones.length - 1]
    );
  }, [sortedMilestones, commission, allMilestonesApproved]);

  const displayedMilestone: Milestone | null = useMemo(() => {
    if (selectedMilestoneId) {
      const found = sortedMilestones.find((m) => m.id === selectedMilestoneId);
      if (found) return found;
    }
    return activeStageMilestone;
  }, [selectedMilestoneId, sortedMilestones, activeStageMilestone]);

  const totalMilestonesCount = sortedMilestones.length || 1;
  const approvedMilestonesCount = useMemo(() => {
    return sortedMilestones.filter((m) => m.status === 'Approved').length;
  }, [sortedMilestones]);

  const progressPercent = useMemo(() => {
    if (allMilestonesApproved) return 100;
    if (totalMilestonesCount === 0) return 0;
    return Math.round((approvedMilestonesCount / totalMilestonesCount) * 100) || 33;
  }, [allMilestonesApproved, totalMilestonesCount, approvedMilestonesCount]);

  const currentStageNum = displayedMilestone?.sequence ?? commission?.currentStage ?? 1;

  const deadlineText = useMemo(() => {
    if (commissionStatus === 'Cancelled') return 'Đã hủy đơn';
    if (allMilestonesApproved) return 'Hoàn tất';
    if (!commission?.deadlineAt) return 'Đang thực hiện';

    const diffMs = new Date(commission.deadlineAt).getTime() - new Date().getTime();
    if (diffMs < 0) {
      const overdueDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      return `Quá hạn ${overdueDays} ngày`;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours === 0) {
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Còn ${minutes} phút`;
    }

    if (days === 0) {
      return `Còn ${hours} giờ`;
    }

    if (hours > 0) {
      return `Còn ${days} ngày ${hours} giờ`;
    }

    return `Còn ${days} ngày`;
  }, [commission, allMilestonesApproved, commissionStatus]);

  const rawWipUrl =
    displayedMilestone?.wipPreviewUrl ||
    displayedMilestone?.watermarkedUrl ||
    displayedMilestone?.originalWipUrl ||
    null;

  const currentWipPreviewUrl = resolveAttachmentUrl(rawWipUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Dịch một tin nhắn và cập nhật tại chỗ — không tải lại cả phòng. `force` = dịch lại bản cũ. */
  const translateOne = useCallback(async (messageId: string, force = false) => {
    setTranslatingIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
    try {
      const result = await chatService.translateMessage(messageId, 'vi', force);
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === messageId
            ? {
              ...m,
              translatedBody: result.translatedBody,
              targetLang: result.targetLang,
              translationStatus: 'Completed',
            }
            : m,
        ),
      );
      setFailedTranslationIds((prev) => prev.filter((id) => id !== messageId));
    } catch {
      setFailedTranslationIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
    } finally {
      setTranslatingIds((prev) => prev.filter((id) => id !== messageId));
    }
  }, []);

  const handleIncoming = useCallback(
    (message: ChatMessageDto) => {
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === message.messageId)) return prev;
        const last = prev[prev.length - 1];
        if (
          last &&
          last.senderId === message.senderId &&
          last.body.trim() === message.body.trim() &&
          Math.abs(new Date(message.sentAt).getTime() - new Date(last.sentAt).getTime()) < 15000
        ) {
          return prev;
        }
        return [...prev, message];
      });

      if (room?.commissionId) {
        void commissionService.getById(room.commissionId).then((c) => setCommission(c)).catch(() => null);
      }

      const isMyMessage = userId && message.senderId.toLowerCase() === userId.toLowerCase();

      if (isMyMessage) {
        setPending((prev) => {
          const index = prev.findIndex((p) => p.body === message.body);
          return index === -1 ? prev : [...prev.slice(0, index), ...prev.slice(index + 1)];
        });
        return;
      }

      // Xóa ngay trạng thái "đang nhập" khi nhận tin nhắn mới của đối tác
      setPartnerTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      if (autoTranslate && !message.translatedBody && message.body.trim()) {
        void translateOne(message.messageId);
      }
    },
    [userId, autoTranslate, translateOne, room],
  );

  const handleTyping = useCallback(
    () => {
      setPartnerTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 4000);
    },
    [],
  );

  const handleRead = useCallback(
    (readerId: string, lastReadAt: string) => {
      if (!userId || readerId.toLowerCase() === userId.toLowerCase()) return;
      setPartnerReadAt(lastReadAt);
    },
    [userId],
  );

  const chat = useChatHub(roomId, {
    onMessage: handleIncoming,
    onTyping: handleTyping,
    onRead: handleRead,
    onFailure: (reason) => setError(reason),
  });

  const handleToggleAutoTranslate = useCallback(() => {
    const turningOn = !autoTranslate;
    toggleAutoTranslate();
    if (!turningOn || !userId) return;

    const pendingMsgs = messages
      .filter((m) => m.senderId !== userId && !m.translatedBody && m.body.trim())
      .slice(-5);

    void (async () => {
      for (const message of pendingMsgs) {
        await translateOne(message.messageId);
      }
    })();
  }, [autoTranslate, toggleAutoTranslate, messages, userId, translateOne]);

  const markReadRef = useRef(chat.markRead);
  useEffect(() => {
    markReadRef.current = chat.markRead;
  }, [chat.markRead]);

  useEffect(
    () => () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    },
    [],
  );

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [r, m] = await Promise.all([chatService.getRoom(roomId), chatService.getMessages(roomId)]);
      setRoom(r);
      if (r.commissionId) {
        try {
          const c = await commissionService.getById(r.commissionId);
          if (!c.dispute) {
            try {
              const d = await commissionService.getDispute(r.commissionId);
              if (d) c.dispute = d;
            } catch { }
          }
          setCommission(c);
        } catch { }
      }
      const rawList = [...m.items].reverse();
      const deduplicated: ChatMessageDto[] = [];
      for (const msg of rawList) {
        const last = deduplicated[deduplicated.length - 1];
        if (
          last &&
          last.senderId === msg.senderId &&
          last.body.trim() === msg.body.trim() &&
          Math.abs(new Date(msg.sentAt).getTime() - new Date(last.sentAt).getTime()) < 15000
        ) {
          continue;
        }
        deduplicated.push(msg);
      }
      setMessages(deduplicated);
      setPartnerReadAt(r.members.find((member) => member.userId !== userId)?.lastReadAt ?? null);
      setError(null);
      await chatService.markRead(roomId).catch(() => { });
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Không tải được phòng làm việc.'));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [roomId, userId]);

  const refresh = useCallback(() => {
    setError(null);
    void loadData(false);
  }, [loadData]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadData(true);
    });
  }, [roomId, userId, loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending, partnerTyping]);

  useEffect(() => {
    if (loading || !userId) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    void markReadRef.current().catch(() => undefined);
  }, [messages.length, loading, userId]);

  async function handleSendFile(file: File) {
    if (!userId || !room || isChatDisabled) return;
    setUploading(true);
    setError(null);
    try {
      const attachment = await chatService.uploadAttachment(roomId, file);
      clearSelectedFile();
      if (attachment?.messageId) {
        if (chat.status === 'connected') {
          await chat.publishStoredMessage(attachment.messageId);
        } else {
          const page = await chatService.getMessages(roomId);
          setMessages([...page.items].reverse());
        }
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Tải tệp đính kèm thất bại.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (isChatDisabled || sending || uploading || !userId) return;

    const parsedBody = workroomMessageSchema.safeParse(inputBody);
    if (!parsedBody.success) {
      setError(parsedBody.error.issues[0]?.message ?? 'Tin nhắn không hợp lệ.');
      return;
    }

    const body = parsedBody.data;
    if (!body && !selectedFile) return;

    setSending(true);
    setError(null);

    try {
      if (selectedFile) {
        await handleSendFile(selectedFile);
      }
      if (body) {
        setInputBody('');
        setPending((prev) => [...prev, { tempId: `${Date.now()}-${prev.length}`, body }]);
        await chat.sendMessage(body);
      }
    } catch (err: unknown) {
      if (body) {
        setPending((prev) => prev.filter((p) => p.body !== body));
        setInputBody(body);
      }
      setError(extractErrorMessage(err, 'Không gửi được tin nhắn / tệp đính kèm.'));
    } finally {
      setSending(false);
    }
  }

  async function handleDepositEscrow() {
    if (!room?.commissionId || depositingEscrow) return;
    setDepositingEscrow(true);
    setError(null);
    try {
      const updated = await commissionService.depositEscrow(room.commissionId);
      if (updated) {
        setCommission(updated);
      }
      refresh();
      void chat.sendMessage('🛡️ Khách hàng đã nạp tiền ký quỹ Escrow thành công. Creator có thể bắt đầu vẽ!').catch(() => null);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Không thể nạp tiền ký quỹ Escrow.'));
    } finally {
      setDepositingEscrow(false);
    }
  }

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].senderId === userId) return messages[i].messageId;
    }
    return null;
  }, [messages, userId]);

  const partnerReadMine =
    Boolean(partnerReadAt) &&
    Boolean(lastMineId) &&
    new Date(partnerReadAt as string).getTime() >=
    new Date(messages.find((m) => m.messageId === lastMineId)?.sentAt ?? 0).getTime();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 text-on-surface">
        <PageLoader label="Đang mở cuốn sổ Atelier Binder làm việc dự án Commission…" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-on-surface">
        <CircleAlert size={44} className="mx-auto mb-3 text-outline" />
        <h1 className="font-h1 text-xl font-bold">Không tìm thấy phòng trao đổi commission</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Phòng trao đổi có thể chưa được tạo hoặc bạn không có quyền truy cập.</p>
        <Link href="/wallet" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại trang cá nhân
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative font-body pb-6">
      {/* Cảnh báo lỗi chung */}
      {error && (
        <div role="alert" className="w-full max-w-7xl z-10 mb-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
          <CircleAlert size={14} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* WRAPPER BÊN NGOÀI ĐỂ CÁC TAB BUNG BÊN NGOÀI BÌA SỔ KHÔNG BỊ CLIP-PATH CẮT */}
      <div ref={binderRef} className="relative w-full max-w-7xl z-10 my-auto pt-10 sm:pt-11">

            {/* TỜ NOTE TIẾN ĐỘ VÀ HẠN CHÓT Ở GÓC TRÊN BÊN TRÁI KHUNG SỔ (TUCKED BEHIND BINDER COVER AT Z-0) */}
            <div
              onClick={() => setRightPageView((prev) => (prev === 'milestones' ? 'canvas' : 'milestones'))}
              title="Xem chi tiết lộ trình tiến độ & hạn chót"
              className="hidden sm:block absolute top-1.5 sm:top-2 left-7 z-0 group cursor-pointer select-none transition-transform duration-300 hover:-translate-y-1.5"
            >
              {/* Thân mẩu Note (Cắt polygon 45 độ góc trái trên) */}
              <div
                className={`flex h-[46px] bg-[#121620] hover:bg-[#181E2C] transition-all duration-200 rounded-tr-xl rounded-tl-none px-4 items-center gap-3.5 shadow-xl [clip-path:polygon(12px_0,100%_0,100%_100%,0_100%,0_12px)] ${deadlineText.includes('Quá hạn')
                    ? 'group-hover:shadow-[0_-8px_20px_rgba(0,0,0,0.7),0_0_15px_rgba(248,113,113,0.3)]'
                    : 'group-hover:shadow-[0_-8px_20px_rgba(0,0,0,0.7),0_0_15px_rgba(0,229,153,0.35)]'
                  }`}
              >
                {/* Chấm Pin ghim sáng */}
                <div
                  className={`size-2 rounded-full shrink-0 ${deadlineText.includes('Quá hạn')
                      ? 'bg-red-400 shadow-[0_0_10px_#F87171]'
                      : 'bg-[#00E599] shadow-[0_0_10px_#00E599]'
                    }`}
                />

                {/* Tiêu đề & Icon */}
                <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide whitespace-nowrap">
                  <TrendingUp
                    size={15}
                    className={deadlineText.includes('Quá hạn') ? 'text-red-400' : 'text-[#00E599]'}
                  />
                  <span>Tiến độ &amp; Hạn chót</span>
                </div>

                {/* Chip 1: An toàn / Trạng thái */}
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg whitespace-nowrap border ${deadlineText.includes('Quá hạn')
                      ? 'bg-red-500/15 border-red-500/60 text-red-300'
                      : 'bg-[#12261E] border-[#00E599]/60 text-[#00E599]'
                    }`}
                >
                  {allMilestonesApproved
                    ? 'Hoàn thành 100%'
                    : deadlineText.includes('Quá hạn')
                      ? 'Cần chú ý'
                      : 'An toàn 100%'}
                </span>

                {/* Chip 2: Mốc hiện tại */}
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg whitespace-nowrap border ${deadlineText.includes('Quá hạn')
                      ? 'bg-red-500/20 border-red-500/70 text-red-200'
                      : 'bg-[#12261E] border-[#00E599]/60 text-[#00E599]'
                    }`}
                >
                  Mốc #{currentStageNum}
                </span>

                {/* Thời gian / Hạn chót */}
                <span
                  className={`text-xs whitespace-nowrap flex items-center gap-1.5 font-bold ${deadlineText.includes('Quá hạn') ? 'text-red-300' : 'text-[#00E599]'
                    }`}
                >
                  <Clock size={13} className="shrink-0" />
                  <span>{deadlineText}</span>
                </span>

                {/* Vạch tiến độ chạy ngầm ở đáy mẩu note */}
                <div className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#1A2822] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className={`h-full transition-all duration-500 ${deadlineText.includes('Quá hạn')
                        ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]'
                        : 'bg-[#00E599] shadow-[0_0_10px_rgba(0,229,153,0.9)]'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* DẢI TAB CỐ ĐỊNH MÉP TRÁI (HỦY ĐƠN - TỰ ĐỘNG THU GỌN NẾU BỊ KHUẤT) */}
            <div className="hidden lg:flex absolute right-full bottom-20 flex-col gap-3 z-50 items-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={commissionStatus === 'Completed' || commissionStatus === 'Cancelled' || commissionStatus === 'Disputed'}
                title="Hủy đơn hàng thông thường"
                className={`group relative h-[44px] bg-[#1C202D] hover:bg-[#232838] border border-r-0 rounded-l-lg flex items-center justify-end pr-3.5 shadow-xl [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%,0_10px)] [transition:width_0.3s_cubic-bezier(0.34,1.3,0.64,1),background-color_0.2s_ease,border-color_0.2s_ease] cursor-pointer ${!hasLeftSpace
                    ? showCancelModal
                      ? 'w-[46px] border-rose-400 bg-[#232838] shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                      : 'w-[46px] border-[#2F364A] hover:border-rose-400'
                    : showCancelModal
                      ? 'w-[135px] border-rose-400 bg-[#232838] shadow-[0_0_12px_rgba(244,63,94,0.35)] overflow-hidden'
                      : 'w-[46px] hover:w-[135px] border-[#2F364A] hover:border-rose-400 overflow-hidden'
                  }`}
              >
                <span
                  className={`text-xs font-bold text-rose-300 mr-3 pl-3 transition-opacity duration-200 pointer-events-none select-none whitespace-nowrap ${hasLeftSpace
                      ? showCancelModal
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                      : 'hidden'
                    }`}
                >
                  Hủy đơn
                </span>
                <div className="flex items-center justify-center shrink-0 w-5">
                  <CircleAlert size={18} className="text-rose-400" />
                </div>
                {!hasLeftSpace && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#161926]/95 border border-rose-500/40 text-rose-300 text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap z-50">
                    Hủy đơn thông thường
                  </div>
                )}
              </button>
            </div>

            {/* DẢI TAB CỐ ĐỊNH MÉP PHẢI (DUYỆT MỐC & KHO FILE GỐC - TỰ ĐỘNG THU GỌN NẾU BỊ KHUẤT) */}
            <div className="hidden lg:flex absolute left-full top-[45%] -translate-y-1/2 flex-col gap-3 z-50 items-start">
              {/* Tab 1: Duyệt mốc */}
              <button
                type="button"
                onClick={() => setShowApprovalModal(true)}
                className={`group relative h-[44px] bg-[#1C202D] hover:bg-[#232838] border border-l-0 rounded-r-lg flex items-center pl-3.5 shadow-xl [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)] [transition:width_0.3s_cubic-bezier(0.34,1.3,0.64,1),background-color_0.2s_ease,border-color_0.2s_ease] cursor-pointer ${!hasRightSpace
                    ? showApprovalModal
                      ? 'w-[46px] border-emerald-400 bg-[#232838] shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                      : 'w-[46px] border-[#2F364A] hover:border-emerald-400'
                    : showApprovalModal
                      ? 'w-[135px] border-emerald-400 bg-[#232838] shadow-[0_0_12px_rgba(52,211,153,0.35)] overflow-hidden'
                      : 'w-[46px] hover:w-[135px] border-[#2F364A] hover:border-emerald-400 overflow-hidden'
                  }`}
              >
                <div className="flex items-center justify-center shrink-0 w-5">
                  <Eye size={18} className="text-emerald-400" />
                </div>
                <span
                  className={`text-xs font-bold text-emerald-300 ml-3 pr-3 transition-opacity duration-200 pointer-events-none select-none whitespace-nowrap ${hasRightSpace
                      ? showApprovalModal
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                      : 'hidden'
                    }`}
                >
                  Duyệt mốc
                </span>

                {/* Smart Tooltip khi ở dạng thu gọn (khi bị khuất/hẹp lề) */}
                {!hasRightSpace && (
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#161926]/95 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap z-50">
                    Duyệt / Yêu cầu sửa mốc
                  </div>
                )}
              </button>

              {/* Tab 2: Kho file gốc */}
              <button
                type="button"
                onClick={() => setShowDeliveryModal(true)}
                className={`group relative h-[44px] bg-[#1C202D] hover:bg-[#232838] border border-l-0 rounded-r-lg flex items-center pl-3.5 shadow-xl [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)] [transition:width_0.3s_cubic-bezier(0.34,1.3,0.64,1),background-color_0.2s_ease,border-color_0.25s_ease] cursor-pointer ${!hasRightSpace
                    ? showDeliveryModal
                      ? 'w-[46px] border-sky-400 bg-[#232838] shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                      : 'w-[46px] border-[#2F364A] hover:border-sky-400'
                    : showDeliveryModal
                      ? 'w-[135px] border-sky-400 bg-[#232838] shadow-[0_0_12px_rgba(56,189,248,0.35)] overflow-hidden'
                      : 'w-[46px] hover:w-[135px] border-[#2F364A] hover:border-sky-400 overflow-hidden'
                  }`}
              >
                <div className="flex items-center justify-center shrink-0 w-5">
                  <FileArchive size={18} className="text-sky-400" />
                </div>
                <span
                  className={`text-xs font-bold text-sky-300 ml-3 pr-3 transition-opacity duration-200 pointer-events-none select-none whitespace-nowrap ${hasRightSpace
                      ? showDeliveryModal
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                      : 'hidden'
                    }`}
                >
                  Kho file
                </span>

                {/* Smart Tooltip khi ở dạng thu gọn (khi bị khuất/hẹp lề) */}
                {!hasRightSpace && (
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#161926]/95 border border-sky-500/40 text-sky-300 text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap z-50">
                    Bàn giao & Tải file HD
                  </div>
                )}
              </button>
            </div>

            {/* MAIN CONTAINER: BÌA SỔ (VIỀN NÉT LIỀN, MẢNH, BO 3 GÓC, CẮT CẠNH 1 GÓC PHẢI TRÊN) */}
            <div className="relative w-full bg-[#1F2335] border border-white/10 shadow-2xl flex flex-col lg:flex-row z-10 min-h-[720px] lg:h-[calc(100vh-8.5rem)] rounded-tl-3xl rounded-bl-3xl rounded-br-3xl [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)]">

              {/* GÁY SỔ LÒ XO KIM LOẠI Ở GIỮA */}
              <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-8 z-30 flex-col justify-between py-6 pointer-events-none items-center">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-3 bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800 shadow-md border border-black transform -rotate-3"
                  />
                ))}
              </div>

              {/* ========================================================================= */}
              {/* TRANG TRÁI (LEFT PAGE): LOGBOOK SKETCH & SIGNALR LIVE CHAT */}
              {/* ========================================================================= */}
              <div className="flex-1 bg-[#1F1F22] border-b lg:border-b-0 lg:border-r border-white/10 p-4 lg:p-6 flex flex-col justify-between relative rounded-tl-3xl rounded-bl-3xl">

                {/* Nền Hoạ tiết Lưới Chấm Dot-Grid Paper Texture */}
                <div
                  className="absolute inset-0 opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#919099 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* HEADER TRANG TRÁI */}
                <div className="relative z-10 shrink-0 pb-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Link href={activeRole === 'creator' ? '/creator/commissions' : '/client/commissions'} className="rounded-lg bg-white/5 border border-white/10 p-2 text-outline hover:text-white transition" title="Quay lại danh sách">
                      <ArrowLeft size={16} />
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-brand-periwinkle/15 border border-brand-periwinkle/30 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-periwinkle [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)]">
                          COMMISSION #CMD-{roomId.slice(0, 8).toUpperCase()}
                        </span>
                        <h1 className="font-h1 font-bold text-sm text-on-surface line-clamp-1">{room.chatRoomTitle || 'Phòng trao đổi dự án'}</h1>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Thành viên: {room.members.map((m) => m.fullName || 'Người dùng').join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Thẻ Trạng Thái Kênh Trực Tiếp (100% dữ liệu thực SignalR, không giả lập Online) */}
                    <div
                      title={
                        chat.status === 'connected'
                          ? 'Kênh kết nối thời gian thực (SignalR) đang hoạt động ổn định.'
                          : 'Đang kết nối lại kênh truyền thời gian thực...'
                      }
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold transition [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)] ${chat.status === 'connected'
                          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                          : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                        }`}
                    >
                      {chat.status === 'connected' ? (
                        <>
                          <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span>{partnerTyping ? `${partnerDisplayName} đang nhập...` : 'Kênh trực tiếp'}</span>
                        </>
                      ) : (
                        <>
                          <span className="size-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                          <span>Đang kết nối lại...</span>
                        </>
                      )}
                    </div>

                    {/* Công tắc Auto Translate */}
                    <button
                      type="button"
                      onClick={handleToggleAutoTranslate}
                      aria-pressed={autoTranslate}
                      title="Tự động dịch tin nhắn đối tác"
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${autoTranslate
                        ? 'border-brand-periwinkle/50 bg-brand-periwinkle/20 text-brand-periwinkle'
                        : 'border-white/10 bg-white/5 text-outline hover:text-white'
                        }`}
                    >
                      <Globe size={12} /> Dịch AI
                      <span className={`inline-block size-2 rounded-full ${autoTranslate ? 'bg-brand-periwinkle animate-pulse' : 'bg-white/20'}`} />
                    </button>

                    {/* Nút Khiếu Nại / Xem Hồ Sơ Tranh Chấp */}
                    {(commission?.dispute || commissionStatus === 'Cancelled' || commissionStatus === 'Disputed' || (commissionStatus !== 'Completed')) && (
                      <button
                        type="button"
                        onClick={() => (commission?.dispute || commissionStatus === 'Cancelled' || commissionStatus === 'Disputed') ? setShowDisputeDetailsModal(true) : setShowDisputeModal(true)}
                        title={commission?.dispute || commissionStatus === 'Cancelled' ? 'Xem hồ sơ và kết quả giải quyết tranh chấp' : 'Gửi khiếu nại tranh chấp với Trọng tài sàn'}
                        className="group relative flex size-9 shrink-0 items-center justify-center border border-amber-500/40 bg-[#1C202D] hover:bg-[#232838] hover:border-amber-400 text-amber-400 transition shadow-md [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%,0_10px)]"
                      >
                        <Scale size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={refresh}
                      className="rounded-lg bg-white/5 border border-white/10 p-2 text-outline hover:text-white transition"
                      title="Tải lại tin nhắn"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                {/* BANNER TRANH CHẤP (ĐANG XỬ LÝ HOẶC ĐÃ CÓ PHÁN QUYẾT RESOLVED) */}
                {commission?.dispute && (
                  commission.dispute.status === 'Resolved' || commissionStatus !== 'Disputed' ? (
                    <div className="relative z-10 my-3 border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200 shadow-lg [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)]">
                      <div className="flex items-start gap-2.5">
                        <div className="shrink-0 p-1 bg-emerald-500/20 rounded-md text-emerald-300 border border-emerald-400/40">
                          <Scale size={16} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-h1 font-bold text-emerald-300 text-xs uppercase tracking-wider">
                              Phán quyết tranh chấp trọng tài (Trạng thái: {commission.dispute.status})
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowDisputeDetailsModal(true)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold transition"
                            >
                              Xem hồ sơ chi tiết
                            </button>
                          </div>
                          <div className="space-y-1 text-[11px] text-emerald-100/90 border-t border-emerald-500/20 pt-2">
                            {commission.dispute.resolution && (
                              <p><strong>Phán quyết xử lý:</strong> <span className="text-white font-semibold">{commission.dispute.resolution}</span></p>
                            )}
                            {commission.dispute.adminNote && (
                              <p><strong>Ghi chú quyết định:</strong> <span className="text-white italic">{commission.dispute.adminNote}</span></p>
                            )}
                            <div className="flex flex-wrap gap-4 pt-1">
                              {commission.dispute.clientRefundAmount != null && (
                                <span><strong>Hoàn khách:</strong> {new Intl.NumberFormat('vi-VN').format(commission.dispute.clientRefundAmount)} VND</span>
                              )}
                              {commission.dispute.artistPayAmount != null && (
                                <span><strong>Creator nhận:</strong> {new Intl.NumberFormat('vi-VN').format(commission.dispute.artistPayAmount)} VND</span>
                              )}
                              {commission.dispute.resolvedAt && (
                                <span className="text-emerald-300/70"><strong>Ngày giải quyết:</strong> {new Date(commission.dispute.resolvedAt).toLocaleString('vi-VN')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 my-3 border border-amber-500/40 bg-amber-500/15 p-3.5 text-xs text-amber-200 flex items-start gap-2.5 shadow-lg [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)]">
                      <div className="shrink-0 p-1 bg-amber-500/20 rounded-md text-amber-300 border border-amber-400/40">
                        <ShieldAlert size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-h1 font-bold text-amber-300 text-xs uppercase tracking-wider">Đơn hàng đang trong quá trình khiếu nại tranh chấp (Disputed)</p>
                          <button
                            type="button"
                            onClick={() => setShowDisputeDetailsModal(true)}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-bold"
                          >
                            Chi tiết
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-100/90 leading-relaxed mt-0.5">
                          Hồ sơ khiếu nại đã được chuyển đến Ban Trọng tài sàn để thẩm định. Tiền ký quỹ Escrow được tạm khóa an toàn cho đến khi có phán quyết chính thức.
                        </p>
                        <div className="mt-2 space-y-1 border-t border-amber-400/20 pt-2 text-[11px]">
                          <p><strong>Lý do:</strong> {commission.dispute.reason}</p>
                          <p><strong>Ngày tạo:</strong> {new Date(commission.dispute.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* CẢNH BÁO BẢO VỆ ESCROW */}
                <div className="relative z-10 my-3 border border-brand-periwinkle/30 bg-brand-periwinkle/10 p-3 text-xs text-on-surface flex items-start gap-2.5 shadow-lg [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)]">
                  <div className="shrink-0 p-1 bg-brand-periwinkle/20 rounded-md text-brand-periwinkle border border-brand-periwinkle/40">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-h1 font-bold text-brand-periwinkle text-[11px] uppercase tracking-wider">Bảo Vệ Thanh Toán Escrow An Toàn</p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                      Các bản phác thảo (WIP) được xem thử trực quan ở khung bên phải. Tiền được bảo vệ an toàn trong Escrow và chỉ giải ngân khi bạn đồng ý duyệt từng mốc.
                    </p>
                  </div>
                </div>

                {/* DANH SÁCH TIN NHẮN REAL-TIME */}
                <div className="relative z-10 flex-1 overflow-y-auto space-y-3 pr-1 my-2 min-h-[300px] lg:min-h-0">
                  {messages.length === 0 && pending.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-xs text-outline p-6 space-y-2">
                      <BookOpen size={32} className="text-outline/50" />
                      <p className="font-semibold text-on-surface">Chưa có tin nhắn nào trong phòng làm việc</p>
                      <p className="max-w-xs text-[11px] text-on-surface-variant">Hãy gửi lời chào hoặc đính kèm tệp phác thảo để bắt đầu trao đổi chi tiết dự án nha!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = userId && msg.senderId === userId;
                      const isTranslating = translatingIds.includes(msg.messageId);
                      return (
                        <div key={msg.messageId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="mb-1 flex items-center gap-2 text-[10px] text-outline">
                            <span className="font-semibold text-on-surface">{isMe ? 'Bạn' : msg.senderFullName || 'Đối tác'}</span>
                            <span>{new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div
                            className={`max-w-[88%] p-3 text-xs leading-relaxed shadow-md ${isMe
                              ? 'bg-brand-periwinkle text-brand-navy font-semibold rounded-2xl rounded-tr-none'
                              : 'border border-white/10 bg-white/5 text-on-surface rounded-2xl rounded-tl-none'
                              }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.body}</p>

                            {msg.translatedBody && msg.translatedBody.trim() !== msg.body.trim() && (
                              <div className="mt-2 border-t border-black/15 pt-2 text-[11px] italic opacity-90">
                                <p className="flex items-center gap-1 font-semibold not-italic">
                                  <Globe size={11} /> Bản dịch:
                                </p>
                                <p>{msg.translatedBody}</p>
                              </div>
                            )}

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2.5 space-y-2">
                                {msg.attachments.map((att) => {
                                  const ext = att.fileName ? att.fileName.split('.').pop()?.toLowerCase() : '';
                                  const isImg = (att.mimeType && att.mimeType.startsWith('image/')) || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
                                  const fullAttUrl = resolveAttachmentUrl(att.fileUrl);
                                  return (
                                    <div key={att.messageAttachmentId} className="overflow-hidden rounded-xl border border-black/10 bg-black/20">
                                      {isImg ? (
                                        <a
                                          href={fullAttUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group relative block overflow-hidden rounded-xl bg-black/40"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={fullAttUrl}
                                            alt={att.fileName || 'Ảnh'}
                                            className="max-h-56 w-full object-contain rounded-xl transition duration-200 group-hover:scale-[1.01]"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition duration-200 group-hover:opacity-100 text-white text-xs font-semibold gap-1.5">
                                            <Eye size={16} /> Xem ảnh gốc
                                          </div>
                                        </a>
                                      ) : (
                                        <div className="flex items-center justify-between p-2 text-[11px]">
                                          <span className="inline-flex items-center gap-1.5 truncate text-on-surface font-medium">
                                            <FileText size={14} className="text-brand-periwinkle shrink-0" /> {att.fileName || 'Tệp đính kèm'}
                                          </span>
                                          <a
                                            href={fullAttUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-brand-periwinkle/20 px-2 py-1 font-semibold text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy transition"
                                          >
                                            <Download size={12} /> Tải
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[10px] text-outline">
                            {isTranslating && (
                              <span className="inline-flex items-center gap-1 text-brand-periwinkle">
                                <RefreshCw size={10} className="animate-spin" /> Đang dịch…
                              </span>
                            )}

                            {!isMe && !msg.translatedBody && !isTranslating && (
                              failedTranslationIds.includes(msg.messageId) ? (
                                <button
                                  type="button"
                                  onClick={() => void translateOne(msg.messageId)}
                                  className="inline-flex items-center gap-1 text-red-400 hover:underline"
                                >
                                  <CircleAlert size={10} /> Dịch lỗi
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void translateOne(msg.messageId)}
                                  className="inline-flex items-center gap-1 hover:text-on-surface"
                                >
                                  <Globe size={10} /> Dịch
                                </button>
                              )
                            )}

                            {isMe && msg.messageId === lastMineId && (
                              <span className="inline-flex items-center gap-1">
                                {partnerReadMine ? (
                                  <>
                                    <CheckCheck size={11} className="text-brand-periwinkle" /> Đã xem
                                  </>
                                ) : (
                                  <>
                                    <Check size={11} /> Đã gửi
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {pending.map((item) => (
                    <div key={item.tempId} className="flex flex-col items-end">
                      <div className="mb-1 flex items-center gap-2 text-[10px] text-outline">
                        <span>Bạn</span>
                        <span className="inline-flex items-center gap-1"><Clock size={10} /> đang gửi</span>
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-brand-periwinkle/60 p-3 text-xs leading-relaxed text-brand-navy font-semibold">
                        <p className="whitespace-pre-wrap">{item.body}</p>
                      </div>
                    </div>
                  ))}

                  {partnerTyping && (
                    <div className="flex items-center gap-2 text-[11px] text-outline" aria-live="polite">
                      <span className="flex gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-brand-periwinkle [animation-delay:0ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-brand-periwinkle [animation-delay:150ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-brand-periwinkle [animation-delay:300ms]" />
                      </span>
                      Đối tác đang nhập tin nhắn…
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Ô NHẬP TIN NHẮN */}
                <div className="relative z-10 shrink-0 pt-3 border-t border-white/10">
                  {isCommissionEnded && (
                    <div className="mb-2 flex items-center justify-center gap-2 border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold text-amber-300 [clip-path:polygon(6px_0,calc(100%-6px)_0,100%_6px,100%_calc(100%-6px),calc(100%-6px)_100%,6px_100%,0_calc(100%-6px),0_6px)]">
                      <Lock size={14} className="shrink-0" />
                      <span>Dự án đã kết thúc. Phòng trao đổi hiện đã khóa lưu trữ.</span>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="mb-2 flex items-center justify-between gap-3 border border-brand-periwinkle/40 bg-brand-periwinkle/10 p-2 text-xs [clip-path:polygon(6px_0,calc(100%-6px)_0,100%_6px,100%_calc(100%-6px),calc(100%-6px)_100%,6px_100%,0_calc(100%-6px),0_6px)]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {selectedFilePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedFilePreview} alt="Xem thử" className="size-10 rounded-md object-cover border border-white/20 shrink-0" />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md bg-white/10 text-brand-periwinkle shrink-0">
                            <FileText size={18} />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-on-surface truncate text-xs">{selectedFile.name}</p>
                          <p className="text-[10px] text-outline">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Sẵn sàng gửi</p>
                        </div>
                      </div>
                      <button type="button" onClick={clearSelectedFile} className="rounded-full bg-white/10 p-1 text-outline hover:text-white shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSelectFile(file);
                      e.target.value = '';
                    }}
                  />

                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Nút Khiếu Nại Tranh Chấp (Icon Scale Cái cân Trọng tài - Vị trí góc dưới bên trái) */}
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(true)}
                      title="Gửi khiếu nại tranh chấp với Trọng tài sàn"
                      className="group relative flex size-10 shrink-0 items-center justify-center border border-amber-500/40 bg-[#1C202D] hover:bg-[#232838] hover:border-amber-400 text-amber-400 transition shadow-md [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%,0_10px)]"
                    >
                      <Scale size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      type="button"
                      disabled={uploading || isChatDisabled}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex size-10 shrink-0 items-center justify-center border border-white/15 bg-white/5 text-outline hover:text-brand-periwinkle hover:border-brand-periwinkle/40 transition disabled:opacity-50 [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]"
                      title="Đính kèm tệp phác thảo"
                    >
                      <Paperclip size={16} className={uploading ? 'animate-spin' : ''} />
                    </button>

                    <input
                      type="text"
                      maxLength={4000}
                      disabled={isChatDisabled}
                      value={inputBody}
                      onChange={(e) => {
                        setInputBody(e.target.value);
                        chat.notifyTyping();
                      }}
                      placeholder={isChatDisabled ? 'Phòng trao đổi đã đóng.' : 'Nhập tin nhắn hoặc trao đổi với đối tác...'}
                      className="flex-1 border border-white/15 bg-slate-950/80 px-3.5 py-2.5 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none disabled:opacity-50 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
                    />

                    <button
                      type="submit"
                      disabled={(!inputBody.trim() && !selectedFile) || sending || uploading || isChatDisabled}
                      className="commission-primary flex size-10 shrink-0 items-center justify-center font-bold shadow-md transition disabled:opacity-50 [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%-6px))]"
                      title="Gửi tin nhắn"
                    >
                      {sending || uploading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </form>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* TRANG PHẢI (RIGHT PAGE): DYNAMIC TABBED VIEW (CANVAS / BRIEF / MILESTONES) */}
              {/* ========================================================================= */}
              <div className="flex-1 bg-[#1F2335] p-4 lg:p-6 flex flex-col justify-between relative rounded-tr-3xl rounded-br-3xl">

                {/* CỤM THẺ RUY-BĂNG THẢ RỦ TỪ TRÊN XUỐNG (BRIEF & TIẾN ĐỘ TABS) */}
                <div className="hidden sm:flex absolute top-0 right-6 sm:right-8 items-start gap-2.5 z-40">
                  {/* Tab 1: BRIEF */}
                  <button
                    type="button"
                    onClick={() => setRightPageView((prev) => (prev === 'brief' ? 'canvas' : 'brief'))}
                    title="Xem brief yêu cầu hợp đồng"
                    className={`group relative w-[40px] sm:w-[42px] h-[52px] hover:h-[115px] bg-[#1C202D] hover:bg-[#232838] border border-t-0 cursor-pointer overflow-hidden flex flex-col items-center justify-end pb-3 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),50%_100%,0_calc(100%-10px))] [transition:height_0.32s_cubic-bezier(0.34,1.45,0.7,1),background-color_0.25s_ease,border-color_0.25s_ease] ${rightPageView === 'brief'
                        ? 'bg-[#232838] border-brand-periwinkle shadow-[0_0_12px_rgba(167,172,217,0.35)]'
                        : 'border-[#2F364A] hover:border-[#485472]'
                      }`}
                  >
                    <span className={`[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 text-[10px] font-extrabold tracking-wider transition-opacity duration-200 mb-2 pointer-events-none whitespace-nowrap select-none ${rightPageView === 'brief' ? 'opacity-0 group-hover:opacity-100 text-brand-periwinkle' : 'opacity-0 group-hover:opacity-100 text-slate-300'
                      }`}>
                      BRIEF
                    </span>
                    <div className="flex items-center justify-center shrink-0">
                      <FileText size={18} className={rightPageView === 'brief' ? 'text-brand-periwinkle' : 'text-slate-300 group-hover:text-white'} />
                    </div>
                  </button>

                  {/* Tab 2: TIẾN ĐỘ */}
                  <button
                    type="button"
                    onClick={() => setRightPageView((prev) => (prev === 'milestones' ? 'canvas' : 'milestones'))}
                    title="Chi tiết tiến độ các mốc"
                    className={`group relative w-[40px] sm:w-[42px] h-[72px] hover:h-[135px] bg-[#1C202D] hover:bg-[#232838] border border-t-0 cursor-pointer overflow-hidden flex flex-col items-center justify-end pb-3 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),50%_100%,0_calc(100%-10px))] [transition:height_0.32s_cubic-bezier(0.34,1.45,0.7,1),background-color_0.25s_ease,border-color_0.25s_ease] ${rightPageView === 'milestones'
                        ? 'bg-[#232838] border-purple-400 shadow-[0_0_12px_rgba(167,139,250,0.35)]'
                        : 'border-[#2F364A] hover:border-[#485472]'
                      }`}
                  >
                    <span className={`[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 text-[10px] font-extrabold tracking-wider transition-opacity duration-200 mb-2 pointer-events-none whitespace-nowrap select-none ${rightPageView === 'milestones' ? 'opacity-0 group-hover:opacity-100 text-purple-300' : 'opacity-0 group-hover:opacity-100 text-purple-300'
                      }`}>
                      TIẾN ĐỘ
                    </span>
                    <div className="flex items-center justify-center shrink-0">
                      <Clock size={18} className={rightPageView === 'milestones' ? 'text-purple-300' : 'text-purple-400 group-hover:text-purple-300'} />
                    </div>
                  </button>

                </div>

                {/* VIEW 1: DEFAULT STUDIO CANVAS VIEW */}
                {rightPageView === 'canvas' && (
                  <>
                    <div className="shrink-0 pb-3 border-b border-white/10 flex flex-col space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 sm:pr-64">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="border border-brand-periwinkle/30 bg-brand-periwinkle/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-periwinkle rounded-full">
                              {allMilestonesApproved ? '✓ Đã hoàn thành toàn bộ mốc!' : `Đang ở Mốc #${displayedMilestone?.sequence ?? commission?.currentStage ?? 1}`}
                            </span>
                            <h3 className="font-h1 font-bold text-sm text-on-surface line-clamp-1">{displayedMilestone?.title || 'Bản phác thảo mốc hiện tại'}</h3>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Khung xem bản phác thảo — Nhấn vào ảnh để xem kích thước lớn &amp; phản hồi mốc</p>
                        </div>

                        {isCreator && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!displayedMilestone}
                              onClick={() => setShowSubmitModal(true)}
                              className="commission-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold shadow transition disabled:cursor-not-allowed disabled:opacity-40 [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%-6px))]"
                            >
                              <UploadCloud size={14} /> Nộp phác thảo
                            </button>
                          </div>
                        )}
                      </div>

                      {sortedMilestones.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                          <span className="text-[11px] font-bold text-outline shrink-0 mr-1">Lộ trình mốc:</span>
                          {sortedMilestones.map((ms, idx) => {
                            const maxUnlockedSeq = allMilestonesApproved ? Infinity : (activeStageMilestone?.sequence ?? 1);
                            const isReached = ms.status === 'Approved' || ms.sequence <= maxUnlockedSeq;
                            const isLocked = !isReached;
                            const isSelected = displayedMilestone?.id === ms.id;
                            const isActiveStage = activeStageMilestone?.id === ms.id;
                            const isApproved = ms.status === 'Approved';
                            const isRevision = ms.status === 'RevisionRequested';
                            const prevApproved = idx > 0 && sortedMilestones[idx - 1].status === 'Approved';

                            return (
                              <Fragment key={ms.id}>
                                {idx > 0 && (
                                  <div
                                    className={`h-[2px] w-5 sm:w-8 shrink-0 transition-all duration-300 ${prevApproved
                                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                                        : isReached
                                          ? 'bg-gradient-to-r from-emerald-400/80 to-white/20'
                                          : 'bg-white/10'
                                      }`}
                                  />
                                )}
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => !isLocked && setSelectedMilestoneId(ms.id)}
                                  title={
                                    isLocked
                                      ? `Mốc #${ms.sequence}: ${ms.title} (Chưa mở khóa)`
                                      : `Xem phác thảo mốc #${ms.sequence}: ${ms.title}`
                                  }
                                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all shrink-0 border ${isLocked
                                      ? 'bg-white/5 text-slate-500 border-white/5 opacity-40 cursor-not-allowed'
                                      : isSelected
                                        ? isApproved
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                                          : isRevision
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                                            : 'bg-brand-periwinkle/20 text-brand-periwinkle border-brand-periwinkle shadow-[0_0_12px_rgba(167,172,217,0.35)]'
                                        : isApproved
                                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                          : isRevision
                                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                            : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                  {/* Circle Node Icon/Badge */}
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 transition-transform group-hover:scale-105 ${isSelected
                                        ? isApproved
                                          ? 'bg-emerald-400 text-slate-950 font-extrabold'
                                          : isRevision
                                            ? 'bg-amber-400 text-slate-950 font-extrabold'
                                            : 'bg-brand-periwinkle text-slate-950 font-extrabold'
                                        : isApproved
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                          : isRevision
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                            : isLocked
                                              ? 'bg-white/5 text-slate-500 border border-white/5'
                                              : 'bg-white/10 text-slate-200 border border-white/15'
                                      }`}
                                  >
                                    {isLocked ? <Lock size={10} /> : isApproved ? <CheckCircle2 size={11} /> : ms.sequence}
                                  </div>

                                  {/* Label gọn */}
                                  <span className="text-[11px] font-bold">
                                    Mốc #{ms.sequence}
                                  </span>

                                  {/* Pulsing indicator if active stage */}
                                  {isActiveStage && !isApproved && (
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Đang ở mốc này" />
                                  )}
                                </button>
                              </Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isClient && commission?.escrowStatus === 'Pending' && (
                      <div className="my-3 flex flex-wrap items-center justify-between gap-3 border border-amber-400/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 shadow-lg [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center bg-amber-400/20 text-amber-300 border border-amber-400/40 [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)]">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <p className="font-h1 font-bold text-amber-300 text-xs">Nạp tiền Escrow bảo đảm đơn hàng ({(commission.finalPrice ?? 0).toLocaleString('vi-VN')}đ)</p>
                            <p className="mt-0.5 text-[11px] text-amber-200/80">
                              Khoản tiền sẽ được giữ an toàn bởi hệ thống và chỉ giải ngân cho họa sĩ sau khi bạn nghiệm thu từng mốc.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDepositEscrow}
                          disabled={depositingEscrow}
                          className="commission-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-md transition disabled:opacity-50 shrink-0 [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%-6px))]"
                        >
                          {depositingEscrow ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                          Nạp Escrow ngay
                        </button>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-center items-center my-3 relative overflow-hidden border border-white/10 bg-[#1F1F22] p-4 min-h-[320px] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]">
                      {currentWipPreviewUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative space-y-3">
                          <div
                            onClick={() => setShowApprovalModal(true)}
                            className="group relative cursor-pointer flex items-center justify-center max-h-[380px] w-full overflow-hidden border border-white/10 bg-black/60 p-2 transition duration-300 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentWipPreviewUrl}
                              alt={displayedMilestone?.title || 'Bản vẽ phác thảo'}
                              style={{ transform: `scale(${zoomScale})` }}
                              className="max-h-[360px] w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                            />

                            <div className="absolute top-3 left-3 flex items-center gap-1.5 border border-emerald-400/40 bg-black/80 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-md [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)]">
                              <ShieldCheck size={12} className="text-emerald-400" /> Bản phác thảo xem thử
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                              <span className="commission-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-lg [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))]">
                                <Maximize2 size={16} /> Xem chi tiết &amp; Phản hồi Mốc #{displayedMilestone?.sequence}
                              </span>
                            </div>
                          </div>

                          {displayedMilestone?.status === 'RevisionRequested' && (
                            <div className="w-full border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-1 [clip-path:polygon(6px_0,calc(100%-6px)_0,100%_6px,100%_calc(100%-6px),calc(100%-6px)_100%,6px_100%,0_calc(100%-6px),0_6px)]">
                              <div className="flex items-center justify-between font-bold text-amber-300">
                                <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                  <CircleAlert size={14} className="text-amber-400" /> Yêu cầu điều chỉnh từ khách hàng:
                                </span>
                                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 border border-amber-400/30">
                                  {displayedMilestone.revisionCount}/{displayedMilestone.maxRevisions}
                                </span>
                              </div>
                              {displayedMilestone.revisionFeedback && (
                                <p className="italic bg-black/40 p-2.5 border border-amber-500/20 text-amber-100 text-[11px]">
                                  &ldquo;{displayedMilestone.revisionFeedback}&rdquo;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-3 p-6">
                          <div className="bg-brand-periwinkle/10 p-4 text-brand-periwinkle border border-brand-periwinkle/20 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
                            <UploadCloud size={32} className="animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">Đang chờ bản phác thảo Mốc #{displayedMilestone?.sequence ?? 1}</p>
                            <p className="mt-1 max-w-sm text-[11px] text-on-surface-variant leading-relaxed">
                              Họa sĩ đang thực hiện công đoạn vẽ cho mốc này. Hình ảnh sẽ tự động hiển thị ngay khi họa sĩ tải lên!
                            </p>
                          </div>
                          {isCreator && (
                            <button
                              type="button"
                            disabled={!displayedMilestone}
                              onClick={() => setShowSubmitModal(true)}
                            className="commission-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-40 [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%-6px))]"
                            >
                              <UploadCloud size={15} /> Tải phác thảo Mốc #{displayedMilestone?.sequence ?? 1}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-3 border-t border-white/10">
                      <div className="glass-container p-3.5 space-y-2.5 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-h1 font-bold text-xs text-on-surface">Bàn giao Sản Phẩm Hoàn Chỉnh</h4>
                            <p className="text-[10px] text-outline">Tải trọn bộ file vẽ gốc HD sắc nét (.PSD, .PNG, .ZIP)</p>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold border [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)] ${allMilestonesApproved
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/10 bg-white/5 text-outline'
                            }`}>
                            {allMilestonesApproved ? 'Sẵn sàng nhận file' : 'Chưa mở khóa'}
                          </span>
                        </div>

                        {commissionStatus === 'SubmittedFinal' || commissionStatus === 'Delivered' || commissionStatus === 'Completed' ? (
                          <div
                            onClick={() => setShowDeliveryModal(true)}
                            className="flex items-center justify-between border border-emerald-500/40 bg-emerald-500/10 p-3 cursor-pointer transition hover:bg-emerald-500/20 [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)]"
                          >
                            <div className="flex items-center gap-3">
                              <FileArchive size={24} className="text-emerald-400" />
                              <div>
                                <p className="text-xs font-bold text-emerald-300">File gốc HD đã được bàn giao!</p>
                                <p className="text-[10px] text-emerald-200/80">Bấm để nghiệm thu &amp; tải tệp về thiết bị.</p>
                              </div>
                            </div>
                            <Download size={16} className="text-emerald-300" />
                          </div>
                        ) : isCreator && allMilestonesApproved ? (
                          <button
                            type="button"
                            onClick={() => setShowDeliveryModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400 [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))]"
                          >
                            <UploadCloud size={16} /> Bàn giao File gốc HD (.PSD, .ZIP)
                          </button>
                        ) : (
                          <div className="flex items-center gap-2.5 border border-white/10 bg-white/5 p-2.5 text-xs text-outline [clip-path:polygon(6px_0,calc(100%-6px)_0,100%_6px,100%_calc(100%-6px),calc(100%-6px)_100%,6px_100%,0_calc(100%-6px),0_6px)]">
                            <Lock size={16} className="shrink-0 text-outline" />
                            <span className="text-[11px]">File vẽ gốc HD sẽ tự động mở khóa sau khi tất cả các mốc phác thảo được duyệt.</span>
                          </div>
                        )}

                        {/* ĐÁNH GIÁ CỦA KHÁCH & PHẢN HỒI CỦA CREATOR TRONG WORKROOM */}
                        {commission?.review && (
                          <div className="mt-3 border border-white/10 bg-white/[0.03] p-3.5 rounded-xl space-y-2.5 text-xs text-slate-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-400 font-bold">★ {commission.review.rating}/5</span>
                                <span className="font-semibold text-white">Đánh giá của khách hàng</span>
                              </div>
                              {commission.review.createdAt && (
                                <span className="text-[10px] text-slate-500">{new Date(commission.review.createdAt).toLocaleDateString('vi-VN')}</span>
                              )}
                            </div>
                            {commission.review.comment && (
                              <p className="text-white/90 italic bg-black/20 p-2.5 rounded-lg border border-white/5">&ldquo;{commission.review.comment}&rdquo;</p>
                            )}
                            {commission.review.reviewerReply ? (
                              <div className="border-l-2 border-[#A7ACD9] pl-3 py-1 space-y-0.5">
                                <p className="text-[11px] font-semibold text-[#A7ACD9]">Phản hồi từ Creator:</p>
                                <p className="text-white/90">{commission.review.reviewerReply}</p>
                              </div>
                            ) : isCreator ? (
                              <button
                                type="button"
                                onClick={() => setShowReplyModal(true)}
                                className="w-full py-1.5 px-3 rounded-lg bg-[#A7ACD9]/20 hover:bg-[#A7ACD9]/30 border border-[#A7ACD9]/40 text-[#C5C9F8] font-semibold text-xs transition"
                              >
                                💬 Trả lời đánh giá này
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* VIEW 2: BRIEF PAGE */}
                {rightPageView === 'brief' && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 sm:pr-64">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-brand-periwinkle" />
                        <h3 className="font-h1 text-sm font-bold text-on-surface">Brief Yêu Cầu Dự Án Commission</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRightPageView('canvas')}
                        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-outline hover:text-white transition"
                      >
                        ← Quay lại Canvas
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                      <div className="glass-container p-4 space-y-2 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                        <span className="text-[10px] font-mono font-bold text-brand-periwinkle">MÃ ĐƠN HÀNG: #CMD-{roomId.slice(0, 8).toUpperCase()}</span>
                        <h2 className="font-h1 text-base font-bold text-on-surface">{room.chatRoomTitle || 'Thiết kế tranh Minh hoạ Commission'}</h2>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                          <div>
                            <span className="text-outline text-[11px]">Giá hợp đồng:</span>
                            <p className="font-bold text-on-surface text-sm">{(commission?.finalPrice ?? commission?.totalPrice ?? 0).toLocaleString('vi-VN')}đ</p>
                          </div>
                          <div>
                            <span className="text-outline text-[11px]">Trạng thái Escrow:</span>
                            <p className="font-bold text-brand-periwinkle text-sm">
                              {commission?.escrowStatus === 'Released'
                                ? 'Đã giải ngân (Hoàn tất)'
                                : commission?.escrowStatus === 'PartialReleased'
                                  ? 'Đã nạp (Đang giải ngân)'
                                  : commission?.escrowStatus === 'Deposited'
                                    ? 'Đã nạp Escrow'
                                    : commission?.escrowStatus === 'Refunded'
                                      ? 'Đã hoàn tiền'
                                      : 'Chờ nạp Escrow'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="glass-container p-4 space-y-2 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                        <h4 className="font-h1 text-xs font-bold text-brand-periwinkle">Mô tả &amp; Yêu cầu phong cách nghệ thuật</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                          {commission?.description || 'Chi tiết thỏa thuận mô tả nhân vật, bối cảnh, màu sắc và phong cách nghệ thuật theo hợp đồng commission.'}
                        </p>
                      </div>

                      <div className="glass-container p-4 space-y-2 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                        <h4 className="font-h1 text-xs font-bold text-brand-periwinkle">Tóm tắt các mốc thanh toán Escrow</h4>
                        <div className="space-y-1.5 pt-1">
                          {sortedMilestones.map((ms) => (
                            <div key={ms.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5">
                              <span className="font-medium text-on-surface">Mốc #{ms.sequence}: {ms.title}</span>
                              <span className="font-bold text-brand-periwinkle">{ms.price.toLocaleString('vi-VN')}đ</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 3: MILESTONES PAGE */}
                {rightPageView === 'milestones' && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 sm:pr-64">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-brand-periwinkle" />
                        <h3 className="font-h1 text-sm font-bold text-on-surface">Chi Tiết Danh Sách Mốc Tiến Độ</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRightPageView('canvas')}
                          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-outline hover:text-white transition"
                        >
                          ← Quay lại Canvas
                        </button>
                      </div>
                    </div>

                    {commission && (
                      <WorkroomProgressPanel
                        commissionId={commission.id}
                        allApproved={allMilestonesApproved}
                        isCancelled={commissionStatus === 'Cancelled'}
                        totalMilestones={sortedMilestones.length}
                        onCancelClick={!isCommissionEnded ? () => setShowCancelModal(true) : undefined}
                      />
                    )}

                    <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                      {sortedMilestones.map((ms) => {
                        const isCurrent = ms.id === activeStageMilestone?.id;
                        const isApproved = ms.status === 'Approved';
                        const isRevision = ms.status === 'RevisionRequested';

                        return (
                          <div
                            key={ms.id}
                            className={`glass-container p-4 space-y-2 border transition [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] ${isCurrent ? 'border-brand-periwinkle bg-brand-periwinkle/10' : 'border-white/10'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-h1 font-bold text-xs text-brand-periwinkle">Mốc #{ms.sequence}</span>
                                <h4 className="font-bold text-xs text-on-surface">{ms.title}</h4>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-bold border [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)] ${isApproved ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : isRevision ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-white/5 text-outline'
                                }`}>
                                {isApproved ? 'Đã duyệt' : isRevision ? 'Yêu cầu sửa' : isCurrent ? 'Đang thực hiện' : 'Chờ xử lý'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-outline pt-1 border-t border-white/5">
                              <span>Giá mốc: <strong className="text-on-surface">{ms.price.toLocaleString('vi-VN')}đ</strong></span>
                              <span>Số lần sửa: <strong className="text-amber-300">{ms.revisionCount ?? 0}/{ms.maxRevisions ?? 3}</strong></span>
                            </div>

                            {ms.revisionFeedback && (
                              <p className="text-[11px] italic bg-black/30 p-2 rounded border border-amber-500/20 text-amber-200">
                                &ldquo;{ms.revisionFeedback}&rdquo;
                              </p>
                            )}

                            <div className="flex justify-end pt-1 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMilestoneId(ms.id);
                                  setRightPageView('canvas');
                                }}
                                className="px-3 py-1 rounded text-[11px] font-semibold bg-white/5 border border-white/10 text-on-surface hover:bg-white/10"
                              >
                                <Eye size={12} className="inline mr-1" /> Xem phác thảo mốc
                              </button>

                              {isCreator && isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMilestoneId(ms.id);
                                    setShowSubmitModal(true);
                                  }}
                                  className="commission-primary px-3 py-1 rounded text-[11px] font-bold shadow"
                                >
                                  <UploadCloud size={12} className="inline mr-1" /> Nộp phác thảo
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

      {/* MODALS NGHIỆP VỤ HỢP ĐỒNG (CÁC MODAL HIỆN CÓ KHÔNG SỬA ĐỔI PROTOCOL) */}
      {room.commissionId && (
        <>
          {displayedMilestone && <SubmitMilestoneModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            commissionId={room.commissionId}
            milestoneId={displayedMilestone.id}
            milestoneTitle={displayedMilestone.title}
            onSuccess={() => {
              setShowSubmitModal(false);
              refresh();
              void chat.sendMessage(`🎨 Creator đã nộp bản phác thảo cho mốc: ${displayedMilestone?.title || 'bản vẽ phác thảo mới'}`, 'SystemEvent').catch(() => null);
            }}
          />}

          <ApprovalRevisionModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            commissionId={room.commissionId}
            milestoneId={displayedMilestone?.id || ''}
            wipPreviewUrl={currentWipPreviewUrl || 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=80'}
            maxRevisions={displayedMilestone?.maxRevisions ?? 3}
            revisionCount={displayedMilestone?.revisionCount ?? 0}
            isCreator={isCreator}
            revisionFeedback={displayedMilestone?.revisionFeedback}
            revisionFeedbackImageUrl={displayedMilestone?.revisionFeedbackImageUrl}
            revisionAnnotationsJson={displayedMilestone?.revisionAnnotationsJson}
            milestoneStatus={displayedMilestone?.status}
            onOpenSubmitModal={() => setShowSubmitModal(true)}
            onSuccess={() => {
              setShowApprovalModal(false);
              refresh();
              void chat.sendMessage('🔄 Tiến độ mốc hợp đồng vừa được cập nhật.', 'SystemEvent').catch(() => null);
            }}
          />

          <FinalDeliveryModal
            isOpen={showDeliveryModal}
            onClose={() => setShowDeliveryModal(false)}
            commissionId={room.commissionId}
            isCreator={isCreator}
            commissionStatus={commissionStatus}
            onOpenReviewModal={() => setShowReviewModal(true)}
            onSuccess={() => {
              setShowDeliveryModal(false);
              refresh();
              void chat.sendMessage('📦 Trạng thái bàn giao File gốc HD vừa được cập nhật!', 'SystemEvent').catch(() => null);
            }}
          />

          <ReviewRatingModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            commissionId={room.commissionId}
            creatorName="Linh Nguyen"
            onReviewSubmitted={() => {
              setShowReviewModal(false);
              refresh();
            }}
          />

          <CancelRefundModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            commissionId={room.commissionId}
            commission={commission}
            currentUserId={userId}
            onSuccess={() => {
              setShowCancelModal(false);
              refresh();
            }}
          />

          <RaiseDisputeModal
            isOpen={showDisputeModal}
            onClose={() => setShowDisputeModal(false)}
            commissionId={room.commissionId}
            onSuccess={() => {
              setShowDisputeModal(false);
              refresh();
              void chat.sendMessage('⚖️ Đã gửi yêu cầu khiếu nại tranh chấp tới Trọng tài sàn.', 'SystemEvent').catch(() => null);
            }}
          />

          {commission && (currentMemberRole === 'client' || currentMemberRole === 'creator') && (
            <section className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[.03] p-4">
              {(commission.dispute || commission.status === 'Cancelled' || commission.status === 'Disputed') && (
                <button type="button" onClick={() => setShowDisputeDetailsModal(true)} className="rounded-xl border border-[#A7ACD9]/40 px-4 py-2 text-sm text-[#C5C9F8] hover:bg-white/10 transition">
                  Xem hồ sơ &amp; kết quả tranh chấp
                </button>
              )}
              {commission.review && <div className="space-y-2 text-sm text-slate-300"><p className="font-semibold text-white">Đánh giá của khách: {commission.review.rating}/5</p>{commission.review.comment && <p>{commission.review.comment}</p>}{commission.review.reviewerReply ? <p className="border-l-2 border-[#A7ACD9] pl-3">Phản hồi của Creator: {commission.review.reviewerReply}</p> : currentMemberRole === 'creator' && commission.status === 'Completed' ? <button type="button" onClick={() => setShowReplyModal(true)} className="rounded-xl border border-white/15 px-4 py-2">Trả lời đánh giá</button> : null}</div>}
            </section>
          )}
          {showDisputeDetailsModal && <DisputeDetailsModal key={room.commissionId} isOpen commissionId={room.commissionId} initialDispute={commission?.dispute} onClose={() => setShowDisputeDetailsModal(false)} />}
          {showReplyModal && <CreatorReplyModal isOpen commissionId={room.commissionId} reviewComment={commission?.review?.comment} reviewRating={commission?.review?.rating} onClose={() => setShowReplyModal(false)} onSuccess={() => { setShowReplyModal(false); refresh(); }} />}
          {commission && (currentMemberRole === 'client' || currentMemberRole === 'creator') && (
            <WorkroomTermsModal
              isOpen={showTermsModal}
              role={currentMemberRole}
              commission={commission}
              isSubmitting={acceptingTerms}
              error={termsError}
              onConfirm={handleAcceptWorkroomTerms}
            />
          )}
        </>
      )}
    </div>
  );
}
