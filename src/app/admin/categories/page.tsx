import type { Metadata } from 'next';
import { CategoryManagementConsole } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Category & Tag Management | dillustration Admin',
  description:
    'Manage primary artwork categories, inspect trending tags, merge duplicate tags, and promote tags to categories.',
};

export default function AdminCategoriesPage() {
  return <CategoryManagementConsole />;
}
