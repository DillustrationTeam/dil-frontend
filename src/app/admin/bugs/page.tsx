'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supportService, BugReportDto, BugReportStatus } from '@/services/support.service';
import { Bug, CheckCircle2, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminBugReportsPage() {
  const [reports, setReports] = useState<BugReportDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = useCallback(async (currentFilter: string) => {
    setLoading(true);
    try {
      const statusParam = currentFilter === 'open' ? (0 as BugReportStatus) : currentFilter === 'resolved' ? (2 as BugReportStatus) : undefined;
      const data = await supportService.getBugReports(statusParam);
      setReports(data);
    } catch {
      toast.error('Không thể tải danh sách báo lỗi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const statusParam = filter === 'open' ? (0 as BugReportStatus) : filter === 'resolved' ? (2 as BugReportStatus) : undefined;
        const data = await supportService.getBugReports(statusParam);
        if (!ignore) setReports(data);
      } catch {
        if (!ignore) toast.error('Không thể tải danh sách báo lỗi.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [filter]);

  const handleResolve = async (id: string) => {
    setUpdatingId(id);
    try {
      await supportService.updateBugStatus(id, 2 as BugReportStatus, 'Đã xử lý bởi Admin');
      toast.success('Đã cập nhật trạng thái thành Đã xử lý.');
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 2 as BugReportStatus, adminNote: 'Đã xử lý bởi Admin' } : r))
      );
    } catch {
      toast.error('Cập nhật trạng thái thất bại.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-rose-400" />
            <h1 className="font-h1 text-2xl font-bold text-white">Quản lý Báo cáo Sự cố (Bug Reports)</h1>
          </div>
          <p className="mt-1 text-sm text-[#919099]">
            Danh sách lỗi và phản hồi từ người dùng trên toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#161926] px-4 py-2.5 text-xs text-white outline-none focus:border-[#A7ACD9]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Đang mở (Chờ xử lý)</option>
            <option value="resolved">Đã xử lý (Resolved)</option>
          </select>

          <button
            onClick={() => fetchReports(filter)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#919099]">Đang tải danh sách báo cáo...</div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-[#161926]/50 py-20 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400/80" />
          <p className="mt-3 text-sm text-white font-medium">Hiện không có báo cáo sự cố nào!</p>
          <p className="mt-1 text-xs text-[#919099]">Hệ thống đang hoạt động ổn định.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl border border-white/10 bg-[#171A29] p-5 shadow-sm transition-all hover:border-white/20"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                        report.status === 2
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {report.status === 2 ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Đã xử lý</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Chờ khắc phục</span>
                        </>
                      )}
                    </span>

                    <h3 className="font-h1 text-base font-bold text-white">{report.title}</h3>
                  </div>

                  <p className="text-sm text-[#C7C5CF] whitespace-pre-wrap">{report.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#919099] pt-1">
                    <span>
                      Người gửi: <strong className="text-white/80">{report.reporterEmail || 'Ẩn danh'}</strong>
                    </span>
                    <span>
                      Ngày báo: {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </span>
                    {report.pageUrl && (
                      <a
                        href={report.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#A7ACD9] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Xem trang bị lỗi</span>
                      </a>
                    )}
                  </div>

                  {report.adminNote && (
                    <div className="mt-2 text-xs text-[#BCE6B8] bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-3 py-1.5 inline-block">
                      Ghi chú: {report.adminNote}
                    </div>
                  )}
                </div>

                {report.status !== 2 && (
                  <button
                    type="button"
                    disabled={updatingId === report.id}
                    onClick={() => handleResolve(report.id)}
                    className="shrink-0 flex items-center gap-2 rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Xong (Đã sửa)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
