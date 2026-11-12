'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { CreateTab } from '@/features/event/components/event-admin/create-tab/create-tab';
import { eventService } from '@/features/event/services/event.service';
import type { EventListItemDto } from '@/features/event/types/event.types';
import toast from 'react-hot-toast';

export default function AdminEditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventListItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await eventService.detail(params.id);
      if (detail) {
        setEvent(detail as unknown as EventListItemDto);
      } else {
        const message = 'Không tìm thấy sự kiện yêu cầu.';
        setEvent(null);
        setLoadError(message);
        toast.error(message);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Không thể tải thông tin chi tiết sự kiện.';
      setEvent(null);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const handleSaveSuccess = () => {
    router.push('/admin/events');
  };

  const handleCancel = () => {
    router.push('/admin/events');
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-periwinkle border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 text-[#e4e1e5]">
      {/* Header & Back Button */}
      <div className="mb-6 border-b border-white/10 pb-6">
        <Link
          href="/admin/events"
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-periwinkle hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Event Operations</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-1 text-xs font-semibold text-brand-periwinkle">
              <Trophy size={13} className="text-amber-300" />
              <span>Admin Center · Event Operations</span>
            </div>
            <h1 className="font-h1 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Update Contest: {event?.title || params?.id}
            </h1>
            <p className="mt-2 text-sm text-[#A7ACD9] leading-relaxed max-w-3xl">
              Modify contest overview, prize structure, submission deadlines, and jury configuration.
            </p>
          </div>
        </div>
      </div>

      {loadError || !event ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/35 bg-red-500/10 p-6 sm:p-8 text-red-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-300" />
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold text-white">Không thể tải dữ liệu sự kiện để chỉnh sửa</h2>
                <p className="mt-1 text-sm text-red-200/95">
                  {loadError || 'Dữ liệu sự kiện không tồn tại hoặc máy chủ không phản hồi.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void loadEvent()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/25 border border-red-400/40 px-4 py-2 text-xs font-bold text-white hover:bg-red-500/35 transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Thử lại</span>
                </button>
                <Link
                  href="/admin/events"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại danh sách sự kiện</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CreateTab
          selectedEvent={event}
          onSaveSuccess={handleSaveSuccess}
          onCancelEdit={handleCancel}
        />
      )}
    </div>
  );
}
