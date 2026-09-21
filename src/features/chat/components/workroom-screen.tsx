'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCheck, CircleAlert, Download, FileText, Globe, Image as ImageIcon, Lock, Paperclip, RefreshCw, Send, ShieldCheck, User } from 'lucide-react';
import { chatService } from '../services/chat.service';
import type { ChatMessageDto, ChatRoomDto } from '../types/chat.types';
import { PageLoader } from '@/features/navigation';

export function WorkroomScreen({ roomId, userId }: { roomId: string; userId: string | null }) {
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputBody, setInputBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [r, m] = await Promise.all([
        chatService.getRoom(roomId),
        chatService.getMessages(roomId),
      ]);
      setRoom(r);
      // Backend trả về mới nhất trước -> đảo lại để render từ cũ đến mới
      setMessages([...m.items].reverse());
      await chatService.markRead(roomId).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được phòng làm việc.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendFile(file: File) {
    if (!userId || !room) return;
    setUploading(true);
    setError(null);
    try {
      await chatService.uploadAttachment(roomId, file);
      const m = await chatService.getMessages(roomId);
      setMessages([...m.items].reverse());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tải tệp đính kèm thất bại.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputBody.trim() || sending || !userId) return;
    setSending(true);
    setError(null);
    try {
      // Dùng uploadAttachment dạng text hoặc gọi signalr/REST
      const blob = new Blob([inputBody], { type: 'text/plain' });
      const file = new File([blob], 'tin-nhan.txt', { type: 'text/plain' });
      await chatService.uploadAttachment(roomId, file);
      setInputBody('');
      const m = await chatService.getMessages(roomId);
      setMessages([...m.items].reverse());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  }

  async function handleTranslate(messageId: string) {
    try {
      await chatService.translateMessage(messageId, 'vi');
      const m = await chatService.getMessages(roomId);
      setMessages([...m.items].reverse());
    } catch {
      // Ignored
    }
  }

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
    /* w-full là BẮT BUỘC: body là flex-col nên con có margin auto sẽ không được
       stretch ngang; thiếu w-full thì khung co theo nội dung. */
    <div className="mx-auto flex h-[calc(100vh-5rem)] w-full max-w-5xl flex-col px-4 py-4 text-on-surface">
      {/* Thanh tiêu đề phòng */}
      <div className="glass-container mb-4 flex items-center justify-between rounded-3xl border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="rounded-full border border-white/10 p-2 text-outline hover:text-white" title="Quay lại">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-h1 text-base font-bold">{room.chatRoomTitle || 'Phòng trao đổi dự án'}</h1>
              {room.isLocked && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <Lock size={10} /> Đã khóa
                </span>
              )}
            </div>
            <p className="text-xs text-outline">
              Thành viên: {room.members.map((m) => m.fullName || 'Người dùng').join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-outline">
          <ShieldCheck size={16} className="text-brand-periwinkle" />
          <span className="hidden sm:inline">Tin nhắn bảo mật theo hợp đồng</span>
          <button
            type="button"
            onClick={loadData}
            className="rounded-full border border-white/10 p-2 text-outline hover:text-white"
            title="Tải lại tin nhắn"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          <CircleAlert size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vùng hiển thị tin nhắn cuộn */}
      <div className="glass-container flex-1 overflow-y-auto rounded-3xl border border-white/10 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-outline">
            <p>Chưa có tin nhắn nào trong phòng làm việc này.</p>
            <p className="mt-1">Hãy bắt đầu trao đổi về ý tưởng tranh, yêu cầu phác thảo và tiến độ hoàn thành.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = userId && msg.senderId === userId;
            return (
              <div
                key={msg.messageId}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="mb-1 flex items-center gap-2 text-[11px] text-outline">
                  <span className="font-medium text-on-surface-variant">
                    {isMe ? 'Bạn' : msg.senderFullName || 'Đối tác'}
                  </span>
                  <span>{new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-brand-periwinkle text-brand-navy rounded-tr-none'
                      : 'border border-white/10 bg-white/5 text-on-surface rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>

                  {/* Bản dịch tự động nếu có */}
                  {msg.translatedBody && (
                    <div className="mt-2 border-t border-black/10 pt-2 text-[11px] italic opacity-90">
                      <p className="flex items-center gap-1 font-semibold not-italic">
                        <Globe size={11} /> Bản dịch tiếng Việt:
                      </p>
                      <p>{msg.translatedBody}</p>
                    </div>
                  )}

                  {/* Tệp đính kèm */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.attachments.map((att) => {
                        const isImg = att.mimeType.startsWith('image/');
                        return (
                          <div key={att.messageAttachmentId} className="overflow-hidden rounded-xl border border-black/10 bg-black/20">
                            {isImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={att.fileUrl} alt={att.fileName || 'Ảnh'} className="max-h-60 w-full object-contain" />
                            ) : (
                              <div className="flex items-center justify-between p-2.5 text-[11px]">
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

                {/* Nút dịch đối tác */}
                {!isMe && !msg.translatedBody && (
                  <button
                    type="button"
                    onClick={() => handleTranslate(msg.messageId)}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-outline hover:text-white"
                  >
                    <Globe size={10} /> Dịch sang tiếng Việt
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Khung soạn thảo tin nhắn */}
      <div className="mt-3">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleSendFile(file);
          }}
        />

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            disabled={uploading || room.isLocked}
            onClick={() => fileInputRef.current?.click()}
            className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-outline transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Đính kèm ảnh hoặc tài liệu phác thảo"
          >
            <Paperclip size={18} className={uploading ? 'animate-spin' : ''} />
          </button>

          <input
            type="text"
            disabled={room.isLocked}
            value={inputBody}
            onChange={(e) => setInputBody(e.target.value)}
            placeholder={room.isLocked ? 'Phòng làm việc đã đóng.' : 'Nhập tin nhắn trao đổi...'}
            className="flex-1 rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-3 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputBody.trim() || sending || room.isLocked}
            className="flex size-11 items-center justify-center rounded-2xl bg-brand-periwinkle text-brand-navy shadow-md transition hover:brightness-110 disabled:opacity-50"
            title="Gửi tin nhắn"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
