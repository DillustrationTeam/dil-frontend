'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supportService, BugReportDto, BugReportStatus } from '@/services/support.service';
import { useLanguage } from '@/context/language-context';
import { Bug, CheckCircle2, Clock, ExternalLink, Loader2, Mail, MessageSquareReply, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<BugReportStatus, { vie: string; eng: string; className: string }> = {
  0: {
    vie: 'Chờ khắc phục',
    eng: 'Pending Fix',
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  },
  1: {
    vie: 'Đang xử lý',
    eng: 'In Progress',
    className: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
  },
  2: {
    vie: 'Đã xử lý',
    eng: 'Resolved',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
};

export default function AdminBugReportsPage() {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  const [reports, setReports] = useState<BugReportDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<BugReportStatus>(2);
  const [sendingReply, setSendingReply] = useState(false);

  const toStatusParam = (value: string): BugReportStatus | undefined => {
    if (value === 'open') return 0;
    if (value === 'inprogress') return 1;
    if (value === 'resolved') return 2;
    return undefined;
  };

  const fetchReports = useCallback(async (currentFilter: string) => {
    setLoading(true);
    try {
      const data = await supportService.getBugReports(toStatusParam(currentFilter));
      setReports(data);
    } catch {
      toast.error(isEng ? 'Failed to load bug reports.' : 'Không thể tải danh sách báo lỗi.');
    } finally {
      setLoading(false);
    }
  }, [isEng]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await supportService.getBugReports(toStatusParam(filter));
        if (!ignore) setReports(data);
      } catch {
        if (!ignore) {
          toast.error(isEng ? 'Failed to load bug reports.' : 'Không thể tải danh sách báo lỗi.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [filter, isEng]);

  const handleResolve = async (id: string) => {
    setUpdatingId(id);
    try {
      const updated = await supportService.updateBugStatus(id, 2, 'Đã xử lý bởi Admin');
      toast.success(
        isEng ? 'Marked status as Resolved.' : 'Đã cập nhật trạng thái thành Đã xử lý.'
      );
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      toast.error(isEng ? 'Failed to update status.' : 'Cập nhật trạng thái thất bại.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openReplyBox = (report: BugReportDto) => {
    if (replyingId === report.id) {
      setReplyingId(null);
      return;
    }
    setReplyingId(report.id);
    setReplyText(report.adminNote || '');
    setReplyStatus(report.status === 0 ? 2 : report.status);
  };

  const handleSendReply = async (e: React.FormEvent, report: BugReportDto) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error(
        isEng
          ? 'Please enter a reply message for the user.'
          : 'Vui lòng nhập nội dung phản hồi cho người dùng.'
      );
      return;
    }

    setSendingReply(true);
    try {
      const result = await supportService.replyBugReport(report.id, replyText.trim(), replyStatus);
      setReports((prev) => prev.map((r) => (r.id === report.id ? result.report : r)));
      setReplyingId(null);
      setReplyText('');

      const channels: string[] = [];
      if (result.notifiedInApp) {
        channels.push(isEng ? 'in-app notification' : 'thông báo trong app');
      }
      if (result.emailedTo) channels.push(`email (${result.emailedTo})`);

      toast.success(
        channels.length > 0
          ? isEng
            ? `Replied via ${channels.join(' & ')}.`
            : `Đã phản hồi qua ${channels.join(' & ')}.`
          : isEng
            ? 'Reply saved to the bug report.'
            : 'Đã lưu phản hồi vào báo cáo sự cố.'
      );
    } catch {
      toast.error(
        isEng
          ? 'Unable to send reply right now. Please try again.'
          : 'Không thể gửi phản hồi lúc này. Vui lòng thử lại.'
      );
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6" data-no-translate="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Bug className="h-6 w-6 text-[#A7ACD9]" />
            <h1 className="font-h1 text-2xl font-bold text-white">
              {isEng ? 'Bug Reports Management' : 'Quản lý Báo cáo Sự cố'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#919099]">
            {isEng
              ? 'Track and respond directly to users via in-app notifications or email.'
              : 'Theo dõi và phản hồi trực tiếp tới người dùng qua thông báo hệ thống hoặc email.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#161926] px-4 py-2.5 text-xs text-white outline-none focus:border-[#A7ACD9]"
          >
            <option value="all">{isEng ? 'All statuses' : 'Tất cả trạng thái'}</option>
            <option value="open">{isEng ? 'Open' : 'Chờ xử lý'}</option>
            <option value="inprogress">{isEng ? 'In Progress' : 'Đang xử lý'}</option>
            <option value="resolved">{isEng ? 'Resolved' : 'Đã xử lý'}</option>
          </select>

          <button
            type="button"
            onClick={() => fetchReports(filter)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isEng ? 'Refresh' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#919099]">
          {isEng ? 'Loading bug reports...' : 'Đang tải danh sách báo cáo...'}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-[#161926]/50 py-20 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400/80" />
          <p className="mt-3 text-sm font-medium text-white">
            {isEng ? 'No bug reports right now!' : 'Hiện không có báo cáo sự cố nào!'}
          </p>
          <p className="mt-1 text-xs text-[#919099]">
            {isEng ? 'All systems are running smoothly.' : 'Hệ thống đang hoạt động ổn định.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const badge = STATUS_BADGE[report.status] ?? STATUS_BADGE[0];
            const hasEmail = Boolean(report.reporterEmail && report.reporterEmail.includes('@'));
            const isReplying = replyingId === report.id;

            return (
              <div
                key={report.id}
                className="rounded-3xl border border-white/10 bg-[#171A29] p-5 shadow-sm transition-all hover:border-white/20"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${badge.className}`}
                      >
                        {report.status === 2 ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{isEng ? badge.eng : badge.vie}</span>
                      </span>

                      <h3 className="font-h1 text-base font-bold text-white">{report.title}</h3>
                    </div>

                    <p className="whitespace-pre-wrap text-sm text-[#C7C5CF]">{report.description}</p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#919099]">
                      <span>
                        {isEng ? 'Reporter:' : 'Người gửi:'}{' '}
                        <strong className="text-white/80">
                          {report.reporterEmail || (isEng ? 'Anonymous' : 'Ẩn danh')}
                        </strong>
                      </span>
                      <span>
                        {isEng ? 'Reported at:' : 'Ngày báo:'}{' '}
                        {new Date(report.createdAt).toLocaleString(isEng ? 'en-US' : 'vi-VN')}
                      </span>
                      {report.pageUrl && (
                        <a
                          href={report.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#A7ACD9] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{isEng ? 'Open affected page' : 'Xem trang bị lỗi'}</span>
                        </a>
                      )}
                    </div>

                    {report.adminNote && (
                      <div className="mt-2 rounded-2xl border border-[#A7ACD9]/25 bg-[#1F2335]/80 px-3.5 py-2.5 text-xs text-[#E4E1E5]">
                        <span className="font-semibold text-[#A7ACD9]">
                          {isEng ? 'Admin reply:' : 'Phản hồi từ Admin:'}
                        </span>{' '}
                        <span className="whitespace-pre-wrap">{report.adminNote}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openReplyBox(report)}
                      className="flex items-center gap-1.5 rounded-2xl border border-[#A7ACD9]/35 bg-[#A7ACD9]/15 px-4 py-2.5 text-xs font-semibold text-[#c2c7f6] transition-colors hover:bg-[#A7ACD9]/25"
                    >
                      <MessageSquareReply className="h-4 w-4" />
                      <span>
                        {report.adminNote
                          ? isEng
                            ? 'Edit Reply'
                            : 'Sửa phản hồi'
                          : isEng
                            ? 'Reply'
                            : 'Phản hồi'}
                      </span>
                    </button>

                    {report.status !== 2 && (
                      <button
                        type="button"
                        disabled={updatingId === report.id}
                        onClick={() => handleResolve(report.id)}
                        className="flex items-center gap-1.5 rounded-2xl bg-emerald-600/80 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isEng ? 'Mark Resolved' : 'Xong (Đã sửa)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isReplying && (
                  <form
                    onSubmit={(e) => handleSendReply(e, report)}
                    className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-[#131624] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#919099]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{isEng ? 'Delivery channels:' : 'Kênh gửi phản hồi:'}</span>
                        {report.reporterId ? (
                          <span className="rounded-full border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#c2c7f6]">
                            {isEng ? 'In-app notification' : 'Thông báo trong app'}
                          </span>
                        ) : null}
                        {hasEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                            <Mail className="h-3 w-3" />
                            Email: {report.reporterEmail}
                          </span>
                        ) : null}
                        {!report.reporterId && !hasEmail ? (
                          <span className="text-[11px] text-amber-300/90">
                            {isEng
                              ? 'Anonymous reporter (reply saved on system only)'
                              : 'Người gửi ẩn danh (chỉ lưu nội dung phản hồi trên hệ thống)'}
                          </span>
                        ) : null}
                      </div>

                      <select
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(Number(e.target.value) as BugReportStatus)}
                        className="rounded-xl border border-white/10 bg-[#1B1F32] px-3 py-1.5 text-xs text-white outline-none focus:border-[#A7ACD9]"
                      >
                        <option value={1}>{isEng ? 'In Progress' : 'Đang xử lý'}</option>
                        <option value={2}>{isEng ? 'Resolved' : 'Đã xử lý'}</option>
                      </select>
                    </div>

                    <textarea
                      required
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isEng
                          ? 'Enter reply message for the user...'
                          : 'Nhập nội dung phản hồi gửi tới người dùng...'
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#1B1F32] px-4 py-2.5 text-sm text-white placeholder:text-[#919099] outline-none focus:border-[#A7ACD9]"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingId(null)}
                        className="rounded-full px-4 py-2 text-xs font-medium text-[#919099] hover:text-white"
                      >
                        {isEng ? 'Cancel' : 'Hủy'}
                      </button>
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="flex items-center gap-2 rounded-full bg-[#A7ACD9] px-5 py-2 text-xs font-bold text-[#1F2335] transition hover:bg-[#c2c7f6] disabled:opacity-50"
                      >
                        {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>{isEng ? 'Send Reply' : 'Gửi phản hồi'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
