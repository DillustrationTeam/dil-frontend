'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  Download,
  FileArchive,
  FileText,
  Globe,
  Lock,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { chatService } from '../services/chat.service';
import { useChatHub } from '../hooks/use-chat-hub';
import { useAutoTranslate } from '../hooks/use-auto-translate';
import { WorkroomProgressPanel } from './workroom-progress-panel';
import type { ChatMessageDto, ChatRoomDto } from '../types/chat.types';
import { PageLoader } from '@/features/navigation';
import { commissionService } from '@/services/commission.service';
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

export function WorkroomScreen({ roomId, userId }: { roomId: string; userId: string | null }) {
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputBody, setInputBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const currentUserMember = useMemo(
    () => room?.members.find((m) => m.userId === userId),
    [room, userId],
  );
  const isCreator = currentUserMember?.memberRole === 'Creator';
  const isClient = !isCreator;
  const commissionStatus: CommissionStatus = commission?.status ?? 'InProgress';

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
    [userId, autoTranslate, translateOne],
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
      setError(err instanceof Error ? err.message : 'Không tải được phòng làm việc.');
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
    if (!userId || !room) return;
    setUploading(true);
    setError(null);
    try {
      const attachment = await chatService.uploadAttachment(roomId, file);
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
      setError(err instanceof Error ? err.message : 'Tải tệp đính kèm thất bại.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = inputBody.trim();
    if (!body || sending || !userId || room?.isLocked) return;

    setSending(true);
    setError(null);
    setInputBody('');
    setPending((prev) => [...prev, { tempId: `${Date.now()}-${prev.length}`, body }]);

    try {
      // Gửi qua SignalR: server lưu DB rồi phát lại cho CẢ phòng (kể cả người gửi),
      // nhờ vậy hai bên thấy cùng một thứ tự tin nhắn.
      await chat.sendMessage(body);
    } catch (err: unknown) {
      setPending((prev) => prev.filter((p) => p.body !== body));
      setInputBody(body);
      setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
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
      {room.commissionId && <WorkroomProgressPanel commissionId={room.commissionId} />}

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          <CircleAlert size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Bố cục 2 Cột giống SCR-13 Mockup */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12 min-h-0">
        {/* CỘT TRÁI: Client Communications (SignalR Chat) */}
        <div className="glass-container flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 p-4 lg:col-span-5">
          {/* Header Cột Chat */}
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Client Communications (SignalR Chat)
            </div>
            <span className="text-[10px] text-outline">Trực tiếp</span>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && pending.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-outline">
                <p>Chưa có tin nhắn nào trong phòng làm việc này.</p>
                <p className="mt-1">Hãy bắt đầu trao đổi về ý tưởng tranh, yêu cầu phác thảo và tiến độ hoàn thành.</p>
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
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-brand-periwinkle text-brand-navy rounded-tr-none'
                          : 'border border-white/10 bg-white/5 text-on-surface rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>

                      {msg.translatedBody && msg.translatedBody.trim() !== msg.body.trim() && (
                        <div className="mt-2 border-t border-black/10 pt-2 text-[11px] italic opacity-90">
                          <p className="flex items-center gap-1 font-semibold not-italic">
                            <Globe size={11} /> Bản dịch tiếng Việt:
                          </p>
                          <p>{msg.translatedBody}</p>
                        </div>
                      )}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att) => {
                            const isImg = att.mimeType.startsWith('image/');
                            return (
                              <div key={att.messageAttachmentId} className="overflow-hidden rounded-xl border border-black/10 bg-black/20">
                                {isImg ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={att.fileUrl} alt={att.fileName || 'Ảnh'} className="max-h-48 w-full object-contain" />
                                ) : (
                                  <div className="flex items-center justify-between p-2 text-[11px]">
                                    <span className="inline-flex items-center gap-1.5 truncate">
                                      <FileText size={14} /> {att.fileName || 'Tệp đính kèm'}
                                    </span>
                                    <a
                                      href={att.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 inline-flex items-center gap-1 text-brand-periwinkle hover:underline"
                                    >
                                      <Download size={12} /> Tải về
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
                            <CircleAlert size={10} /> Dịch lỗi — thử lại
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void translateOne(msg.messageId)}
                            className="inline-flex items-center gap-1 hover:text-white"
                          >
                            <Globe size={10} /> Dịch sang Tiếng Việt
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

          {/* Ô nhập tin nhắn */}
          <div className="mt-3 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleSendFile(file);
                e.target.value = '';
              }}
            />

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploading || room.isLocked}
                onClick={() => fileInputRef.current?.click()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-outline transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                title="Đính kèm tệp phác thảo"
              >
                <Paperclip size={16} className={uploading ? 'animate-spin' : ''} />
              </button>

              <input
                type="text"
                disabled={room.isLocked}
                value={inputBody}
                onChange={(e) => {
                  setInputBody(e.target.value);
                  chat.notifyTyping();
                }}
                placeholder={room.isLocked ? 'Phòng đã đóng.' : 'Nhập tin nhắn trao đổi...'}
                className="flex-1 rounded-xl border border-white/15 bg-brand-navy/80 px-3.5 py-2.5 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputBody.trim() || sending || room.isLocked}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-brand-navy shadow-md transition hover:brightness-110 disabled:opacity-50"
                title="Gửi tin nhắn"
              >
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: Workroom Action Workspace & Deliverables Panel (Khung thao tác giống SCR-13 Mockup) */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 lg:col-span-7">
          {/* Panel 1: Upload Stage WIP Preview Workspace */}
          <div className="glass-container flex flex-col rounded-3xl border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Upload Stage WIP Preview</h3>
                <p className="text-[11px] text-outline">Preview image will be auto-watermarked via CDN before client review.</p>
              </div>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                Revision Used: 1 / 3
              </span>
            </div>

            {/* Vùng nộp bản thảo Dropzone */}
            <div 
              onClick={() => setShowSubmitModal(true)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center cursor-pointer transition hover:border-brand-periwinkle/50 hover:bg-white/10"
            >
              <div className="mb-2 rounded-full bg-brand-periwinkle/10 p-3 text-brand-periwinkle">
                <UploadCloud size={28} />
              </div>
              <p className="text-xs font-semibold text-on-surface">Drag & drop WIP preview file here</p>
              <p className="mt-1 text-[10px] text-outline">Max 25MB · JPG, PNG, WEBP (Auto Watermarked)</p>
            </div>

            {/* Ghi chú tiến độ */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-outline">Progress Notes for Client</label>
              <textarea
                rows={2}
                placeholder="e.g. Completed clean lineart for outfit and weapon details..."
                className="w-full rounded-xl border border-white/15 bg-brand-navy/80 p-3 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-brand-navy shadow-md transition hover:brightness-110 flex items-center justify-center gap-2"
            >
              🚀 Submit Milestone Progress to Client
            </button>
          </div>

          {/* Panel 2: Final Deliverables Master Package Uploader */}
          <div className="glass-container flex flex-col rounded-3xl border border-white/10 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Final Deliverables Master Package Uploader</h3>
              <p className="text-[11px] text-outline">Upload original un-watermarked master files (.PSD, .SAI, .ZIP). Stored securely in AWS S3 Private Bucket.</p>
            </div>

            <div 
              onClick={() => setShowDeliveryModal(true)}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 cursor-pointer transition hover:bg-white/10"
            >
              <FileArchive size={24} className="text-brand-periwinkle" />
              <div className="text-left">
                <p className="text-xs font-bold text-on-surface">Upload Un-watermarked Master File (.PSD, .ZIP)</p>
                <p className="text-[10px] text-outline">Unlocked by Client only after 100% Milestone Approvals</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeliveryModal(true)}
              className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/20 py-2.5 text-xs font-bold text-emerald-300 shadow-md transition hover:bg-emerald-500/30 flex items-center justify-center gap-2"
            >
              📦 Deliver Final Master Artwork Package
            </button>
          </div>

          {/* Panel 3: Thanh Thao tác Hợp đồng (Conditional Rendering theo Trạng thái & Role) */}
          <div className="glass-container flex flex-wrap items-center justify-between rounded-2xl border border-white/10 p-3 text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Hành động:</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-brand-periwinkle">
                {isCreator ? 'Artist (Creator)' : 'Khách hàng (Client)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* TRẠNG THÁI 1: InProgress (Đang vẽ / Milestone đang nộp) */}
              {(commissionStatus === 'InProgress' || commissionStatus === 'PendingAcceptance' || commissionStatus === 'Negotiating') && (
                <>
                  {isClient ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowApprovalModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                      >
                        🔍 Duyệt mốc / Yêu cầu sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20"
                      >
                        🚫 Hủy đơn
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-bold text-purple-300 transition hover:bg-purple-500/20"
                      >
                        📤 Nộp bản vẽ (Submit WIP)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20"
                      >
                        🚫 Hủy đơn
                      </button>
                    </>
                  )}
                </>
              )}

              {/* TRẠNG THÁI 2: SubmittedFinal / Delivered (Đã giao file gốc cuối cùng) */}
              {(commissionStatus === 'SubmittedFinal' || commissionStatus === 'Delivered') && (
                <>
                  {isClient ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                      >
                        ✅ Nghiệm thu &amp; Nhận file gốc
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20"
                      >
                        ⚖️ Mở khiếu nại (Dispute)
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300">
                        ⏳ Chờ khách nghiệm thu
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-300 transition hover:bg-indigo-500/20"
                      >
                        📦 Bàn giao File HD
                      </button>
                    </>
                  )}
                </>
              )}

              {/* TRẠNG THÁI 3: Completed (Đã xong đơn hàng) */}
              {commissionStatus === 'Completed' && (
                <>
                  {isClient ? (
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20"
                    >
                      ⭐ Đánh giá Creator (1-5★)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20"
                    >
                      💬 Phản hồi đánh giá
                    </button>
                  )}
                </>
              )}

              {/* TRẠNG THÁI 4: Disputed / Cancelled (Có tranh chấp / mâu thuẫn) */}
              {(commissionStatus === 'Disputed' || commissionStatus === 'Cancelled') && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20"
                >
                  ⚖️ Mở khiếu nại (Dispute)
                </button>
              )}
            </div>
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
            milestoneId=""
            milestoneTitle="Bản phác thảo nhân vật (Mốc #1)"
            onSuccess={() => {
              setShowSubmitModal(false);
              refresh();
            }}
          />

          <ApprovalRevisionModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            commissionId={room.commissionId}
            milestoneId=""
            wipPreviewUrl="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=80"
            maxRevisions={3}
            revisionCount={0}
            onSuccess={() => {
              setShowApprovalModal(false);
              refresh();
            }}
          />

          <FinalDeliveryModal
            isOpen={showDeliveryModal}
            onClose={() => setShowDeliveryModal(false)}
            commissionId={room.commissionId}
            onSuccess={() => {
              setShowDeliveryModal(false);
              refresh();
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
