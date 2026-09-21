'use client';

import { AdminUserDto } from '@/features/admin/types/admin.types';
import { Table, TableColumn } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export interface UserTableProps {
  data: AdminUserDto[];
  onView: (id: string) => void;
}

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'email', label: 'Email' },
  { key: 'fullName', label: 'Full name' },
  { key: 'role', label: 'Role' },
  { key: 'createdAt', label: 'Created at' },
  { key: 'status', label: 'Status' },
];

export function UserTable({ data, onView }: UserTableProps) {
  const formattedData = data.map((user) => ({
    ...user,
    createdAt: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—',
  }));

  const renderActions = (user: AdminUserDto) => (
    <Button
      variant="ghost"
      onClick={() => onView(user.id)}
      className="h-8 px-3 text-xs text-[#A7ACD9] hover:text-white"
    >
      View
    </Button>
  );

  return (
    <Table
      columns={columns}
      data={formattedData}
      renderActions={renderActions}
    />
  );
}

export default UserTable;
