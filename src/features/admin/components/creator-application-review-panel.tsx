'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, LoaderCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api-error';
import type { ApiResponse } from '@/types/api.types';

type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AdditionalProofRequested';
interface CreatorApplication {
  id: string;
  applicantName: string;
  applicantUsername: string;
  applicantEmail: string;
  primaryStyle?: string | null;
  portfolioLinks: string[];
  speedpaintVideoUrls: string[];
  socialLinks?: string[] | null;
  idProofUrl: string;
  idProofBackUrl: string;
  status: ApplicationStatus;
  reviewNote?: string | null;
  submittedAt: string;
}

const statuses: Array<'All' | ApplicationStatus> = ['All', 'Pending', 'AdditionalProofRequested', 'Approved', 'Rejected'];

export function CreatorApplicationReviewPanel() {
  const [items, setItems] = useState<CreatorApplication[]>([]);
  const [selected, setSelected] = useState<CreatorApplication | null>(null);
  const [filter, setFilter] = useState<'All' | ApplicationStatus>('Pending');
  const [loadedFilter, setLoadedFilter] = useState<'All' | ApplicationStatus | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const loading = loadedFilter !== filter;

  const loadApplications = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<CreatorApplication[]>>('/creator-applications', {
        params: { status: filter === 'All' ? undefined : filter, page: 1, pageSize: 50 },
      });
      if (response.data.error) throw new Error(response.data.error.details?.join(', ') || response.data.error.detail || 'Không tải được hồ sơ.');
      const applications = response.data.data ?? [];
      setItems(applications);
      setSelected((current) => current ? applications.find((item) => item.id === current.id) ?? null : applications[0] ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không tải được hồ sơ ứng tuyển.'));
    } finally {
      setLoadedFilter(filter);
    }
  }, [filter]);

  useEffect(() => { void Promise.resolve().then(loadApplications); }, [loadApplications]);

  const review = async (status: Exclude<ApplicationStatus, 'Pending'>) => {
    if (!selected || saving) return;
    if (status !== 'Approved' && !note.trim()) {
      toast.error('Nhập ghi chú cho quyết định này.');
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(`/creator-applications/${selected.id}/review`, {
        status,
        reviewNote: note.trim() || null,
        grantAiVerifiedBadge: true,
      });
      if (response.data.error) throw new Error(response.data.error.details?.join(', ') || response.data.error.detail || 'Không lưu được quyết định.');
      toast.success('Đã cập nhật trạng thái hồ sơ.');
      setNote('');
      await loadApplications();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không lưu được quyết định.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto mt-8 grid max-w-7xl gap-5 px-6 pb-12 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-white/10 bg-white/[.03] p-4">
        <div className="flex items-center justify-between gap-2"><h2 className="font-semibold text-white">Hồ sơ ứng tuyển</h2><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-lg border border-white/10 bg-[#1F2335] px-2 py-1.5 text-xs text-white">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
        {loading ? <p className="flex items-center gap-2 py-8 text-xs text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />Đang tải…</p> : items.length ? <ul className="mt-4 divide-y divide-white/10">{items.map((item) => <li key={item.id}><button type="button" onClick={() => { setSelected(item); setNote(item.reviewNote ?? ''); }} className={`w-full py-3 text-left ${selected?.id === item.id ? 'text-white' : 'text-slate-400'}`}><span className="block truncate text-sm font-medium">{item.applicantName}</span><span className="mt-1 block text-xs">{item.applicantEmail} · {item.status}</span></button></li>)}</ul> : <p className="py-8 text-xs text-slate-400">Không có hồ sơ phù hợp.</p>}
      </aside>

      <div className="min-w-0 rounded-xl border border-white/10 bg-white/[.03] p-5 sm:p-7">
        {selected ? <>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-h1 text-xl font-bold text-white">{selected.applicantName}</h2><p className="mt-1 text-sm text-slate-400">@{selected.applicantUsername} · {selected.applicantEmail}</p></div><span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-[#C5C9F8]">{selected.status}</span></div>
          <p className="mt-4 text-sm text-slate-300">Phong cách: {selected.primaryStyle || 'Chưa cung cấp'}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><a href={selected.idProofUrl} target="_blank" rel="noreferrer" className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10"><Image src={selected.idProofUrl} alt="Mặt trước giấy tờ" fill unoptimized className="object-cover" /></a><a href={selected.idProofBackUrl} target="_blank" rel="noreferrer" className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10"><Image src={selected.idProofBackUrl} alt="Mặt sau giấy tờ" fill unoptimized className="object-cover" /></a></div>
          <div className="mt-5 space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-400">Portfolio & speedpaint</h3>{[...selected.portfolioLinks, ...selected.speedpaintVideoUrls, ...(selected.socialLinks ?? [])].map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="block truncate text-sm text-[#C5C9F8] underline">{url}</a>)}</div>
          <div className="mt-6 border-t border-white/10 pt-5"><label htmlFor="application-review-note" className="text-xs font-semibold text-slate-300">Ghi chú xét duyệt</label><textarea id="application-review-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white" placeholder="Bắt buộc khi yêu cầu bổ sung hoặc từ chối" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void review('Approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"><Check className="h-4 w-4" />Duyệt</button><button type="button" disabled={saving} onClick={() => void review('AdditionalProofRequested')} className="rounded-lg border border-amber-300/30 px-4 py-2 text-sm text-amber-200 disabled:opacity-50">Yêu cầu bổ sung</button><button type="button" disabled={saving} onClick={() => void review('Rejected')} className="inline-flex items-center gap-2 rounded-lg border border-rose-300/30 px-4 py-2 text-sm text-rose-200 disabled:opacity-50"><X className="h-4 w-4" />Từ chối</button></div></div>
        </> : <p className="py-12 text-center text-sm text-slate-400">Chọn một hồ sơ để xem chi tiết.</p>}
      </div>
    </section>
  );
}