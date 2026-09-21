'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { getErrorMessage } from '@/lib/api-error';
import { adminDashboardService } from '@/features/admin/services/dashboard.service';
import {
  dashboardReducer,
  initialDashboardState,
} from '@/features/admin/reducers/dashboard.reducer';

export function useAdminDashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

  const getOverview = useCallback(async (days?: number) => {
    dispatch({ type: 'GET_OVERVIEW_REQUEST' });

    try {
      const data = await adminDashboardService.getOverview(days ?? state.filters.days);
      dispatch({ type: 'GET_OVERVIEW_SUCCESS', payload: data });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_OVERVIEW_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch dashboard overview.'),
      });
      return false;
    }
  }, [state.filters.days]);

  const getFinancialKpis = useCallback(async () => {
    dispatch({ type: 'GET_KPIS_REQUEST' });

    try {
      const data = await adminDashboardService.getFinancialKpis();
      dispatch({ type: 'GET_KPIS_SUCCESS', payload: data });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_KPIS_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch financial KPIs.'),
      });
      return false;
    }
  }, []);

  const setDays = useCallback((days: number) => {
    dispatch({ type: 'SET_DAYS_FILTER', payload: days });
  }, []);

  const refresh = useCallback(() => {
    void getOverview(state.filters.days);
  }, [getOverview, state.filters.days]);

  useEffect(() => {
    void getOverview(state.filters.days);
  }, [getOverview, state.filters.days]);

  return {
    state,
    // Convenient direct getters for SCR-24 widgets
    overview: state.overview.data,
    financialKpis: state.overview.data?.financialKpis || state.financialKpis.data,
    userMetrics: state.overview.data?.userMetrics,
    commissionMetrics: state.overview.data?.commissionMetrics,
    actionRequiredQueue: state.overview.data?.actionRequiredQueue,
    revenueTrend: state.overview.data?.revenueTrend || [],
    recentTransactions: state.overview.data?.recentTransactions || [],
    days: state.filters.days,
    loading: state.overview.loading,
    kpisLoading: state.financialKpis.loading,
    error: state.overview.error,
    // Actions
    getOverview,
    getFinancialKpis,
    setDays,
    refresh,
  };
}
