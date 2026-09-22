import type { Metadata } from 'next';
import { DisputeArbitrationConsole } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Dispute Resolution & Escrow Arbitration (SCR-22) | dillustration Admin',
  description:
    'Admin console for commission dispute arbitration, workroom chat & evidence investigation, and atomic escrow fund distribution.',
};

export default function AdminDisputesPage() {
  return <DisputeArbitrationConsole />;
}
