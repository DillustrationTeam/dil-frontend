'use client';

import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export interface DisputeQueueItem {
  id: string;
  code: string;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved';
  submittedBy?: string;
}

interface DisputesQueueCardProps {
  disputes: DisputeQueueItem[];
  selectedDisputeId: string | null;
  onSelectDispute: (id: string) => void;
}

export function DisputesQueueCard({
  disputes,
  selectedDisputeId,
  onSelectDispute,
}: DisputesQueueCardProps) {
  return (
    <div className="glass-container rounded-2xl p-6 min-h-[390px] flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold font-h1 text-on-surface mb-4">Dispute Queue</h2>

        {disputes.length === 0 ? (
          <div className="min-h-[300px] grid place-items-center text-center">
            <div>
              <b className="grid w-16 h-16 mx-auto place-items-center rounded-2xl bg-brand-periwinkle/10 text-brand-periwinkle">
                0
              </b>
              <h3 className="text-lg font-bold mt-3">No Pending Disputes</h3>
              <p className="text-sm text-outline mt-1">All contest dispute cases have been resolved.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {disputes.map((item) => {
              const isSelected = selectedDisputeId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectDispute(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-brand-periwinkle/60 bg-brand-periwinkle/15 shadow-[0_0_20px_rgba(167,172,217,0.15)]'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-[#e598ad]/10 text-[#f2b3c4] mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface font-mono">
                          {item.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.priority === 'High'
                              ? 'bg-[#e598ad]/20 text-[#f2b3c4] border border-[#e598ad]/30'
                              : 'bg-amber-950/50 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm text-outline mt-1">{item.reason}</p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 transition-transform ${
                      isSelected ? 'text-brand-periwinkle translate-x-1' : 'text-outline'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
