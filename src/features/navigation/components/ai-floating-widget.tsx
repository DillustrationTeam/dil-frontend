'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { ArrowUpRight, Bot, CircleAlert, Maximize2, RefreshCw, Send, Sparkles, X } from 'lucide-react';
import { AiMarkdown } from '@/features/ai-assistant/components/ai-markdown';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import type { AiConversationDto, AiMessageDto } from '@/features/ai-assistant/types/ai.types';

const quickQuestionsByLang = {
  VIE: [
    'Mức phạt giao tranh vật lý tính thế nào?',
    'Vì sao tôi không đặt giá được?',
    'Giá mua ngay khác gì đặt giá thường?',
    'Sau khi thắng phiên, tôi có 48 giờ để làm gì?',
  ],
  ENG: [
    'How is the physical-delivery penalty calculated?',
    'Why can I not place a bid?',
    'How is Buy Now different from a normal bid?',
    'What must I do in the 48 hours after winning?',
  ],
};

/**
 * Nút nổi góc phải dưới: mở cửa sổ chat với trợ lý AI ngay tại trang đang xem,
 * kèm lối vào trang đầy đủ /ai.
 *
 * Không hiển thị khi đang ở chính trang /ai (sẽ trùng lặp).
 */
export function AiFloatingWidget({ userId }: { userId: string | null }) {
  const pathname = usePathname() ?? '';
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const quickQuestions = quickQuestionsByLang[lang];
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<AiConversationDto | null>(null);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const page = await aiService.conversations();
      const latest = page.items[0] ?? null;
      setConversation(latest);
      if (latest) {
        const history = await aiService.messages(latest.aiConversationId);
        // Backend trả mới nhất trước → đảo lại, chỉ giữ 12 tin gần nhất cho gọn.
        setMessages([...history.items].reverse().slice(-12));
      } else {
        setMessages([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được trợ lý AI.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Nạp lần đầu để nút có sẵn nội dung khi người dùng mở.
  useEffect(() => {
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      if (userId) await loadConversation();
    })();
  }, [userId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Đóng bằng Escape; đóng khi bấm ra ngoài panel.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  // Trang chi tiết phiên đấu giá: gắn ngữ cảnh Auction để AI trả lời bằng dữ liệu thật
  // của chính phiên đang xem (giá, hạn 48h, trạng thái bưu phẩm, tiền đang giữ).
  // Trang khác thì hỏi đáp chung.
  const auctionContextId = (() => {
    const match = /^\/auctions\/([0-9a-fA-F-]{36})(?:\/|$)/.exec(pathname);
    return match ? match[1] : null;
  })();

  async function handleSend(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || sending || !userId) return;

    setSending(true);
    setError(null);
    try {
      let current = conversation;
      if (!current) {
        current = auctionContextId
          ? await aiService.create(text.slice(0, 40), 'Auction', auctionContextId)
          : await aiService.create(text.slice(0, 40), 'General');
        setConversation(current);
      }
      setInput('');
      const result = await aiService.send(current.aiConversationId, text);
      setMessages((prev) => [...prev, result.userMessage, result.assistantMessage].slice(-12));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Trợ lý AI chưa phản hồi được. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

  // Trang /ai đã có sẵn giao diện đầy đủ — không hiện nút nổi ở đó.
  if (pathname === '/ai' || pathname.startsWith('/ai/')) return null;

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Cửa sổ trợ lý AI"
          className="fixed bottom-6 right-[68px] z-50 flex h-[30rem] w-[24rem] max-w-[calc(100vw-5rem)] flex-col overflow-hidden rounded-2xl border border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ivory)] shadow-2xl sm:right-[76px]"
        >
          {/* Đầu cửa sổ */}
          <div className="flex items-center justify-between border-b border-[var(--hair)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--ink-3)] text-[var(--lumen)]">
                <Bot size={16} aria-hidden />
              </span>
              <div>
                <p className="font-[family-name:var(--font-display)] text-sm font-medium text-[var(--ivory)]">{isEng ? 'Dillustration AI Assistant' : 'Trợ lý AI Dillustration'}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--lumen)]">
                  {userId ? (isEng ? 'Ready to help' : 'Sẵn sàng giải đáp') : (isEng ? 'Sign in required' : 'Cần đăng nhập')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/ai"
                onClick={() => setOpen(false)}
                title="Mở trang trợ lý đầy đủ"
                className="rounded-full p-1.5 text-[var(--ash)] transition hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
              >
                <Maximize2 size={14} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={loadConversation}
                disabled={loading}
                title="Tải lại hội thoại"
                className="rounded-full p-1.5 text-[var(--ash)] transition hover:bg-[var(--ink-3)] hover:text-[var(--lumen)] disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Đóng"
                className="rounded-full p-1.5 text-[var(--ash)] transition hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 border-b border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] text-red-200">
              <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {/* Thân: lịch sử tin nhắn hoặc gợi ý */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {!userId ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot size={26} className="mb-2 text-[var(--ash)]" aria-hidden />
                <p className="text-xs text-[var(--ash)]">{isEng ? 'Please sign in to chat with the AI assistant.' : 'Vui lòng đăng nhập để trò chuyện với trợ lý.'}</p>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full bg-[var(--lumen)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--lumen-hi)]"
                >
                  {isEng ? 'Sign In' : 'Đăng nhập'}
                </Link>
              </div>
            ) : loading && messages.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--ink-3)]" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-[var(--ash)]">{isEng ? 'What would you like to ask first?' : 'Bạn muốn hỏi gì trước?'}</p>
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleSend(question)}
                    className="w-full rounded-xl border border-[var(--hair)] px-3 py-2 text-left text-xs font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--ink-3)] hover:text-[var(--lumen)]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div key={message.aiMessageId} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                        isUser
                          ? 'rounded-tr-none bg-[var(--lumen)] text-white'
                          : 'rounded-tl-none border border-[var(--hair)] bg-[var(--ink-3)] text-[var(--ivory)]'
                      }`}
                    >
                      {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <AiMarkdown content={message.content} />}
                    </div>
                  </div>
                );
              })
            )}
            {sending && (
              <p className="flex items-center gap-1.5 text-[11px] text-[var(--lumen)]">
                <RefreshCw size={11} className="animate-spin" aria-hidden /> {isEng ? 'Assistant is replying...' : 'Trợ lý đang trả lời...'}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chân: nhập câu hỏi + lối vào trang đầy đủ */}
          <div className="border-t border-[var(--hair)] p-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                disabled={!userId}
                onChange={(event) => setInput(event.target.value)}
                placeholder={userId ? (isEng ? 'Ask a question...' : 'Nhập câu hỏi...') : (isEng ? 'Sign in required' : 'Cần đăng nhập')}
                className="min-w-0 flex-1 rounded-xl border border-[var(--hair-2)] bg-[var(--ink)] px-3 py-2 text-xs text-[var(--ivory)] placeholder:text-[var(--ash)] focus:border-[var(--lumen)] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || !userId}
                title="Gửi câu hỏi"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--lumen)] text-white transition hover:bg-[var(--lumen-hi)] disabled:opacity-50"
              >
                <Send size={13} aria-hidden />
              </button>
            </form>

            <Link
              href="/ai"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-[var(--lumen)] hover:underline"
            >
              {isEng ? 'Open full assistant page' : 'Mở trang trợ lý đầy đủ'} <ArrowUpRight size={12} aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {/* Nút nổi */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? (isEng ? 'Close AI assistant' : 'Đóng trợ lý AI') : (isEng ? 'Open AI assistant' : 'Mở trợ lý AI')}
        className="fixed bottom-6 right-5 z-40 flex size-10 cursor-pointer items-center justify-center rounded-full border border-[var(--hair-2)] bg-[var(--ink-2)] text-[var(--ivory)] shadow-md backdrop-blur-xl transition-all hover:scale-105 hover:border-[var(--lumen)] hover:bg-[var(--ink-3)] active:scale-95 sm:right-7"
      >
        {open ? <X size={16} aria-hidden /> : <Sparkles size={16} aria-hidden />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400" />
        )}
      </button>
    </>
  );
}
