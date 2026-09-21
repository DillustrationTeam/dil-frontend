'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { getErrorMessage } from '@/lib/api-error';
import { adminUserService } from '@/features/admin/services/user.service';
import { initialUserState, userReducer } from '@/features/admin/reducers/user.reducer';
import { AdminUserFilters } from '@/features/admin/types/admin.types';

export function useUsers() {
  const [state, dispatch] = useReducer(userReducer, initialUserState);

  const setFilters = (field: keyof AdminUserFilters, value: string | null) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { field, value },
    });
  };

  const setPage = (page: number) => {
    dispatch({
      type: 'SET_PAGE',
      payload: page,
    });
  };

  const getUsers = useCallback(async () => {
    const {
      data: { page, size },
      filters: { keyword, role, status },
    } = state.users;
    const params = { page, size, keyword, role, status };

    dispatch({ type: 'GET_USERS_REQUEST' });

    try {
      const data = await adminUserService.getUsers(params);
      dispatch({
        type: 'GET_USERS_SUCCESS',
        payload: data,
      });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_USERS_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch users.'),
      });
      return false;
    }
  }, [state.users]);

  const getUserById = useCallback(async (id: string) => {
    dispatch({ type: 'GET_USER_REQUEST' });

    try {
      const data = await adminUserService.getUserById(id);
      dispatch({
        type: 'GET_USER_SUCCESS',
        payload: data,
      });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_USER_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch user.'),
      });
      return false;
    }
  }, []);

  useEffect(() => {
    void getUsers();
  }, [getUsers]);

  return {
    state,
    setFilters,
    setPage,
    getUsers,
    getUserById,
  };
}
