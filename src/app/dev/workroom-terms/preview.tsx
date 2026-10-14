'use client';

import WorkroomTermsModal from '@/components/modals/WorkroomTermsModal';
import type { Commission } from '@/types/commission.types';

const previewCommission: Commission = {
  id: 'preview',
  clientId: 'client',
  creatorId: 'creator',
  discountAmount: 0,
  licenseType: 'Commercial',
  licenseMultiplierApplied: 1.5,
  title: 'Thiết kế nhân vật minh họa',
  status: 'InProgress',
  totalPrice: 300000,
  finalPrice: 300000,
  escrowStatus: 'Pending',
  deadlineAt: '2026-11-30T16:59:00.000Z',
  createdAt: '2026-10-13T00:00:00.000Z',
  milestones: [{ id: 'milestone', commissionId: 'preview', sequence: 1, title: 'Phác thảo', status: 'Pending', price: 300000, maxRevisions: 3 }],
};

export default function WorkroomTermsPreview() {
  return (
    <main className="min-h-screen bg-[#0c0e17]">
      <WorkroomTermsModal isOpen role="client" commission={previewCommission} onConfirm={() => undefined} />
    </main>
  );
}
