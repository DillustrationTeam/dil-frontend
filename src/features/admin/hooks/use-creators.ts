'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { getErrorMessage } from '@/lib/api-error';
import { adminCreatorService } from '@/features/admin/services/creator.service';
import { creatorReducer, initialCreatorState } from '@/features/admin/reducers/creator.reducer';

export function useCreators() {
  const [state, dispatch] = useReducer(creatorReducer, initialCreatorState);

  const setPage = (page: number) => {
    dispatch({
      type: 'SET_PAGE',
      payload: page,
    });
  };

  const getCreatorApplications = useCallback(async () => {
    const {
      data: { page, size },
    } = state.applications;
    const params = { page, size };

    dispatch({ type: 'GET_APPLICATIONS_REQUEST' });

    try {
      const data = await adminCreatorService.getCreatorApplications(params);
      dispatch({
        type: 'GET_APPLICATIONS_SUCCESS',
        payload: data,
      });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_APPLICATIONS_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch creator applications.'),
      });
      return false;
    }
  }, [state.applications.data.page, state.applications.data.size]);

  const getCreatorApplicationById = useCallback(async (id: string) => {
    dispatch({ type: 'GET_APPLICATION_REQUEST' });

    try {
      const data = await adminCreatorService.getCreatorApplicationById(id);
      dispatch({
        type: 'GET_APPLICATION_SUCCESS',
        payload: data,
      });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_APPLICATION_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch creator application.'),
      });
      return false;
    }
  }, []);

  useEffect(() => {
    void getCreatorApplications();
  }, [getCreatorApplications]);

  return {
    state,
    setPage,
    getCreatorApplications,
    getCreatorApplicationById,
  };
}
