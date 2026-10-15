'use client';

import WorkroomTermsModal from '@/components/modals/WorkroomTermsModal';
import type { Commission } from '@/types/commission.types';

const previewCommission: Commission = {
  id: 'preview-commission',
  clientId: 'preview-client',
  creatorId: 'preview-creator',
  title: 'Thiết kế nhân vật minh họa',
  description: 'Bản xem trước màn hình điều khoản Workroom.',
  status: 'InProgress',
  licenseType: 'Commercial',
  licenseMultiplierApplied: 1.5,
  discountAmount: 0,
  totalPrice: 300000,
  finalPrice: 300000,
  escrowStatus: 'Pending',
  deadlineAt: '2026-11-30T16:59:00.000Z',
  createdAt: '2026-10-13T00:00:00.000Z',
  milestones: [
    {
      id: 'preview-milestone',
      commissionId: 'preview-commission',
      sequence: 1,
      title: 'Phác thảo',
      status: 'Pending',
      price: 300000,
      revisionCount: 0,
      maxRevisions: 3,
    },
  ],
};

export default function WorkroomTermsPreview() {
  return (
    <main className="min-h-screen bg-[#0d0f18]">
      <WorkroomTermsModal
        isOpen
        role="client"
        commission={previewCommission}
        onConfirm={() => undefined}
      />
    </main>
  );
}
