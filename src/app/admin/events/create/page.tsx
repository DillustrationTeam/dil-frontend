'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { CreateTab } from '@/features/event/components/event-admin/create-tab/create-tab';

export default function AdminCreateEventPage() {
  const router = useRouter();

  const handleSaveSuccess = () => {
    router.push('/admin/events');
  };

  const handleCancel = () => {
    router.push('/admin/events');
  };

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
              Create New Illustration Contest
            </h1>
            <p className="mt-2 text-sm text-[#A7ACD9] leading-relaxed max-w-3xl">
              Fill in contest details, banner image, prize structure, max votes, and timeline stages to publish a new contest.
            </p>
          </div>
        </div>
      </div>

      {/* Create Event Form Component */}
      <CreateTab
        selectedEvent={null}
        onSaveSuccess={handleSaveSuccess}
        onCancelEdit={handleCancel}
      />
    </div>
  );
}
