import type { Metadata } from 'next';
import { UserManagementConsole } from '@/features/admin';

export const metadata: Metadata = {
  title: 'User Account Management & Sanctions (SCR-23) | dillustration Admin',
  description:
    'Search registered user accounts, edit permissions, and apply temporary suspensions or permanent bans.',
};

export default function AdminUsersPage() {
  return <UserManagementConsole />;
}
