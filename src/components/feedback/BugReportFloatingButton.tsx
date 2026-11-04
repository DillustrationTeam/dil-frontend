'use client';

import React, { useState } from 'react';
import { Bug, X, Send, Loader2 } from 'lucide-react';
import { supportService } from '@/services/support.service';
import toast from 'react-hot-toast';

export function BugReportFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung.');
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

      toast.success('Báo cáo lỗi đã được gửi! Cảm ơn bạn.');
      setTitle('');
      setDescription('');
      setEmail('');
      setIsOpen(false);
    } catch {
      toast.error('Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút Báo lỗi dạng pill/icon xếp ngay trên nút AI (bottom-24) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full border border-rose-500/30 bg-[#251A27]/90 px-3.5 py-2 text-xs font-semibold text-rose-300 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-rose-950/90 hover:text-white sm:right-6"
        title="Báo cáo lỗi hệ thống"
      >
        <Bug className="h-4 w-4 text-rose-400" />
        <span className="hidden sm:inline">Báo lỗi</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1D2B] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-rose-400">
              <Bug className="h-5 w-5" />
              <h3 className="font-h1 text-lg font-bold text-white">Báo cáo sự cố / Lỗi web</h3>
            </div>
            <p className="mt-1 text-xs text-[#919099]">
              Giúp đội ngũ kỹ thuật Dillustration khắc phục lỗi nhanh chóng.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#C7C5CF]">Tiêu đề sự cố</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Không bấm được nút Đặt giá"
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#12141F] px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#C7C5CF]">Mô tả chi tiết</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể hành động bạn vừa làm và lỗi hiển thị thế nào..."
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#12141F] px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#C7C5CF]">Email của bạn (tùy chọn)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Để nhận phản hồi khi sự cố được khắc phục"
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#12141F] px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[#919099] hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:bg-rose-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Gửi báo cáo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
