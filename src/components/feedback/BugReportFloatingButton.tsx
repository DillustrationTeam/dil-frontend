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
            className="fixed bottom-40 right-[76px] z-50 w-44 overflow-hidden rounded-2xl border border-[#221E1A]/10 border-t-white/25 bg-[#FFFCF6]/95 p-1.5 text-[#241F1A] shadow-[0_14px_34px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:right-[84px]"
          >
            <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-[#746A5F]">
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
                        ? 'border border-[#B24A26]/35 bg-[#B24A26]/18 text-[#241F1A]'
                        : 'text-[#6E6459] hover:bg-[#FFFCF6] hover:text-[#241F1A]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded-md border border-[#221E1A]/10 bg-[#FFFCF6] px-1.5 py-0.5 text-[10px] font-bold text-[#8C3718]">
                        {option.short}
                      </span>
                      <span>{option.label}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-[#8C3718]" aria-hidden />}
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
          className="fixed bottom-40 right-5 z-40 flex size-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border border-[#221E1A]/10 border-t-white/25 bg-[#F0E7D8]/90 text-[#8C3718] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:scale-105 hover:border-[#B24A26]/45 hover:bg-[#F7F2E9] hover:text-[#8C3718] active:scale-95 sm:right-7"
        >
          <Languages className="h-4 w-4" aria-hidden />
          <span className="text-[9px] font-extrabold leading-none tracking-wider text-[#241F1A]">
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
        className="fixed bottom-24 right-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full border border-[#221E1A]/10 border-t-white/25 bg-[#F0E7D8]/90 text-[#8C3718] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:scale-105 hover:border-[#B24A26]/45 hover:bg-[#F7F2E9] hover:text-[#8C3718] active:scale-95 sm:right-7"
      >
        <Bug className="h-5 w-5" aria-hidden />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bug-report-modal-title"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F0E7D8]/75 p-4 backdrop-blur-md"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#221E1A]/10 border-t-white/20 bg-[#FFFCF6]/95 p-6 text-[#241F1A] shadow-2xl backdrop-blur-2xl sm:p-7"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={isEng ? 'Close bug report dialog' : 'Đóng hộp thoại báo lỗi'}
              className="absolute right-4 top-4 rounded-full p-2 text-[#746A5F] transition-colors hover:bg-[#F0E7D8] hover:text-[#241F1A]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#B24A26]/30 bg-[#B24A26]/15 text-[#8C3718]">
                <Bug className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 id="bug-report-modal-title" className="font-h1 text-lg font-bold text-[#241F1A]">
                  {isEng ? 'Support & Issue Report' : 'Hỗ trợ & Báo cáo sự cố'}
                </h3>
                <p className="mt-0.5 text-xs text-[#6E6459]">
                  {isEng
                    ? 'Send feedback so the DILLUSTRATION team can inspect and resolve it quickly.'
                    : 'Gửi phản hồi để đội ngũ DILLUSTRATION kiểm tra và xử lý nhanh chóng.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="bug-report-title" className="text-xs font-semibold text-[#6E6459]">
                  {isEng ? 'Issue Title' : 'Tiêu đề sự cố'}
                </label>
                <input
                  id="bug-report-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isEng ? 'e.g. Cannot click the Place Bid button' : 'Ví dụ: Không bấm được nút Đặt giá'}
                  className="mt-1.5 w-full rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9]/80 px-4 py-2.5 text-sm text-[#241F1A] placeholder:text-[#746A5F] outline-none transition-colors focus:border-[#B24A26]"
                />
              </div>

              <div>
                <label htmlFor="bug-report-description" className="text-xs font-semibold text-[#6E6459]">
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
                  className="mt-1.5 w-full rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9]/80 px-4 py-2.5 text-sm text-[#241F1A] placeholder:text-[#746A5F] outline-none transition-colors focus:border-[#B24A26]"
                />
              </div>

              <div>
                <label htmlFor="bug-report-email" className="text-xs font-semibold text-[#6E6459]">
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
                  className="mt-1.5 w-full rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9]/80 px-4 py-2.5 text-sm text-[#241F1A] placeholder:text-[#746A5F] outline-none transition-colors focus:border-[#B24A26]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#6E6459] transition-colors hover:bg-[#FFFCF6] hover:text-[#241F1A]"
                >
                  {isEng ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-full bg-[#B24A26] px-5 py-2.5 text-xs font-bold text-[#F7F2E9] transition hover:bg-[#8C3718] disabled:opacity-50"
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
