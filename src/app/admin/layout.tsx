import type { Metadata } from 'next';
import { AdminLayout } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Admin Console | dillustration',
  description: 'Administrator & Platform Control Console for dillustration',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
