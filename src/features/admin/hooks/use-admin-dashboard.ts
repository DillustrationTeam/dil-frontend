'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { DatePeriod } from '@/lib/date-utils';
import { getErrorMessage } from '@/lib/api-error';
import { adminDashboardService } from '@/features/admin/services/dashboard.service';
import {
  dashboardReducer,
  initialDashboardState,
} from '@/features/admin/reducers/dashboard.reducer';
import { ChartType, StatisticsTabKey } from '@/features/admin/types/admin.types';

export function useAdminDashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

  const setActiveTab = (tab: StatisticsTabKey) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const setPeriod = (period: DatePeriod) => {
    dispatch({ type: 'SET_PERIOD', payload: period });
  };

  const setReferenceDate = (date: Date) => {
    dispatch({ type: 'SET_REFERENCE_DATE', payload: date });
  };

  const setChartType = (chartType: ChartType) => {
    dispatch({ type: 'SET_CHART_TYPE', payload: chartType });
  };

  const getOverview = useCallback(async () => {
    dispatch({ type: 'GET_OVERVIEW_REQUEST' });

    try {
      const data = await adminDashboardService.getOverview();
      dispatch({ type: 'GET_OVERVIEW_SUCCESS', payload: data });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_OVERVIEW_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch dashboard overview.'),
      });
      return false;
    }
  }, []);

  const getStatistics = useCallback(async () => {
    const { activeTab, period, referenceDate } = state.statistics.filters;
    const params = { period, referenceDate: referenceDate.toISOString() };

    dispatch({ type: 'GET_STATISTICS_REQUEST' });

    try {
      const data =
        activeTab === 'USERS'
          ? await adminDashboardService.getUsersStatistics(params)
          : activeTab === 'ARTWORKS'
            ? await adminDashboardService.getArtworksStatistics(params)
            : activeTab === 'COMMISSIONS'
              ? await adminDashboardService.getCommissionsStatistics(params)
              : await adminDashboardService.getRevenueStatistics(params);

      dispatch({ type: 'GET_STATISTICS_SUCCESS', payload: data });
      return true;
    } catch (error) {
      dispatch({
        type: 'GET_STATISTICS_FAILURE',
        payload: getErrorMessage(error, 'Failed to fetch statistics.'),
      });
      return false;
    }
  }, [
    state.statistics.filters.activeTab,
    state.statistics.filters.period,
    state.statistics.filters.referenceDate,
  ]);

  useEffect(() => {
    void getOverview();
  }, [getOverview]);

  useEffect(() => {
    void getStatistics();
  }, [getStatistics]);

  return {
    state,
    setActiveTab,
    setPeriod,
    setReferenceDate,
    setChartType,
    getOverview,
    getStatistics,
  };
}
