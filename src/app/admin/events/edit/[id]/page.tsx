'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { CreateTab } from '@/features/event/components/event-admin/create-tab/create-tab';
import { eventService } from '@/features/event/services/event.service';
import type { EventListItemDto } from '@/features/event/types/event.types';
import toast from 'react-hot-toast';

export default function AdminEditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventListItemDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!params?.id) return;
      setLoading(true);
      try {
        const detail = await eventService.detail(params.id);
        if (detail) {
          setEvent(detail as unknown as EventListItemDto);
        } else {
          toast.error('Event not found.');
        }
      } catch {
        toast.error('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    void loadEvent();
  }, [params?.id]);

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

      {/* Edit Event Form Component */}
      <CreateTab
        selectedEvent={event}
        onSaveSuccess={handleSaveSuccess}
        onCancelEdit={handleCancel}
      />
    </div>
  );
}
