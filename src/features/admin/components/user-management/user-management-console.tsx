'use client';

import React, { useState } from 'react';
import { useUsers } from '@/features/admin/hooks/use-users';
import {
  UserHeader,
  UserTable,
  UserInspectionSection,
} from './components';

export function UserManagementConsole() {
  const {
    items,
    meta,
    filters,
    selectedUserId,
    selectedUser,
    isUsersLoading,
    isDetailLoading,
    isSanctionSubmitting,
    isRolesSubmitting,
    usersError,
    loadUsers,
    inspectUser,
    clearSelectedUser,
    setSearchFilter,
    setRoleFilter,
    setStatusFilter,
    setPage,
    applySanction,
    updateUserRoles,
  } = useUsers();

  const [activeActionMode, setActiveActionMode] = useState<'sanction' | 'roles'>('sanction');

  const handleInspect = (userId: string, targetMode?: 'sanction' | 'roles') => {
    void inspectUser(userId);
    if (targetMode) {
      setActiveActionMode(targetMode);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Top Header with Title, Stats & Filter Controls */}
      <UserHeader
        activeCount={meta.activeCount}
        lockedCount={meta.lockedCount}
        totalCount={meta.totalCount}
        activeStatus={filters.status}
        activeRole={filters.role}
        searchQuery={filters.search}
        isLoading={isUsersLoading}
        onStatusChange={setStatusFilter}
        onRoleChange={setRoleFilter}
        onSearchChange={setSearchFilter}
        onRefresh={() => void loadUsers()}
      />

      {/* 2. Searchable User Accounts Table with Always-Visible Pagination (pageSize = 10) */}
      <UserTable
        items={items}
        meta={meta}
        selectedUserId={selectedUserId}
        isLoading={isUsersLoading}
        error={usersError}
        onInspect={handleInspect}
        onPageChange={setPage}
      />

      {/* 3. Detailed Account Governance Console: User Detail on Left, Actions (Apply Sanction / Edit Role) on Right */}
      <UserInspectionSection
        user={selectedUser}
        activeActionMode={activeActionMode}
        onActionModeChange={setActiveActionMode}
        isLoading={isDetailLoading}
        isSanctionSubmitting={isSanctionSubmitting}
        isRolesSubmitting={isRolesSubmitting}
        onApplySanction={applySanction}
        onUpdateRoles={updateUserRoles}
        onClose={selectedUser ? clearSelectedUser : undefined}
      />
    </div>
  );
}

export default UserManagementConsole;
