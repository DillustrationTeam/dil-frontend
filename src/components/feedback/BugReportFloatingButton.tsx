'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bug, Check, Languages, Loader2, Send, X } from 'lucide-react';
import { useLanguage, type Language } from '@/context/language-context';
import { supportService } from '@/services/support.service';
import toast from 'react-hot-toast';

const LANGUAGE_OPTIONS: Array<{ code: Language; label: string; short: string }> = [
  { code: 'VIE', label: 'Tiếng Việt', short: 'VIE' },
  { code: 'ENG', label: 'English', short: 'ENG' },
];

export function BugReportFloatingButton() {
  const { lang, setLang } = useLanguage();
  const isEng = lang === 'ENG';

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('dillustration:open-support-modal', handleOpen);
    return () => window.removeEventListener('dillustration:open-support-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLangMenuOpen(false);
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isLangMenuOpen]);

  const handleSelectLanguage = (nextLang: Language) => {
    setIsLangMenuOpen(false);
    if (nextLang !== lang) {
      setLang(nextLang);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error(
        isEng
          ? 'Please enter both the issue title and detailed description.'
          : 'Vui lòng điền đầy đủ tiêu đề và nội dung.'
      );
      return;
    }

    setLoading(true);
    try {
      await supportService.createBugReport({
        title: title.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });

      toast.success(
        isEng
          ? 'Bug report submitted! Thank you for your feedback.'
          : 'Báo cáo lỗi đã được gửi! Cảm ơn bạn.'
      );
      setTitle('');
      setDescription('');
      setEmail('');
      setIsOpen(false);
    } catch {
      toast.error(
        isEng
          ? 'Unable to submit bug report right now. Please try again later.'
          : 'Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút chọn ngôn ngữ (VIE / ENG) đặt ngay phía trên nút Báo lỗi */}
      <div ref={langMenuRef} data-no-translate="true">
        {isLangMenuOpen && (
          <div
            role="menu"
            aria-label={isEng ? 'Select interface language' : 'Chọn ngôn ngữ hiển thị'}
            className="fixed bottom-40 right-[76px] z-50 w-44 overflow-hidden rounded-2xl border border-white/15 border-t-white/25 bg-[#161926]/95 p-1.5 text-[#E4E1E5] shadow-[0_14px_34px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:right-[84px]"
          >
            <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-[#919099]">
              {isEng ? 'Language' : 'Ngôn ngữ'}
            </p>
            <div className="space-y-1">
              {LANGUAGE_OPTIONS.map((option) => {
                const active = lang === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => handleSelectLanguage(option.code)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border border-[#A7ACD9]/35 bg-[#A7ACD9]/18 text-white'
                        : 'text-[#C7C5CF] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-[#A7ACD9]">
                        {option.short}
                      </span>
                      <span>{option.label}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-[#A7ACD9]" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsLangMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={isLangMenuOpen}
          aria-label={
            isEng
              ? `Language: English (${lang}). Click to switch language`
              : `Ngôn ngữ: Tiếng Việt (${lang}). Bấm để chọn ngôn ngữ`
          }
          title={isEng ? 'Switch language (VIE / ENG)' : 'Chọn ngôn ngữ (VIE / ENG)'}
          className="fixed bottom-40 right-5 z-40 flex size-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border border-white/15 border-t-white/25 bg-[#181b29]/90 text-[#A7ACD9] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:scale-105 hover:border-[#A7ACD9]/45 hover:bg-[#1F2335] hover:text-[#c2c7f6] active:scale-95 sm:right-7"
        >
          <Languages className="h-4 w-4" aria-hidden />
          <span className="text-[9px] font-extrabold leading-none tracking-wider text-white/90">
            {lang === 'VIE' ? 'VI' : 'EN'}
          </span>
        </button>
      </div>

      {/* Nút icon Báo lỗi tròn đồng bộ glass-container & periwinkle, căn giữa phía trên nút AI */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={isEng ? 'Report an issue or contact support' : 'Báo cáo sự cố hoặc gửi hỗ trợ'}
        title={isEng ? 'Report an issue or contact support' : 'Báo cáo sự cố hoặc gửi hỗ trợ'}
        className="fixed bottom-24 right-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/15 border-t-white/25 bg-[#181b29]/90 text-[#A7ACD9] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:scale-105 hover:border-[#A7ACD9]/45 hover:bg-[#1F2335] hover:text-[#c2c7f6] active:scale-95 sm:right-7"
      >
        <Bug className="h-5 w-5" aria-hidden />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bug-report-modal-title"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 border-t-white/20 bg-[#161926]/95 p-6 text-[#E4E1E5] shadow-2xl backdrop-blur-2xl sm:p-7"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={isEng ? 'Close bug report dialog' : 'Đóng hộp thoại báo lỗi'}
              className="absolute right-4 top-4 rounded-full p-2 text-[#919099] transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 text-[#A7ACD9]">
                <Bug className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 id="bug-report-modal-title" className="font-h1 text-lg font-bold text-[#E4E1E5]">
                  {isEng ? 'Support & Issue Report' : 'Hỗ trợ & Báo cáo sự cố'}
                </h3>
                <p className="mt-0.5 text-xs text-[#C7C5CF]">
                  {isEng
                    ? 'Send feedback so the DILLUSTRATION team can inspect and resolve it quickly.'
                    : 'Gửi phản hồi để đội ngũ DILLUSTRATION kiểm tra và xử lý nhanh chóng.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="bug-report-title" className="text-xs font-semibold text-[#C7C5CF]">
                  {isEng ? 'Issue Title' : 'Tiêu đề sự cố'}
                </label>
                <input
                  id="bug-report-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isEng ? 'e.g. Cannot click the Place Bid button' : 'Ví dụ: Không bấm được nút Đặt giá'}
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#1F2335]/80 px-4 py-2.5 text-sm text-[#E4E1E5] placeholder:text-[#919099] outline-none transition-colors focus:border-[#A7ACD9]"
                />
              </div>

              <div>
                <label htmlFor="bug-report-description" className="text-xs font-semibold text-[#C7C5CF]">
                  {isEng ? 'Detailed Description' : 'Mô tả chi tiết'}
                </label>
                <textarea
                  id="bug-report-description"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isEng
                      ? 'Describe the steps you performed and any error message displayed...'
                      : 'Mô tả cụ thể thao tác bạn vừa thực hiện và lỗi hiển thị...'
                  }
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#1F2335]/80 px-4 py-2.5 text-sm text-[#E4E1E5] placeholder:text-[#919099] outline-none transition-colors focus:border-[#A7ACD9]"
                />
              </div>

              <div>
                <label htmlFor="bug-report-email" className="text-xs font-semibold text-[#C7C5CF]">
                  {isEng ? 'Your Email (optional)' : 'Email của bạn (tùy chọn)'}
                </label>
                <input
                  id="bug-report-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isEng
                      ? 'To receive a reply once the issue is resolved'
                      : 'Để nhận phản hồi khi sự cố được khắc phục'
                  }
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#1F2335]/80 px-4 py-2.5 text-sm text-[#E4E1E5] placeholder:text-[#919099] outline-none transition-colors focus:border-[#A7ACD9]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#C7C5CF] transition-colors hover:bg-white/5 hover:text-white"
                >
                  {isEng ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-full bg-[#A7ACD9] px-5 py-2.5 text-xs font-bold text-[#1F2335] transition hover:bg-[#c2c7f6] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{isEng ? 'Submit Report' : 'Gửi báo cáo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
