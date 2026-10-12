'use client';

import React, { useState } from 'react';
import { DisputesStats } from './disputes-stats';
import { DisputesQueueCard, DisputeQueueItem } from './disputes-queue-card';
import { ModeratorDecisionCard } from './moderator-decision-card';

const initialDisputes: DisputeQueueItem[] = [
  {
    id: 'dsp-021',
    code: 'DSP-021',
    reason: 'Suspected 3rd party copyright infringement',
    priority: 'High',
    status: 'Open',
  },
  {
    id: 'dsp-018',
    code: 'DSP-018',
    reason: 'Jury panel score variance appeal',
    priority: 'Medium',
    status: 'Open',
  },
  {
    id: 'dsp-014',
    code: 'DSP-014',
    reason: 'Account submission ownership verification',
    priority: 'Medium',
    status: 'Open',
  },
];

export function DisputesTab() {
  const [disputes, setDisputes] = useState<DisputeQueueItem[]>(initialDisputes);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>('dsp-021');

  const selectedDispute =
    disputes.find((d) => d.id === selectedDisputeId) || disputes[0];

  const handleResolveCurrent = () => {
    setDisputes((prev) => prev.filter((d) => d.id !== selectedDisputeId));
    if (disputes.length > 1) {
      const remaining = disputes.filter((d) => d.id !== selectedDisputeId);
      setSelectedDisputeId(remaining[0].id);
    }
  };

  const openCount = disputes.length;
  const highPriorityCount = disputes.filter((d) => d.priority === 'High').length;

  return (
    <div>
      <DisputesStats
        openCount={openCount}
        highPriorityCount={highPriorityCount}
        resolvedCount={8}
        overdueCount={0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <DisputesQueueCard
            disputes={disputes}
            selectedDisputeId={selectedDisputeId}
            onSelectDispute={setSelectedDisputeId}
          />
        </div>
        <div className="lg:col-span-5">
          <ModeratorDecisionCard
            selectedDisputeCode={selectedDispute ? selectedDispute.code : 'DSP-021'}
            onReject={handleResolveCurrent}
            onApprove={handleResolveCurrent}
          />
        </div>
      </div>
    </div>
  );
}
