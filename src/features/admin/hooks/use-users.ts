'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api-error';
import { adminUserService } from '@/features/admin/services/user.service';
import {
  initialUserState,
  userReducer,
} from '@/features/admin/reducers/user.reducer';
import {
  ApplyUserSanctionRequest,
  UserAccountStatus,
  UserManagementFilters,
} from '@/features/admin/types/user-management.types';

export function useUsers() {
  const [state, dispatch] = useReducer(userReducer, initialUserState);
  const initialLoadRef = useRef(false);

  const loadUsers = useCallback(
    async (overrideFilters?: Partial<UserManagementFilters>) => {
      dispatch({ type: 'GET_USERS_REQUEST' });

      const filters: UserManagementFilters = {
        ...state.users.filters,
        ...(overrideFilters || {}),
      };

      try {
        const result = await adminUserService.getUsers(filters);
        dispatch({
          type: 'GET_USERS_SUCCESS',
          payload: {
            items: result.items,
            meta: result.meta,
          },
        });
        return result.items;
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Failed to fetch user accounts.');
        dispatch({
          type: 'GET_USERS_FAILURE',
          payload: errorMsg,
        });
        return [];
      }
    },
    [state.users.filters]
  );

  const inspectUser = useCallback(async (userId: string) => {
    dispatch({ type: 'INSPECT_USER_REQUEST', payload: userId });

    try {
      const detail = await adminUserService.getUserDetail(userId);
      dispatch({
        type: 'INSPECT_USER_SUCCESS',
        payload: detail,
      });
      return detail;
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Failed to fetch user profile details.');
      dispatch({
        type: 'INSPECT_USER_FAILURE',
        payload: errorMsg,
      });
      return null;
    }
  }, []);

  const clearSelectedUser = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_USER' });
  }, []);

  const setSearchFilter = useCallback(
    async (search: string) => {
      dispatch({ type: 'SET_SEARCH_FILTER', payload: search });
      await loadUsers({ search, page: 1 });
    },
    [loadUsers]
  );

  const setRoleFilter = useCallback(
    async (role: string) => {
      dispatch({ type: 'SET_ROLE_FILTER', payload: role });
      await loadUsers({ role, page: 1 });
    },
    [loadUsers]
  );

  const setStatusFilter = useCallback(
    async (status: UserAccountStatus) => {
      dispatch({ type: 'SET_STATUS_FILTER', payload: status });
      await loadUsers({ status, page: 1 });
    },
    [loadUsers]
  );

  const setPage = useCallback(
    async (page: number) => {
      dispatch({ type: 'SET_PAGE', payload: page });
      await loadUsers({ page });
    },
    [loadUsers]
  );

  const setPageSize = useCallback(
    async (pageSize: number) => {
      dispatch({ type: 'SET_PAGE_SIZE', payload: pageSize });
      await loadUsers({ pageSize, page: 1 });
    },
    [loadUsers]
  );

  const applySanction = useCallback(
    async (userId: string, payload: ApplyUserSanctionRequest) => {
      if (!payload.reason || !payload.reason.trim()) {
        toast.error('Please specify a violation reason for this administrative action.');
        return false;
      }

      if (payload.actionType === 'Suspend') {
        const days = payload.durationDays;
        if (!days || days <= 0) {
          toast.error('Please specify a valid suspension duration in days.');
          return false;
        }
      }

      dispatch({ type: 'APPLY_SANCTION_REQUEST' });

      try {
        const response = await adminUserService.applySanction(userId, {
          actionType: payload.actionType,
          reason: payload.reason.trim(),
          durationDays: payload.durationDays ?? null,
        });

        dispatch({
          type: 'APPLY_SANCTION_SUCCESS',
          payload: response.message,
        });

        toast.success(response.message || 'Sanction applied successfully!');

        // Refresh user list and inspect current user
        await loadUsers();
        await inspectUser(userId);
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Failed to execute user sanction.');
        dispatch({
          type: 'APPLY_SANCTION_FAILURE',
          payload: errorMsg,
        });
        toast.error(errorMsg);
        return false;
      }
    },
    [inspectUser, loadUsers]
  );

  const updateUserRoles = useCallback(
    async (userId: string, roles: string[]) => {
      if (!roles || roles.length === 0) {
        toast.error('A user account must have at least one assigned role.');
        return false;
      }

      dispatch({ type: 'UPDATE_ROLES_REQUEST' });

      try {
        const response = await adminUserService.updateUserRoles(userId, { roles });

        dispatch({
          type: 'UPDATE_ROLES_SUCCESS',
          payload: response.message,
        });

        toast.success(response.message || 'Roles updated successfully!');

        // Refresh user list and inspect current user
        await loadUsers();
        await inspectUser(userId);
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Failed to update user roles.');
        dispatch({
          type: 'UPDATE_ROLES_FAILURE',
          payload: errorMsg,
        });
        toast.error(errorMsg);
        return false;
      }
    },
    [inspectUser, loadUsers]
  );

  const clearFeedback = useCallback(() => {
    dispatch({ type: 'CLEAR_FEEDBACK' });
  }, []);

  // Initial load - auto select first item like Content & AI Moderation
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      void loadUsers().then((items) => {
        if (items.length > 0) {
          void inspectUser(items[0].id);
        }
      });
    }
  }, [inspectUser, loadUsers]);

  return {
    state,
    // Accessors
    items: state.users.items,
    meta: state.users.meta,
    filters: state.users.filters,
    selectedUserId: state.selectedUserId,
    selectedUser: state.selectedUser.data,
    isUsersLoading: state.users.loading,
    isDetailLoading: state.selectedUser.loading,
    isSanctionSubmitting: state.sanctionAction.submitting,
    isRolesSubmitting: state.rolesAction.submitting,
    usersError: state.users.error,
    detailError: state.selectedUser.error,
    sanctionError: state.sanctionAction.error,
    rolesError: state.rolesAction.error,
    // Actions
    loadUsers,
    inspectUser,
    clearSelectedUser,
    setSearchFilter,
    setRoleFilter,
    setStatusFilter,
    setPage,
    setPageSize,
    applySanction,
    updateUserRoles,
    clearFeedback,
  };
}
