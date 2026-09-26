'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { chatService } from '../services/chat.service';
import { useChatHub } from '../hooks/use-chat-hub';
import { useAutoTranslate } from '../hooks/use-auto-translate';
import { WorkroomProgressPanel } from './workroom-progress-panel';
import type { ChatMessageDto, ChatRoomDto } from '../types/chat.types';
import { PageLoader } from '@/features/navigation';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { Commission, CommissionStatus } from '@/types/commission.types';

import SubmitMilestoneModal from '@/components/modals/SubmitMilestoneModal';
import ApprovalRevisionModal from '@/components/modals/ApprovalRevisionModal';
import FinalDeliveryModal from '@/components/modals/FinalDeliveryModal';
import ReviewRatingModal from '@/components/modals/ReviewRatingModal';
import CancelRefundModal from '@/components/modals/CancelRefundModal';

/** Tin nhắn đã hiện trên UI nhưng server chưa phát lại (chờ SignalR). */
interface PendingMessage {
  tempId: string;
  body: string;
}

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

  // States cho các Modal Hợp đồng & Cột mốc
  const [commission, setCommission] = useState<Commission | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isCreator = useMemo(() => {
    if (!userId) return false;
    const member = room?.members.find((m) => m.userId.toLowerCase() === userId.toLowerCase());
    return member?.memberRole?.toLowerCase() === 'creator';
  }, [room?.members, userId]);
  const isClient = !isCreator;
  const commissionStatus: CommissionStatus = commission?.status ?? 'InProgress';

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
  }, [commission?.milestones]);

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

  const currentMilestone = useMemo(() => {
    if (sortedMilestones.length === 0) return null;
    if (allMilestonesApproved || (commission?.currentStage && commission.currentStage > sortedMilestones.length)) {
      return sortedMilestones[sortedMilestones.length - 1];
    }
    return (
      sortedMilestones.find((m) => m.sequence === commission?.currentStage) ??
      sortedMilestones.find((m) => m.status !== 'Approved') ??
      sortedMilestones[sortedMilestones.length - 1]
    );
  }, [sortedMilestones, commission?.currentStage, allMilestonesApproved]);

  const rawWipUrl =
    currentMilestone?.wipPreviewUrl ||
    currentMilestone?.watermarkedUrl ||
    currentMilestone?.originalWipUrl ||
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
      // KHÔNG nuốt lỗi im lặng: đánh dấu để người dùng biết và bấm thử lại
      // (trước đây lỗi bị bỏ qua nên công tắc "Dịch tự động" trông như không chạy).
      setFailedTranslationIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
    } finally {
      setTranslatingIds((prev) => prev.filter((id) => id !== messageId));
    }
  }, []);

  const handleIncoming = useCallback(
    (message: ChatMessageDto) => {
      setMessages((prev) => (prev.some((m) => m.messageId === message.messageId) ? prev : [...prev, message]));

      // Tự động cập nhật Mốc hợp đồng & Canvas real-time khi có tin nhắn hoặc thông báo hệ thống mới
      if (room?.commissionId) {
        void commissionService.getById(room.commissionId).then((c) => setCommission(c)).catch(() => null);
      }

      if (userId && message.senderId === userId) {
        // Tin của chính mình đã phát về → bỏ bubble "đang gửi" tương ứng.
        setPending((prev) => {
          const index = prev.findIndex((p) => p.body === message.body);
          return index === -1 ? prev : [...prev.slice(0, index), ...prev.slice(index + 1)];
        });
        return;
      }

      // Bật dịch tự động: dịch ngay tin của đối tác (bỏ qua tin đã có bản dịch).
      if (autoTranslate && !message.translatedBody && message.body.trim()) {
        void translateOne(message.messageId);
      }
    },
    [userId, autoTranslate, translateOne, room?.commissionId],
  );

  const handleTyping = useCallback(
    (typerId: string) => {
      if (typerId === userId) return;
      setPartnerTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 3000);
    },
    [userId],
  );

  const handleRead = useCallback(
    (readerId: string, lastReadAt: string) => {
      if (readerId === userId) return;
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

  /**
   * Bật công tắc "Dịch tự động" thì dịch LUÔN các tin gần nhất của đối tác đang hiển thị
   * (tối đa 5 tin) — nếu không, người dùng bật công tắc mà không thấy gì xảy ra cho tới khi
   * đối tác nhắn tin mới. Giới hạn 5 để không bắn một loạt request AI khi mở phòng dài.
   */
  const handleToggleAutoTranslate = useCallback(() => {
    const turningOn = !autoTranslate;
    toggleAutoTranslate();
    if (!turningOn || !userId) return;

    const pending = messages
      .filter((m) => m.senderId !== userId && !m.translatedBody && m.body.trim())
      .slice(-5);

    // Dịch LẦN LƯỢT: bắn 5 request AI cùng lúc dễ bị chặn/quota và làm tin mới nhất
    // (tin quan trọng nhất) thất bại.
    void (async () => {
      for (const message of pending) {
        await translateOne(message.messageId);
      }
    })();
  }, [autoTranslate, toggleAutoTranslate, messages, userId, translateOne]);

  // Giữ tham chiếu markRead mới nhất để effect dưới chỉ phụ thuộc số lượng tin nhắn.
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

  const loadData = useCallback(async () => {
    try {
      const [r, m] = await Promise.all([chatService.getRoom(roomId), chatService.getMessages(roomId)]);
      setRoom(r);
      if (r.commissionId) {
        void commissionService.getById(r.commissionId).then((c) => setCommission(c)).catch(() => null);
      }
      // Backend trả về mới nhất trước -> đảo lại để render từ cũ đến mới
      setMessages([...m.items].reverse());
      setPartnerReadAt(r.members.find((member) => member.userId !== userId)?.lastReadAt ?? null);
      setError(null);
      await chatService.markRead(roomId).catch(() => {});
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Không tải được phòng làm việc.'));
    } finally {
      setLoading(false);
    }
  }, [roomId, userId]);

  /** Nút "Tải lại": bật spinner rồi nạp lại — gọi từ event handler nên setState đồng bộ là hợp lệ. */
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    void loadData();
  }, [loadData]);

  useEffect(() => {
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      await loadData();
    })();
  }, [loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending, partnerTyping]);

  // Đánh dấu đã đọc mỗi khi có tin mới (ưu tiên hub để đối tác thấy "đã xem" ngay).
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
          // Tệp đi qua REST nên phải nhờ hub phát cho đối tác.
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

    const body = inputBody.trim();
    if (!body && !selectedFile) return;

    setSending(true);
    setError(null);

    try {
      // 1. Nếu có tệp đã chọn, tải tệp lên trước
      if (selectedFile) {
        await handleSendFile(selectedFile);
      }

      // 2. Nếu có tin nhắn văn bản
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
    if (!room?.commissionId) return;
    setDepositingEscrow(true);
    setError(null);
    try {
      await commissionService.depositEscrow(room.commissionId);
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
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <PageLoader label="Đang mở phòng làm việc dự án…" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-on-surface">
        <CircleAlert size={44} className="mx-auto mb-3 text-outline" />
        <h1 className="font-h1 text-xl font-bold">Không tìm thấy phòng trao đổi</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Phòng trao đổi có thể chưa được tạo hoặc bạn không có quyền truy cập.</p>
        <Link href="/wallet" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-periwinkle hover:underline">
          <ArrowLeft size={16} /> Quay lại trang cá nhân
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 py-3 text-on-surface gap-3">
      {/* 1. Thanh tiêu đề phòng */}
      <div className="glass-container flex shrink-0 flex-wrap items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="rounded-full border border-white/10 p-2 text-outline hover:text-white" title="Quay lại">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-h1 text-base font-bold">{room.chatRoomTitle || 'Phòng trao đổi dự án'}</h1>
              {room.isLocked && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <Lock size={10} /> Đã khóa
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  chat.status === 'connected'
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/15 bg-white/5 text-outline'
                }`}
                title={
                  chat.status === 'connected'
                    ? 'Đang nhận tin nhắn tức thời'
                    : 'Mất kết nối tức thời — đang thử nối lại'
                }
              >
                {chat.status === 'connected' ? <Wifi size={10} /> : <WifiOff size={10} />}
                {chat.status === 'connected' ? 'Trực tiếp' : 'Đang nối lại'}
              </span>
            </div>
            <p className="text-xs text-outline">
              Thành viên: {room.members.map((m) => m.fullName || 'Người dùng').join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-outline">
          <ShieldCheck size={16} className="text-brand-periwinkle" />
          <span className="hidden sm:inline">Tin nhắn bảo mật theo hợp đồng</span>

          {/* Công tắc AI Real-time Translation */}
          <button
            type="button"
            onClick={handleToggleAutoTranslate}
            aria-pressed={autoTranslate}
            title="Tự động dịch tin nhắn của đối tác sang tiếng Việt"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              autoTranslate
                ? 'border-brand-periwinkle/40 bg-brand-periwinkle/15 text-brand-periwinkle'
                : 'border-white/15 bg-white/5 text-outline hover:text-white'
            }`}
          >
            <Globe size={12} />
            Dịch tự động
            <span
              className={`ml-0.5 inline-block h-3 w-6 rounded-full transition ${
                autoTranslate ? 'bg-brand-periwinkle' : 'bg-white/20'
              }`}
              aria-hidden="true"
            >
              <span
                className={`block size-3 rounded-full bg-brand-navy transition ${
                  autoTranslate ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-white/10 p-2 text-outline hover:text-white"
            title="Tải lại tin nhắn"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 2. SCR-46 — Cảnh báo tiến độ & AI Deadline Predictor */}
      {room.commissionId && (
        <WorkroomProgressPanel
          commissionId={room.commissionId}
          onCancelClick={() => setShowCancelModal(true)}
          allApproved={allMilestonesApproved}
          isCancelled={commissionStatus === 'Cancelled'}
          totalMilestones={commission?.milestones?.length}
        />
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          <CircleAlert size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Banner Nạp tiền Escrow cho Khách hàng khi Creator đã chấp nhận đơn */}
      {isClient && commission?.escrowStatus === 'Pending' && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 p-3.5 text-xs text-amber-200 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-bold text-amber-300 text-xs">Yêu cầu Nạp tiền Ký quỹ Escrow ({(commission.finalPrice ?? 0).toLocaleString('vi-VN')}đ)</p>
              <p className="mt-0.5 text-[11px] text-amber-200/80">
                Creator đã chấp nhận đơn hàng. Vui lòng nạp tiền vào ví Escrow để Creator bắt đầu vẽ mốc phác thảo đầu tiên.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDepositEscrow}
            disabled={depositingEscrow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-brand-navy shadow-md transition hover:brightness-110 disabled:opacity-50 shrink-0"
          >
            {depositingEscrow ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            Nạp tiền Escrow ngay
          </button>
        </div>
      )}

      {/* 3. BỐ CỤC 3 CỘT STUDIO THEO PHƯƠNG ÁN 3 */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12 min-h-0">
        
        {/* ========================================================================= */}
        {/* CỘT 1 (LG:COL-SPAN-3): TIẾN ĐỘ MỐC (MILESTONES & REVISIONS LIST) */}
        {/* ========================================================================= */}
        <div className="glass-container flex h-full flex-col overflow-y-auto rounded-3xl border border-white/10 p-4 space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
              <Clock size={14} className="text-brand-periwinkle" /> Danh sách Mốc hợp đồng
            </h3>
            <span className="rounded-full bg-brand-periwinkle/15 px-2 py-0.5 text-[10px] font-bold text-brand-periwinkle border border-brand-periwinkle/30">
              {commission?.milestones?.length ?? 0} Mốc
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1">
            {sortedMilestones && sortedMilestones.length > 0 ? (
              sortedMilestones.map((ms) => {
                const isCurrent = ms.sequence === (currentMilestone?.sequence ?? commission?.currentStage);
                const isApproved = ms.status === 'Approved';
                const isRevisionReq = ms.status === 'RevisionRequested';

                return (
                  <div
                    key={ms.id}
                    className={`rounded-2xl border p-3 text-xs transition duration-200 ${
                      isCurrent
                        ? 'border-brand-periwinkle/60 bg-brand-periwinkle/10 shadow-lg shadow-brand-periwinkle/5 ring-1 ring-brand-periwinkle/30'
                        : isApproved
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isRevisionReq
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-white/10 bg-white/5 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-on-surface">
                        Mốc #{ms.sequence}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 size={12} /> Đã duyệt
                        </span>
                      ) : isRevisionReq ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                          <RefreshCw size={11} className="animate-spin" /> Chờ chỉnh sửa
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-periwinkle animate-pulse">
                          ● Đang thực hiện
                        </span>
                      ) : (
                        <span className="text-[10px] text-outline">Chưa bắt đầu</span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-on-surface line-clamp-1">{ms.title}</h4>
                    
                    <div className="mt-2 flex items-center justify-between text-[11px] text-outline border-t border-white/5 pt-1.5">
                      <span>Giá: <strong className="text-on-surface">{ms.price.toLocaleString('vi-VN')}đ</strong></span>
                      <span>Sửa: <strong className="text-amber-300">{ms.revisionCount ?? 0}/{ms.maxRevisions ?? 3}</strong></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-outline italic">Chưa có thông tin mốc.</div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT 2 (LG:COL-SPAN-5): CANVAS STUDIO WORKSPACE (XEM PREVIEW WIP & FILE GỐC) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 lg:col-span-5">
          {/* Panel 1: Artwork WIP Preview Viewer Card */}
          <div className="glass-container flex flex-col rounded-3xl border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-brand-periwinkle/15 px-2 py-0.5 text-[10px] font-bold text-brand-periwinkle">
                    {allMilestonesApproved
                      ? 'Hoàn tất các mốc'
                      : `Mốc #${currentMilestone?.sequence ?? commission?.currentStage ?? 1}`}
                  </span>
                  <h3 className="font-bold text-sm text-on-surface">
                    {currentMilestone?.title || 'Bản phác thảo mốc hiện tại'}
                  </h3>
                </div>
                <p className="mt-1 text-[11px] text-outline">
                  Bản vẽ xem thử do Creator đăng tải được tự động gắn Watermark bảo vệ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 shrink-0">
                  Lượt sửa: {currentMilestone?.revisionCount ?? 0} / {currentMilestone?.maxRevisions ?? 3}
                </span>

                {/* NÚT TẢI LÊN PHÁC THẢO CHO CREATOR */}
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-periwinkle px-3 py-1.5 text-xs font-bold text-brand-navy shadow transition hover:brightness-110"
                    title="Tải lên bản vẽ phác thảo WIP cho mốc này"
                  >
                    <UploadCloud size={14} /> Nộp phác thảo
                  </button>
                )}
              </div>
            </div>

            {/* Khung hiển thị ảnh Canvas */}
            {currentWipPreviewUrl ? (
              <div className="space-y-3">
                <div
                  onClick={() => setShowApprovalModal(true)}
                  className="group relative flex min-h-[220px] max-h-[360px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/40 p-2 transition hover:border-brand-periwinkle/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentWipPreviewUrl}
                    alt={currentMilestone?.title || 'Bản vẽ phác thảo'}
                    className="max-h-[340px] w-full object-contain rounded-xl transition duration-300 group-hover:scale-[1.01]"
                  />

                  {/* Badge watermark */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-black/70 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Watermarked Preview
                  </div>

                  {/* Hover overlay với nút phóng to */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-brand-navy shadow-lg">
                      <Eye size={16} /> Phóng to & Duyệt mốc
                    </span>
                  </div>
                </div>

                {currentMilestone?.status === 'RevisionRequested' && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <CircleAlert size={14} className="text-amber-400" /> Khách hàng yêu cầu sửa đổi (Revision):
                      </span>
                      <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
                        Lượt sửa {currentMilestone.revisionCount}/{currentMilestone.maxRevisions}
                      </span>
                    </div>
                    {currentMilestone.revisionFeedback && (
                      <p className="italic bg-black/40 p-3 rounded-xl border border-amber-500/20 text-amber-100 leading-relaxed">
                        "{currentMilestone.revisionFeedback}"
                      </p>
                    )}
                    {isCreator && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setShowSubmitModal(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 shadow transition"
                        >
                          <UploadCloud size={14} /> Nộp bản phác thảo đã sửa
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentMilestone?.creatorNote && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                    <p className="flex items-center gap-1.5 font-semibold text-outline text-[11px] mb-1">
                      <MessageSquare size={12} className="text-brand-periwinkle" /> Ghi chú từ Creator:
                    </p>
                    <p className="italic text-on-surface-variant">{currentMilestone.creatorNote}</p>
                  </div>
                )}

                {isCreator && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand-periwinkle/40 bg-brand-periwinkle/15 px-3 py-1.5 text-xs font-bold text-brand-periwinkle transition hover:bg-brand-periwinkle/25"
                    >
                      <UploadCloud size={14} /> Tải bản vẽ mới / Cập nhật WIP
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/5 p-8 text-center space-y-3">
                <div className="rounded-full bg-brand-periwinkle/10 p-3 text-brand-periwinkle">
                  <UploadCloud size={28} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Chưa có bản vẽ phác thảo cho mốc này</p>
                  <p className="mt-1 max-w-sm text-[11px] text-outline">
                    Creator chưa tải lên hình ảnh WIP cho mốc hiện tại. Bản vẽ bảo vệ sẽ xuất hiện tại đây ngay khi được gửi.
                  </p>
                </div>
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-periwinkle px-4 py-2 text-xs font-bold text-brand-navy shadow-lg transition hover:brightness-110"
                  >
                    <UploadCloud size={16} /> Tải lên bản phác thảo mốc #{currentMilestone?.sequence ?? 1}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Panel 2: Final Master Package Card */}
          <div className="glass-container flex flex-col rounded-3xl border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-on-surface">Final Master Package</h3>
                <p className="text-[10px] text-outline">Bàn giao file gốc HD không đóng dấu (.PSD, .ZIP).</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                allMilestonesApproved
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/15 bg-white/5 text-outline'
              }`}>
                {allMilestonesApproved ? 'Sẵn sàng bàn giao' : 'Đang khóa'}
              </span>
            </div>

            {commissionStatus === 'SubmittedFinal' || commissionStatus === 'Delivered' || commissionStatus === 'Completed' ? (
              <div
                onClick={() => setShowDeliveryModal(true)}
                className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 cursor-pointer transition hover:bg-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <FileArchive size={26} className="text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300">File gốc HD đã được bàn giao!</p>
                    <p className="text-[10px] text-emerald-200/70">Bấm để kiểm tra nghiệm thu và nhận link tải.</p>
                  </div>
                </div>
                <Download size={16} className="text-emerald-300" />
              </div>
            ) : isCreator && allMilestonesApproved ? (
              <button
                type="button"
                onClick={() => setShowDeliveryModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
              >
                <UploadCloud size={16} /> Bàn giao File gốc HD (.PSD, .ZIP)
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left text-xs">
                <Lock size={20} className="text-outline shrink-0" />
                <p className="text-[11px] text-outline">
                  File gốc HD sẽ được mở khóa sau khi duyệt 100% các mốc phác thảo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT 3 (LG:COL-SPAN-4): REAL-TIME LIVE CHAT FEED (SIGNALR) */}
        {/* ========================================================================= */}
        <div className="glass-container flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 p-4 lg:col-span-4">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              SignalR Live Chat
            </div>
            <span className="text-[10px] text-outline">Trực tiếp</span>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
            {messages.length === 0 && pending.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-outline p-4">
                <p>Chưa có tin nhắn nào.</p>
                <p className="mt-1 text-[11px]">Hãy bắt đầu trao đổi về ý tưởng và tiến độ với đối tác.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = userId && msg.senderId === userId;
                const isTranslating = translatingIds.includes(msg.messageId);
                return (
                  <div
                    key={msg.messageId}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[10px] text-outline">
                      <span className="font-medium text-on-surface-variant">
                        {isMe ? 'Bạn' : msg.senderFullName || 'Đối tác'}
                      </span>
                      <span>{new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-brand-periwinkle text-brand-navy rounded-tr-none font-medium'
                          : 'border border-white/10 bg-white/5 text-on-surface rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>

                      {msg.translatedBody && msg.translatedBody.trim() !== msg.body.trim() && (
                        <div className="mt-2 border-t border-black/10 pt-2 text-[11px] italic opacity-90">
                          <p className="flex items-center gap-1 font-semibold not-italic">
                            <Globe size={11} /> Bản dịch:
                          </p>
                          <p>{msg.translatedBody}</p>
                        </div>
                      )}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
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
                                    title="Bấm để xem ảnh kích thước đầy đủ"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={fullAttUrl}
                                      alt={att.fileName || 'Ảnh'}
                                      className="max-h-60 w-full object-contain rounded-xl transition duration-200 group-hover:scale-[1.01]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition duration-200 group-hover:opacity-100 text-white text-xs font-semibold gap-1.5">
                                      <Eye size={16} /> Xem ảnh gốc
                                    </div>
                                  </a>
                                ) : (
                                  <div className="flex items-center justify-between p-2.5 text-[11px] bg-white/5">
                                    <span className="inline-flex items-center gap-1.5 truncate text-on-surface font-medium">
                                      <FileText size={14} className="text-brand-periwinkle shrink-0" /> {att.fileName || 'Tệp đính kèm'}
                                    </span>
                                    <a
                                      href={fullAttUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 inline-flex items-center gap-1 rounded-lg bg-brand-periwinkle/20 px-2.5 py-1 font-semibold text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy transition"
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
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin" /> Đang dịch…
                        </span>
                      )}

                      {!isMe && msg.translatedBody && !isTranslating && (
                        <button
                          type="button"
                          onClick={() => void translateOne(msg.messageId, true)}
                          className="inline-flex items-center gap-1 hover:text-white"
                          title="Dịch lại tin này"
                        >
                          <RefreshCw size={10} /> Dịch lại
                        </button>
                      )}

                      {!isMe && !msg.translatedBody && !isTranslating && (
                        failedTranslationIds.includes(msg.messageId) ? (
                          <button
                            type="button"
                            onClick={() => void translateOne(msg.messageId)}
                            className="inline-flex items-center gap-1 text-red-300 hover:text-red-200"
                          >
                            <CircleAlert size={10} /> Dịch lỗi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void translateOne(msg.messageId)}
                            className="inline-flex items-center gap-1 hover:text-white"
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
                  <span className="font-medium text-on-surface-variant">Bạn</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={10} /> đang gửi
                  </span>
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-brand-periwinkle/60 p-3 text-xs leading-relaxed text-brand-navy">
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
                Đối tác đang gõ…
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Ô nhập tin nhắn & Xem trước tệp */}
          <div className="mt-3 shrink-0">
            {/* Cảnh báo khóa phòng chat khi đơn đã hoàn thành/kết thúc */}
            {isCommissionEnded && (
              <div className="mb-2 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold text-amber-300">
                <Lock size={14} className="shrink-0" />
                <span>Đơn hàng đã hoàn tất / kết thúc. Phòng hội thoại đã được khóa.</span>
              </div>
            )}

            {/* Thanh xem trước tệp chọn trước khi bấm gửi */}
            {selectedFile && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-brand-periwinkle/40 bg-brand-periwinkle/10 p-2.5 text-xs shadow-md">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedFilePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedFilePreview}
                      alt="Xem thử"
                      className="size-12 rounded-lg object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg bg-white/10 text-brand-periwinkle shrink-0">
                      <FileText size={20} />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-on-surface truncate text-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-outline">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Sẵn sàng gửi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="rounded-full bg-white/10 p-1.5 text-outline hover:bg-white/20 hover:text-white shrink-0"
                  title="Hủy chọn tệp này"
                >
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
              <button
                type="button"
                disabled={uploading || isChatDisabled}
                onClick={() => fileInputRef.current?.click()}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-outline transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                title="Đính kèm tệp phác thảo"
              >
                <Paperclip size={15} className={uploading ? 'animate-spin' : ''} />
              </button>

              <input
                type="text"
                disabled={isChatDisabled}
                value={inputBody}
                onChange={(e) => {
                  setInputBody(e.target.value);
                  chat.notifyTyping();
                }}
                placeholder={isChatDisabled ? 'Phòng chat đã được khóa.' : 'Nhập tin nhắn...'}
                className="flex-1 rounded-xl border border-white/15 bg-brand-navy/80 px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={(!inputBody.trim() && !selectedFile) || sending || uploading || isChatDisabled}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-brand-navy shadow-md transition hover:brightness-110 disabled:opacity-50"
                title="Gửi tin nhắn"
              >
                {sending || uploading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* MODALS NGHIỆP VỤ HỢP ĐỒNG */}
      {room.commissionId && (
        <>
          <SubmitMilestoneModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            commissionId={room.commissionId}
            milestoneId={currentMilestone?.id || ''}
            milestoneTitle={currentMilestone?.title || 'Bản phác thảo mốc hiện tại'}
            onSuccess={() => {
              setShowSubmitModal(false);
              refresh();
              void chat.sendMessage(`🎨 Creator đã nộp bản phác thảo cho mốc: ${currentMilestone?.title || 'bản vẽ phác thảo mới'}`, 'SystemEvent').catch(() => null);
            }}
          />

          <ApprovalRevisionModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            commissionId={room.commissionId}
            milestoneId={currentMilestone?.id || ''}
            wipPreviewUrl={currentWipPreviewUrl || 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=80'}
            maxRevisions={currentMilestone?.maxRevisions ?? 3}
            revisionCount={currentMilestone?.revisionCount ?? 0}
            isCreator={isCreator}
            revisionFeedback={currentMilestone?.revisionFeedback}
            milestoneStatus={currentMilestone?.status}
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
            onSuccess={() => {
              setShowCancelModal(false);
              refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
