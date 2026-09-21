'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Bot, Check, CheckCircle2, CircleAlert, Clock, MessageSquare, Plus, RefreshCw, Send, ShieldAlert, Sparkles, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { AiMarkdown } from './ai-markdown';
import { aiService } from '../services/ai.service';
import type { AiConversationDto, AiMessageDto, DeadlineRiskDto } from '../types/ai.types';
import { InlineLoader, PageLoader } from '@/features/navigation';

const quickPrompts = [
  'Quy chế ký quỹ thanh toán hoạt động như thế nào?',
  'Làm sao để đăng ký mở phiên đấu giá tranh nghệ thuật?',
  'Chính sách bảo hộ tác quyền đối với tác phẩm kỹ thuật số?',
  'Cách thức rút tiền doanh thu về tài khoản ngân hàng?',
];

export function AiChatScreen({ userId }: { userId: string | null }) {
  const [conversations, setConversations] = useState<AiConversationDto[]>([]);
  const [currentConvo, setCurrentConvo] = useState<AiConversationDto | null>(null);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Tab: 'chat' | 'risk'
  const [activeTab, setActiveTab] = useState<'chat' | 'risk'>('chat');

  // Công cụ phân tích rủi ro hạn chót
  const [commissionIdInput, setCommissionIdInput] = useState('');
  const [riskData, setRiskData] = useState<DeadlineRiskDto | null>(null);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    if (!userId) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await aiService.conversations();
      setConversations(res.items);
      if (res.items.length > 0 && !currentConvo) {
        selectConversation(res.items[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách hội thoại.');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, [userId]);

  async function selectConversation(convo: AiConversationDto) {
    setCurrentConvo(convo);
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await aiService.messages(convo.aiConversationId);
      // Hiển thị từ cũ đến mới
      setMessages([...res.items].reverse());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được nội dung hội thoại.');
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleCreateNewConvo() {
    if (!userId) return;
    setError(null);
    try {
      const newConvo = await aiService.create('Tư vấn nền tảng nghệ thuật', 'General');
      setConversations([newConvo, ...conversations]);
      selectConversation(newConvo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tạo cuộc hội thoại mới.');
    }
  }

  async function handleSendMessage(promptText?: string) {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || sending || !userId) return;

    let convoId = currentConvo?.aiConversationId;
    setSending(true);
    setError(null);

    try {
      if (!convoId) {
        const newConvo = await aiService.create(textToSend.slice(0, 30), 'General');
        setConversations([newConvo, ...conversations]);
        setCurrentConvo(newConvo);
        convoId = newConvo.aiConversationId;
      }

      setInputPrompt('');
      const res = await aiService.send(convoId, textToSend.trim());
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Trợ lý AI chưa thể phản hồi. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

  async function handleFeedback(messageId: string, helpful: boolean) {
    try {
      await aiService.feedback(messageId, helpful);
      setMessages((prev) =>
        prev.map((m) => (m.aiMessageId === messageId ? { ...m, helpful } : m))
      );
    } catch {
      // Ignored
    }
  }

  async function handleAnalyzeRisk(e: React.FormEvent) {
    e.preventDefault();
    if (!commissionIdInput.trim()) return;
    setAnalyzingRisk(true);
    setRiskData(null);
    setError(null);
    try {
      const res = await aiService.predict(commissionIdInput.trim());
      setRiskData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể phân tích rủi ro cho đơn hàng này.');
    } finally {
      setAnalyzingRisk(false);
    }
  }

  return (
    /* w-full là BẮT BUỘC: body là flex-col, mà phần tử con có margin auto thì
       không còn được stretch theo chiều ngang nữa — thiếu w-full thì khung sẽ
       co lại theo nội dung (hội thoại rỗng ⇒ khung chat hẹp hơn hẳn). */
    <div className="mx-auto flex h-[calc(100vh-5rem)] w-full max-w-6xl gap-4 px-4 py-4 text-on-surface">
      {/* Cột danh sách hội thoại bên trái */}
      <aside className="glass-container hidden w-72 flex-col rounded-3xl border border-white/10 p-4 md:flex">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-h1 text-sm font-bold flex items-center gap-1.5">
            <Sparkles size={16} className="text-brand-periwinkle" /> Lịch sử trợ lý
          </h2>
          <button
            type="button"
            onClick={handleCreateNewConvo}
            className="rounded-full bg-brand-periwinkle/15 p-1.5 text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy"
            title="Cuộc trò chuyện mới"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
          {conversations.length === 0 ? (
            <p className="p-4 text-center text-outline">Chưa có cuộc trò chuyện nào.</p>
          ) : (
            conversations.map((c) => {
              const isSelected = currentConvo?.aiConversationId === c.aiConversationId;
              return (
                <button
                  key={c.aiConversationId}
                  type="button"
                  onClick={() => selectConversation(c)}
                  className={`w-full text-left rounded-2xl p-3 transition ${
                    isSelected
                      ? 'border border-brand-periwinkle/40 bg-brand-periwinkle/15 text-brand-periwinkle font-semibold'
                      : 'border border-white/5 bg-white/[0.02] text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                  }`}
                >
                  <p className="line-clamp-1">{c.topic || 'Tư vấn nghệ thuật'}</p>
                  <span className="mt-1 block text-[10px] text-outline">
                    {c.messageCount} tin nhắn · {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-3 border-t border-white/10 pt-3 text-[11px] text-outline">
          <Link href="/wallet" className="flex items-center gap-1 text-brand-periwinkle hover:underline">
            <ArrowLeft size={13} /> Quay lại ví cá nhân
          </Link>
        </div>
      </aside>

      {/* Vùng tương tác chính */}
      <main className="glass-container flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 p-5">
        {/* Thanh công cụ tab */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-brand-periwinkle text-brand-navy'
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
              }`}
            >
              Hỏi đáp & Trợ lý thông minh
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('risk')}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                activeTab === 'risk'
                  ? 'bg-brand-periwinkle text-brand-navy'
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
              }`}
            >
              Dự báo rủi ro thời hạn đơn vẽ
            </button>
          </div>

          <span className="flex items-center gap-1 text-xs text-outline">
            <Bot size={14} className="text-brand-periwinkle" />
          </span>
        </div>

        {error && (
          <div role="alert" className="mb-3 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
            <CircleAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Nội dung Tab Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Vùng tin nhắn */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingMessages && messages.length === 0 ? (
                <PageLoader label="Đang tải nội dung hội thoại…" />
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-periwinkle/10 text-brand-periwinkle">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="font-h1 text-base font-bold">Trợ lý nghệ thuật Dillustration</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-on-surface-variant">
                    Giải đáp mọi thắc mắc về quy trình ký quỹ, mở phiên đấu giá tranh, thỏa thuận hợp đồng và bản quyền tác phẩm.
                  </p>

                  {/* Gợi ý câu hỏi nhanh */}
                  <div className="mt-6 grid max-w-md gap-2 sm:grid-cols-2">
                    {quickPrompts.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs text-on-surface-variant transition hover:border-brand-periwinkle/30 hover:bg-brand-periwinkle/5 hover:text-brand-periwinkle"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.aiMessageId}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-periwinkle/10 text-brand-periwinkle">
                          <Bot size={16} />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-brand-periwinkle text-brand-navy rounded-tr-none'
                            : 'border border-white/10 bg-white/5 text-on-surface rounded-tl-none'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <AiMarkdown content={m.content} />
                        )}

                        {!isUser && (
                          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-outline">
                            <span>Phản hồi hữu ích?</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleFeedback(m.aiMessageId, true)}
                                className={`rounded p-1 hover:text-white ${m.helpful === true ? 'text-emerald-400 font-bold' : ''}`}
                                title="Hữu ích"
                              >
                                <ThumbsUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(m.aiMessageId, false)}
                                className={`rounded p-1 hover:text-white ${m.helpful === false ? 'text-red-400 font-bold' : ''}`}
                                title="Chưa hữu ích"
                              >
                                <ThumbsDown size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-on-surface">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {sending && (
                <InlineLoader label="Trợ lý đang suy nghĩ và phản hồi…" className="text-xs text-brand-periwinkle" />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Khung nhập câu hỏi */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Đặt câu hỏi cho trợ lý nghệ thuật..."
                className="flex-1 rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-3 text-xs text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || sending}
                className="flex size-11 items-center justify-center rounded-2xl bg-brand-periwinkle text-brand-navy shadow-md transition hover:brightness-110 disabled:opacity-50"
                title="Gửi câu hỏi"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Nội dung Tab Rủi ro hạn chót (Deadline Risk) */}
        {activeTab === 'risk' && (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-on-surface-variant">
              <p className="font-semibold text-brand-periwinkle">Tính năng giám sát tiến độ thông minh (UC50):</p>
              <p className="mt-1">
                Hệ thống áp dụng AI phân tích nhịp độ trao đổi, số lần chỉnh sửa bản thảo và khoảng thời gian còn lại để đưa ra cảnh báo sớm nếu đơn hàng có nguy cơ trễ hạn.
              </p>
            </div>

            <form onSubmit={handleAnalyzeRisk} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                required
                value={commissionIdInput}
                onChange={(e) => setCommissionIdInput(e.target.value)}
                placeholder="Nhập mã đơn đặt vẽ (Commission ID)"
                className="flex-1 min-w-[240px] rounded-xl border border-white/15 bg-brand-navy/80 px-4 py-2.5 font-mono text-xs text-on-surface focus:border-brand-periwinkle focus:outline-none"
              />
              <button
                type="submit"
                disabled={analyzingRisk}
                className="rounded-full bg-brand-periwinkle px-5 py-2.5 font-h1 text-xs font-bold text-brand-navy shadow hover:brightness-110 disabled:opacity-50"
              >
                {analyzingRisk ? 'Đang phân tích...' : 'Kiểm tra rủi ro'}
              </button>
            </form>

            {riskData && (
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-h1 text-base font-bold">Kết quả đánh giá tiến độ</h3>
                  <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${
                    riskData.riskLevel === 'critical'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : riskData.riskLevel === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    Mức rủi ro: {riskData.riskLevel === 'critical' ? 'Nghiêm trọng' : riskData.riskLevel === 'high' ? 'Cao' : riskData.riskLevel === 'medium' ? 'Trung bình' : 'An toàn'}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs">
                    <span className="text-outline">Điểm số rủi ro trễ hẹn</span>
                    <p className="mt-1 font-h1 text-2xl font-bold text-brand-periwinkle">
                      {Math.round(riskData.riskScore * 100)} / 100
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs">
                    <span className="text-outline">Thời hạn cam kết</span>
                    <p className="mt-1 font-semibold text-on-surface">
                      {riskData.deadline ? new Date(riskData.deadline).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs">
                    <span className="text-outline">Giai đoạn hiện tại</span>
                    <p className="mt-1 font-semibold text-on-surface">
                      Cột mốc #{riskData.currentStage}
                    </p>
                  </div>
                </div>

                {/* Danh sách nhắc nhở */}
                {riskData.reminders && riskData.reminders.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <h4 className="mb-2 text-xs font-bold text-on-surface-variant">Lịch nhắc nhở tự động</h4>
                    <div className="space-y-2">
                      {riskData.reminders.map((r) => (
                        <div key={r.deadlineReminderId} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-brand-periwinkle" />
                            Nhắc vào: {new Date(r.remindAt).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-outline">Kênh: {r.channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
