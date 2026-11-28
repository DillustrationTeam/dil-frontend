'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { CreateTab } from '@/features/event/components/event-admin/create-tab/create-tab';
import { useLanguage } from '@/context/language-context';

export default function AdminCreateEventPage() {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const router = useRouter();

  const handleSaveSuccess = () => {
    router.push('/admin/events');
  };

  const handleCancel = () => {
    router.push('/admin/events');
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 text-[#241F1A]">
      {/* Header & Back Button */}
      <div className="mb-6 border-b border-[#221E1A]/10 pb-6">
        <Link
          href="/admin/events"
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-periwinkle hover:text-[#241F1A] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{isVie ? 'Quay lại Quản lý sự kiện' : 'Back to Event Operations'}</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-1 text-xs font-semibold text-brand-periwinkle">
              <Trophy size={13} className="text-[#8A6A1F]" />
              <span>{isVie ? 'Trung tâm Quản trị · Vận hành Sự kiện' : 'Admin Center · Event Operations'}</span>
            </div>
            <h1 className="font-h1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#241F1A] leading-tight">
              {isVie ? 'Tạo cuộc thi minh họa mới' : 'Create New Illustration Contest'}
            </h1>
            <p className="mt-2 text-sm text-[#B24A26] leading-relaxed max-w-3xl">
              {isVie
                ? 'Điền thông tin chi tiết cuộc thi, ảnh bìa, cơ cấu giải thưởng, giới hạn bình chọn và các mốc thời gian để xuất bản cuộc thi.'
                : 'Fill in contest details, banner image, prize structure, max votes, and timeline stages to publish a new contest.'}
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
