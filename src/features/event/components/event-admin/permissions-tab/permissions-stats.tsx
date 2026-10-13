'use client';

import React from 'react';
import { Crown, Users, MailCheck, FileSpreadsheet } from 'lucide-react';

interface PermissionsStatsProps {
  headJuryCount?: number;
  juryCount?: number;
  pendingInvitesCount?: number;
  assignedCount?: number;
}

export function PermissionsStats({
  headJuryCount = 1,
  juryCount = 7,
  pendingInvitesCount = 2,
  assignedCount = 248,
}: PermissionsStatsProps) {
  const stats = [
    {
      label: 'Head Jury',
      value: headJuryCount,
      icon: Crown,
      color: 'text-amber-300',
    },
    {
      label: 'Jury Members',
      value: juryCount,
      icon: Users,
      color: 'text-brand-periwinkle',
    },
    {
      label: 'Pending Invites',
      value: pendingInvitesCount,
      icon: MailCheck,
      color: 'text-cyan-300',
    },
    {
      label: 'Assigned Submissions',
      value: assignedCount,
      icon: FileSpreadsheet,
      color: 'text-emerald-300',
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
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-periwinkle via-cyan-400 to-transparent opacity-75" />
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
