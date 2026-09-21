'use client';

import { useState } from 'react';
import { useUsers } from '@/features/admin/hooks/use-users';
import { UserFilter } from './user-filter';
import { UserTable } from './user-table';
import { UserDetail } from './user-detail';
import { Pagination } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';

export function UserManagement() {
  const { state, setFilters, setPage, getUserById } = useUsers();
  const [showDetail, setShowDetail] = useState(false);

  const handleViewUser = async (id: string) => {
    const success = await getUserById(id);
    if (success) {
      setShowDetail(true);
    }
  };

  const handleClose = () => {
    setShowDetail(false);
  };

  const { content, page, totalPages, isFirst, isLast } = state.users.data;

  return (
    <div className="space-y-6">
      <UserFilter
        keyword={state.users.filters.keyword}
        role={state.users.filters.role}
        status={state.users.filters.status}
        onFilterChange={setFilters}
      />

      {state.users.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.users.error}
        </div>
      ) : null}

      {state.users.loading && content.length === 0 ? (
        <div className="glass-container flex h-48 items-center justify-center rounded-[28px] text-sm text-[#A7ACD9]">
          Loading users...
        </div>
      ) : (
        <UserTable data={content} onView={handleViewUser} />
      )}

      {totalPages > 1 ? (
        <div className="pt-2">
          <Pagination
            page={page}
            totalPages={totalPages}
            isFirst={isFirst}
            isLast={isLast}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      <Modal open={showDetail} onClose={handleClose} title="User Details">
        {state.user.loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-[#A7ACD9]">
            Loading user details...
          </div>
        ) : (
          <UserDetail user={state.user.data} />
        )}
      </Modal>
    </div>
  );
}

export default UserManagement;
