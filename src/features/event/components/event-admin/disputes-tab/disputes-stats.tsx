'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface DisputesStatsProps {
  openCount?: number;
  highPriorityCount?: number;
  resolvedCount?: number;
  overdueCount?: number;
}

export function DisputesStats({
  openCount = 3,
  highPriorityCount = 1,
  resolvedCount = 8,
  overdueCount = 0,
}: DisputesStatsProps) {
  const stats = [
    {
      label: 'Open Disputes',
      value: openCount,
      icon: AlertCircle,
      color: 'text-amber-300',
    },
    {
      label: 'High Priority',
      value: highPriorityCount,
      icon: AlertTriangle,
      color: 'text-[#f2b3c4]',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-300',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      icon: Clock,
      color: 'text-outline',
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
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-periwinkle via-[#e598ad] to-transparent opacity-75" />
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
