import type { Metadata } from 'next';
import { PlatformFeePolicyConsole } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Platform Fee & Policy Console (SCR-18) | dillustration Admin',
  description:
    'Configure global platform commission fee rates (5% - 15%), escrow release policies, and revision rules for dillustration.',
};

export default function AdminPlatformFeePolicyPage() {
  return <PlatformFeePolicyConsole />;
}
