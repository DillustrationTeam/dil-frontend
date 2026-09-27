'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowUpRight, Bot, CircleAlert, Eye, EyeOff, Maximize2, Moon, RefreshCw, Send, Sparkles, Sun, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { AiMarkdown } from '@/features/ai-assistant/components/ai-markdown';
import { aiService } from '@/features/ai-assistant/services/ai.service';
import type { AiConversationDto, AiMessageDto } from '@/features/ai-assistant/types/ai.types';

const quickQuestions = [
  'Quy chế ký quỹ thanh toán hoạt động thế nào?',
  'Làm sao để mở phiên đấu giá tranh?',
  'Phí nền tảng là bao nhiêu phần trăm?',
  'Cách rút doanh thu về ngân hàng?',
];

/**
 * Nút nổi góc phải dưới: thanh công cụ gồm Ngôn ngữ (VIE/ENG), Chế độ Sáng/Tối, Trợ lý AI
 * và công tắc Ẩn/Hiện thanh công cụ. Hiện diện ở mọi màn hình.
 */
export function AiFloatingWidget({ userId }: { userId: string | null }) {
  const pathname = usePathname() ?? '';
  const { lang, toggleLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<AiConversationDto | null>(null);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [collapsed, setCollapsed] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const savedTheme = localStorage.getItem('app-theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('light', savedTheme === 'light');
      }

      const savedCollapsed = localStorage.getItem('app-floating-collapsed');
      if (savedCollapsed === 'true') {
        setCollapsed(true);
      }
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    toast.success(nextTheme === 'light' ? 'Đã bật Chế độ Sáng' : 'Đã bật Chế độ Tối');
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('app-floating-collapsed', String(next));
    if (next) setOpen(false);
  };

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

  async function handleSend(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || sending || !userId) return;

    setSending(true);
    setError(null);
    try {
      let current = conversation;
      if (!current) {
        current = await aiService.create(text.slice(0, 40), 'General');
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
          className="fixed bottom-6 right-20 sm:right-24 z-50 flex h-[30rem] w-[24rem] max-w-[calc(100vw-6rem)] flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#1F2335] shadow-2xl"
        >
          {/* Đầu cửa sổ */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand-periwinkle/15 text-brand-periwinkle">
                <Bot size={16} aria-hidden />
              </span>
              <div>
                <p className="font-h1 text-xs font-bold text-on-surface">Trợ lý AI Dillustration</p>
                <p className="text-[10px] text-outline">
                  {userId ? 'Sẵn sàng giải đáp' : 'Cần đăng nhập'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/ai"
                onClick={() => setOpen(false)}
                title="Mở trang trợ lý đầy đủ"
                className="rounded-full p-1.5 text-outline transition hover:bg-white/10 hover:text-brand-periwinkle"
              >
                <Maximize2 size={14} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={loadConversation}
                disabled={loading}
                title="Tải lại hội thoại"
                className="rounded-full p-1.5 text-outline transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Đóng"
                className="rounded-full p-1.5 text-outline transition hover:bg-white/10 hover:text-white"
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
                <Bot size={26} className="mb-2 text-outline" aria-hidden />
                <p className="text-xs text-on-surface-variant">Vui lòng đăng nhập để trò chuyện với trợ lý.</p>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full bg-brand-periwinkle px-5 py-2 text-xs font-bold text-brand-navy"
                >
                  Đăng nhập
                </Link>
              </div>
            ) : loading && messages.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/[0.03]" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-outline">Bạn muốn hỏi gì trước?</p>
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleSend(question)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-2.5 text-left text-[11px] text-on-surface-variant transition hover:border-brand-periwinkle/30 hover:text-brand-periwinkle"
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
                          ? 'rounded-tr-none bg-brand-periwinkle text-brand-navy'
                          : 'rounded-tl-none border border-white/10 bg-white/5 text-on-surface'
                      }`}
                    >
                      {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <AiMarkdown content={message.content} />}
                    </div>
                  </div>
                );
              })
            )}
            {sending && (
              <p className="flex items-center gap-1.5 text-[11px] text-brand-periwinkle">
                <RefreshCw size={11} className="animate-spin" aria-hidden /> Trợ lý đang trả lời...
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chân: nhập câu hỏi + lối vào trang đầy đủ */}
          <div className="border-t border-white/10 p-3">
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
                placeholder={userId ? 'Nhập câu hỏi...' : 'Cần đăng nhập'}
                className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-brand-navy/80 px-3 py-2 text-[11px] text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || !userId}
                title="Gửi câu hỏi"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-periwinkle text-brand-navy transition hover:brightness-110 disabled:opacity-50"
              >
                <Send size={13} aria-hidden />
              </button>
            </form>

            <Link
              href="/ai"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-brand-periwinkle hover:underline"
            >
              Mở trang trợ lý đầy đủ <ArrowUpRight size={12} aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {/* Thanh công cụ nổi: Chuyển Ngôn ngữ (VIE/ENG) + Chế độ Sáng/Tối + Trợ lý AI + Nút Ẩn/Hiện */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-center gap-2 sm:right-6">
        {collapsed ? (
          /* Nút mở lại khi đang ẩn */
          <button
            type="button"
            onClick={toggleCollapse}
            title={lang === 'VIE' ? 'Hiện thanh công cụ' : 'Show toolbar'}
            className="group relative flex size-10 items-center justify-center rounded-full border border-white/20 bg-[#1F2335] text-white shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:border-[#A7ACD9] active:scale-95"
          >
            <Eye size={18} className="text-[#A7ACD9]" />
            <span className="absolute right-12 whitespace-nowrap rounded-lg bg-[#1F2335] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-white/10 pointer-events-none">
              {lang === 'VIE' ? 'Hiện thanh công cụ' : 'Show toolbar'}
            </span>
          </button>
        ) : (
          <>
            {/* Nút 1: Chuyển ngôn ngữ (VIE / ENG) */}
            <button
              type="button"
              onClick={toggleLang}
              title={lang === 'VIE' ? 'Chuyển sang English' : 'Chuyển sang Tiếng Việt'}
              className="group relative flex size-11 items-center justify-center rounded-full border border-white/20 bg-[#1F2335] text-[11px] font-bold text-white shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:border-[#A7ACD9] active:scale-95"
            >
              <span>{lang === 'VIE' ? 'VIE' : 'ENG'}</span>
              <span className="absolute right-12 whitespace-nowrap rounded-lg bg-[#1F2335] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-white/10 pointer-events-none">
                {lang === 'VIE' ? 'Ngôn ngữ: Tiếng Việt' : 'Language: English'}
              </span>
            </button>

            {/* Nút 2: Chế độ Sáng / Tối */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
              className="group relative flex size-11 items-center justify-center rounded-full border border-white/20 bg-[#1F2335] text-white shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:border-[#A7ACD9] active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-300 transition-transform group-hover:rotate-[#45deg]" />
              ) : (
                <Moon size={18} className="text-indigo-400 transition-transform group-hover:-rotate-12" />
              )}
              <span className="absolute right-12 whitespace-nowrap rounded-lg bg-[#1F2335] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-white/10 pointer-events-none">
                {theme === 'dark' ? 'Chế độ Sáng (Light)' : 'Chế độ Tối (Dark)'}
              </span>
            </button>

            {/* Nút 3: Trợ lý AI */}
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
              className="relative flex size-14 items-center justify-center rounded-full bg-brand-periwinkle text-brand-navy shadow-[0_8px_30px_rgba(167,172,217,0.45)] transition hover:brightness-110 active:scale-95"
            >
              {open ? <X size={22} aria-hidden /> : <Sparkles size={22} aria-hidden />}
              {!open && (
                <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-[#1F2335] bg-emerald-400" />
              )}
            </button>

            {/* Nút Ẩn công cụ */}
            <button
              type="button"
              onClick={toggleCollapse}
              title={lang === 'VIE' ? 'Ẩn thanh công cụ' : 'Hide toolbar'}
              className="group relative flex size-7 items-center justify-center rounded-full border border-white/10 bg-[#1F2335]/70 text-slate-400 shadow transition hover:bg-[#1F2335] hover:text-white"
            >
              <EyeOff size={13} />
            </button>
          </>
        )}
      </div>
    </>
  );
}
