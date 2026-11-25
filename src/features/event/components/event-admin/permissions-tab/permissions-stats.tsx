'use client';

import React from 'react';
import { Crown, Users, MailCheck, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface PermissionsStatsProps {
  headJuryCount?: number;
  juryCount?: number;
  pendingInvitesCount?: number;
  assignedCount?: number;
}

export function PermissionsStats({
  headJuryCount = 0,
  juryCount = 0,
  pendingInvitesCount = 0,
  assignedCount = 0,
}: PermissionsStatsProps) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const stats = [
    {
      label: isVie ? 'Trưởng ban' : 'Head Jury',
      value: headJuryCount,
      icon: Crown,
      color: 'text-[#8A6A1F]',
    },
    {
      label: isVie ? 'Thành viên BGK' : 'Jury Members',
      value: juryCount,
      icon: Users,
      color: 'text-brand-periwinkle',
    },
    {
      label: isVie ? 'Lời mời đang chờ' : 'Pending Invites',
      value: pendingInvitesCount,
      icon: MailCheck,
      color: 'text-[#2C6A86]',
    },
    {
      label: isVie ? 'Bài thi đã giao' : 'Assigned Submissions',
      value: assignedCount,
      icon: FileSpreadsheet,
      color: 'text-[#2F6B63]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-container rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-periwinkle via-[#2C6A86] to-transparent opacity-75" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                {stat.label}
              </span>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <strong className="text-2xl font-bold font-h1 text-on-surface mt-2">
              {stat.value}
            </strong>
          </div>
        );
      })}
    </div>
  );
}
