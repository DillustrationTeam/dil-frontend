'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Download,
  Eye,
  Globe,
  RefreshCw,
  Lock,
  Gavel,
  ChevronDown,
  User,
  Sparkles,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import type { ArtTradeDto, TradeStatus } from '@/types/art-trade.types';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatHub } from '@/features/chat/hooks/use-chat-hub';
import { useAutoTranslate } from '@/features/chat/hooks/use-auto-translate';
import type { ChatMessageDto, ChatRoomDto } from '@/features/chat/types/chat.types';
import { useLanguage } from '@/context/language-context';
import toast from 'react-hot-toast';

interface TradeChatRoomProps {
  trade: ArtTradeDto;
  currentUser?: { id?: string; fullName?: string; email?: string } | null;
  onOpenDispute?: () => void;
}

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

export function TradeChatRoom({ trade, currentUser, onOpenDispute }: TradeChatRoomProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputBody, setInputBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);

  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [autoTranslate, toggleAutoTranslate] = useAutoTranslate();
  const [translatingIds, setTranslatingIds] = useState<string[]>([]);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = currentUser?.id ?? null;
  const isInitiator = userId ? trade.initiator.id.toLowerCase() === userId.toLowerCase() : false;
  const isReceiver = userId ? trade.receiver.id.toLowerCase() === userId.toLowerCase() : false;

  const partnerName = useMemo(() => {
    if (isInitiator) {
      return trade.receiver?.fullName || (isVie ? 'Đối tác nhận (Side B)' : 'Receiver (Side B)');
    }
    return trade.initiator?.fullName || (isVie ? 'Người khởi tạo (Side A)' : 'Initiator (Side A)');
  }, [isInitiator, trade.receiver, trade.initiator, isVie]);

  const partnerRole = useMemo(() => {
    if (isInitiator) {
      return isVie ? 'Người nhận đề nghị (Side B)' : 'Partner / Receiver (Side B)';
    }
    return isVie ? 'Người đề nghị (Side A)' : 'Initiator (Side A)';
  }, [isInitiator, isVie]);

  const isTradeEnded = useMemo(() => {
    return (
      trade.status === 'Completed' ||
      trade.status === 'Cancelled' ||
      trade.status === 'Rejected'
    );
  }, [trade.status]);

  const isChatDisabled = Boolean(room?.isLocked || isTradeEnded);

  // Auto scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Monitor scroll for "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  // SignalR Callbacks
  const handleNewMessage = useCallback(
    (newMsg: ChatMessageDto) => {
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === newMsg.messageId)) {
          return prev.map((m) => (m.messageId === newMsg.messageId ? newMsg : m));
        }
        return [...prev, newMsg];
      });

      // Auto translate if enabled and message is from partner
      if (
        autoTranslate &&
        userId &&
        newMsg.senderId !== userId &&
        newMsg.body &&
        !newMsg.translatedBody
      ) {
        void (async () => {
          try {
            const targetLang = isVie ? 'vi' : 'en';
            const translated = await chatService.translateMessage(newMsg.messageId, targetLang);
            setMessages((prev) =>
              prev.map((m) =>
                m.messageId === newMsg.messageId
                  ? { ...m, translatedBody: translated.translatedBody }
                  : m
              )
            );
          } catch {
            // Ignore auto-translate failure
          }
        })();
      }

      // Check if user is scrolled near bottom
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight < 180) {
          setTimeout(() => scrollToBottom(true), 60);
        }
      }
    },
    [autoTranslate, userId, isVie, scrollToBottom]
  );

  const handlePartnerTyping = useCallback(() => {
    setPartnerTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setPartnerTyping(false);
    }, 2800);
  }, []);

  const handleFailure = useCallback((reason: string) => {
    toast.error(reason || 'Lỗi kết nối phòng chat.');
  }, []);

  const chat = useChatHub(trade.id, {
    onMessage: handleNewMessage,
    onTyping: handlePartnerTyping,
    onFailure: handleFailure,
  });

  // Initial Room & Messages Load
  const fetchRoomData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomData, messagesData] = await Promise.all([
        chatService.getRoom(trade.id),
        chatService.getMessages(trade.id, undefined, 50),
      ]);
      setRoom(roomData);
      // Backend returns messages in reverse order (newest first); reverse to chronological
      const sorted = [...messagesData.items].reverse();
      setMessages(sorted);
      setTimeout(() => scrollToBottom(false), 80);

      // Mark read
      void chatService.markRead(trade.id).catch(() => undefined);
    } catch (err: unknown) {
      console.error('Failed to load trade chat room:', err);
      setError(isVie ? 'Không thể tải phòng trò chuyện.' : 'Failed to load trade chat room.');
    } finally {
      setLoading(false);
    }
  }, [trade.id, isVie, scrollToBottom]);

  useEffect(() => {
    void fetchRoomData();
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [fetchRoomData]);

  // Translate a single message
  const handleTranslateOne = async (messageId: string, force = false) => {
    if (translatingIds.includes(messageId)) return;
    setTranslatingIds((prev) => [...prev, messageId]);
    try {
      const targetLang = isVie ? 'vi' : 'en';
      const result = await chatService.translateMessage(messageId, targetLang, force);
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === messageId ? { ...m, translatedBody: result.translatedBody } : m
        )
      );
    } catch (err: unknown) {
      console.error('Translation error:', err);
      toast.error(isVie ? 'Dịch tin nhắn thất bại.' : 'Failed to translate message.');
    } finally {
      setTranslatingIds((prev) => prev.filter((id) => id !== messageId));
    }
  };

  // Attachment Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error(isVie ? 'Tệp đính kèm không được vượt quá 20MB.' : 'File size must not exceed 20MB.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setSelectedFilePreview(url);
    } else {
      setSelectedFilePreview(null);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
      setSelectedFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isChatDisabled || sending || uploading || !userId) return;

    const trimmed = inputBody.trim();
    if (!trimmed && !selectedFile) return;

    try {
      setSending(true);

      if (selectedFile) {
        setUploading(true);
        // Upload attachment
        const att = await chatService.uploadAttachment(trade.id, selectedFile);
        if (att) {
          await chat.publishStoredMessage(att.messageId);
        }
        handleClearSelectedFile();
      }

      if (trimmed) {
        setInputBody('');
        await chat.sendMessage(trimmed);
      }

      setTimeout(() => scrollToBottom(true), 60);
    } catch (err: unknown) {
      console.error('Send message failed:', err);
      toast.error(isVie ? 'Không thể gửi tin nhắn.' : 'Failed to send message.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-[#0c0d14]/90 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[620px] max-h-[820px]">
      {/* 1. CHAT HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-900/30">
              {partnerName.slice(0, 2).toUpperCase()}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#0c0d14] ${
                chat.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={chat.status === 'connected' ? 'Live SignalR Connected' : 'Connecting...'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">{partnerName}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                {partnerRole}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              {partnerTyping ? (
                <span className="text-indigo-400 font-medium animate-pulse flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce" />
                  {isVie ? 'Đang soạn tin nhắn…' : 'Typing a message…'}
                </span>
              ) : (
                <span>
                  {chat.status === 'connected'
                    ? isVie
                      ? 'Trực tuyến · Phòng trao đổi bảo mật'
                      : 'Online · Secure Trade Room'
                    : isVie
                    ? 'Đang kết nối lại…'
                    : 'Connecting…'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Auto Translate Toggle */}
          <button
            type="button"
            onClick={toggleAutoTranslate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              autoTranslate
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-900/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title={
              autoTranslate
                ? isVie
                  ? 'Tắt dịch tự động tin nhắn đối tác'
                  : 'Disable AI auto-translation'
                : isVie
                ? 'Bật dịch tự động tin nhắn đối tác'
                : 'Enable AI auto-translation'
            }
          >
            <Sparkles className="size-3.5 text-indigo-400" />
            <span className="hidden sm:inline">
              {autoTranslate
                ? isVie
                  ? 'AI Dịch: Bật'
                  : 'AI Translate: On'
                : isVie
                ? 'AI Dịch'
                : 'AI Translate'}
            </span>
          </button>

          {/* Refresh Messages */}
          <button
            type="button"
            onClick={() => void fetchRoomData()}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isVie ? 'Tải lại tin nhắn' : 'Reload messages'}
          >
            <RefreshCw className="size-4" />
          </button>

          {/* Quick Dispute Action */}
          {onOpenDispute && !isTradeEnded && (
            <button
              type="button"
              onClick={onOpenDispute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
              title={isVie ? 'Khiếu nại / Báo cáo sự cố' : 'Raise Dispute / Report'}
            >
              <Gavel className="size-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isVie ? 'Khiếu nại' : 'Dispute'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. NOTICE BANNER IF TRADE IS CLOSED / LOCKED */}
      {isChatDisabled && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200">
          <Lock className="size-4 text-amber-400 shrink-0" />
          <span>
            {isVie
              ? 'Giao dịch trao đổi này đã kết thúc. Phòng chat được chuyển sang chế độ chỉ đọc lưu trữ.'
              : 'This art trade has ended. The chat room is now in read-only archive mode.'}
          </span>
        </div>
      )}

      {/* 3. MESSAGE LIST CONTAINER */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="size-8 animate-spin text-purple-400 mb-3" />
            <p className="text-xs">{isVie ? 'Đang tải tin nhắn…' : 'Loading messages…'}</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
            <AlertCircle className="size-5 mx-auto mb-1 text-red-400" />
            {error}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="size-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-3">
              <Sparkles className="size-6" />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">
              {isVie ? 'Chào mừng đến phòng trao đổi tác phẩm!' : 'Welcome to the Trade Room!'}
            </h4>
            <p className="text-xs text-gray-400 max-w-md">
              {isVie
                ? 'Hãy bắt đầu trò chuyện, trao đổi ý tưởng vẽ và cập nhật tiến độ nộp tranh cùng đối tác của bạn tại đây.'
                : 'Start chatting, exchanging artistic references, and keeping each other updated on artwork progress right here.'}
            </p>
          </div>
        )}

        {/* Message items */}
        {messages.map((msg) => {
          const isMe = userId && msg.senderId.toLowerCase() === userId.toLowerCase();
          const isTranslating = translatingIds.includes(msg.messageId);

          return (
            <div
              key={msg.messageId}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              {/* Sender & timestamp header */}
              <div className="mb-1 flex items-center gap-2 text-[10px] text-gray-400 px-1">
                <span className="font-semibold text-gray-300">
                  {isMe ? (isVie ? 'Bạn' : 'You') : msg.senderFullName || partnerName}
                </span>
                <span>
                  {new Date(msg.sentAt).toLocaleTimeString(isVie ? 'vi-VN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {isMe && (
                  <span title={msg.isRead ? (isVie ? 'Đã xem' : 'Read') : (isVie ? 'Đã gửi' : 'Sent')}>
                    <CheckCheck
                      className={`size-3.5 ${msg.isRead ? 'text-indigo-400' : 'text-gray-500'}`}
                    />
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative max-w-[85%] md:max-w-[75%] p-3.5 text-xs leading-relaxed shadow-lg ${
                  isMe
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-2xl rounded-tr-none'
                    : 'border border-white/10 bg-white/[0.05] text-gray-100 rounded-2xl rounded-tl-none'
                }`}
              >
                {/* Body Text */}
                {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}

                {/* Translated Body */}
                {msg.translatedBody && msg.translatedBody.trim() !== msg.body.trim() && (
                  <div
                    className={`mt-2.5 pt-2 border-t text-[11px] leading-relaxed ${
                      isMe ? 'border-white/20 text-indigo-100' : 'border-white/10 text-purple-200'
                    }`}
                  >
                    <p className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider mb-1">
                      <Globe className="size-3 text-indigo-300" />
                      {isVie ? 'Bản dịch AI' : 'AI Translation'}
                    </p>
                    <p className="italic">{msg.translatedBody}</p>
                  </div>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {msg.attachments.map((att) => {
                      const ext = att.fileName ? att.fileName.split('.').pop()?.toLowerCase() : '';
                      const isImg =
                        (att.mimeType && att.mimeType.startsWith('image/')) ||
                        ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
                      const fullUrl = resolveAttachmentUrl(att.fileUrl);

                      return (
                        <div
                          key={att.messageAttachmentId}
                          className="overflow-hidden rounded-xl border border-white/10 bg-black/40"
                        >
                          {isImg ? (
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/img relative block overflow-hidden"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={fullUrl}
                                alt={att.fileName || 'Attachment'}
                                className="max-h-60 w-full object-contain rounded-xl transition duration-200 group-hover/img:scale-[1.02]"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition duration-200 text-white text-xs font-semibold gap-1.5">
                                <Eye className="size-4" /> {isVie ? 'Xem ảnh gốc' : 'View Full Image'}
                              </div>
                            </a>
                          ) : (
                            <div className="flex items-center justify-between p-2.5 text-[11px]">
                              <span className="truncate text-gray-200 font-medium">
                                {att.fileName || (isVie ? 'Tệp đính kèm' : 'Attachment')}
                              </span>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 py-1 font-semibold text-indigo-300 hover:bg-indigo-500 hover:text-white transition"
                              >
                                <Download className="size-3" /> {isVie ? 'Tải về' : 'Download'}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Translate button for partner messages */}
              {!isMe && (
                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 px-1">
                  {isTranslating ? (
                    <span className="inline-flex items-center gap-1 text-purple-400">
                      <RefreshCw className="size-2.5 animate-spin" />
                      {isVie ? 'Đang dịch…' : 'Translating…'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleTranslateOne(msg.messageId, !!msg.translatedBody)}
                      className="inline-flex items-center gap-1 text-gray-400 hover:text-purple-300 transition cursor-pointer"
                    >
                      <Globe className="size-2.5" />
                      {msg.translatedBody
                        ? isVie
                          ? 'Dịch lại'
                          : 'Translate again'
                        : isVie
                        ? 'Dịch tin nhắn'
                        : 'Translate'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-8 z-10 flex size-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition cursor-pointer"
          title={isVie ? 'Cuộn xuống tin mới nhất' : 'Scroll to latest messages'}
        >
          <ChevronDown className="size-5" />
        </button>
      )}

      {/* 4. CHAT INPUT BAR */}
      <div className="border-t border-white/10 bg-white/[0.02] p-4">
        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-2.5">
            {selectedFilePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedFilePreview}
                alt="Upload preview"
                className="size-12 rounded-xl object-cover border border-white/20"
              />
            ) : (
              <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                <Paperclip className="size-6" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-semibold text-white truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-gray-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearSelectedFile}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.zip,.psd,.clip"
            onChange={handleFileChange}
            disabled={isChatDisabled}
            className="hidden"
          />

          {/* Attach file button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isChatDisabled}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
            title={isVie ? 'Đính kèm tệp/ảnh' : 'Attach file/image'}
          >
            <Paperclip className="size-4" />
          </button>

          {/* Input text */}
          <input
            type="text"
            value={inputBody}
            onChange={(e) => {
              setInputBody(e.target.value);
              chat.notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                void handleSendMessage();
              }
            }}
            disabled={isChatDisabled}
            placeholder={
              isChatDisabled
                ? isVie
                  ? 'Phòng chat đã kết thúc…'
                  : 'Chat room is closed…'
                : isVie
                ? 'Nhập tin nhắn trao đổi tranh… (Enter để gửi)'
                : 'Type a message… (Enter to send)'
            }
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={(!inputBody.trim() && !selectedFile) || sending || uploading || isChatDisabled}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-900/40 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title={isVie ? 'Gửi tin nhắn' : 'Send message'}
          >
            {sending || uploading ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
