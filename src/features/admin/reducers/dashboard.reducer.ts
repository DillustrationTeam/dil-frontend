import { DatePeriod } from '@/lib/date-utils';
import {
  ChartType,
  DashboardOverviewDto,
  StatisticsFilters,
  StatisticsPointDto,
  StatisticsTabKey,
} from '@/features/admin/types/admin.types';

export interface DashboardState {
  overview: {
    data: DashboardOverviewDto;
    loading: boolean;
    error: string | null;
  };
  statistics: {
    data: StatisticsPointDto[];
    filters: StatisticsFilters;
    loading: boolean;
    error: string | null;
  };
}

export const initialDashboardState: DashboardState = {
  overview: {
    data: {
      totalUsers: 0,
      totalCreators: 0,
      totalArtworks: 0,
      totalCommissions: 0,
      totalRevenue: 0,
    },
    loading: false,
    error: null,
  },
  statistics: {
    data: [],
    filters: {
      activeTab: 'USERS',
      period: 'MONTH',
      referenceDate: new Date(),
      chartType: 'BAR',
    },
    loading: false,
    error: null,
  },
};

type DashboardAction =
  | { type: 'GET_OVERVIEW_REQUEST' }
  | { type: 'GET_OVERVIEW_SUCCESS'; payload: DashboardOverviewDto }
  | { type: 'GET_OVERVIEW_FAILURE'; payload: string }
  | { type: 'GET_STATISTICS_REQUEST' }
  | { type: 'GET_STATISTICS_SUCCESS'; payload: StatisticsPointDto[] }
  | { type: 'GET_STATISTICS_FAILURE'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: StatisticsTabKey }
  | { type: 'SET_PERIOD'; payload: DatePeriod }
  | { type: 'SET_REFERENCE_DATE'; payload: Date }
  | { type: 'SET_CHART_TYPE'; payload: ChartType };

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'GET_OVERVIEW_REQUEST':
      return {
        ...state,
        overview: {
          ...state.overview,
          loading: true,
          error: null,
        },
      };
    case 'GET_OVERVIEW_SUCCESS':
      return {
        ...state,
        overview: {
          ...state.overview,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_OVERVIEW_FAILURE':
      return {
        ...state,
        overview: {
          ...state.overview,
          loading: false,
          error: action.payload,
        },
      };
    case 'GET_STATISTICS_REQUEST':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          loading: true,
          error: null,
        },
      };
    case 'GET_STATISTICS_SUCCESS':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_STATISTICS_FAILURE':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          loading: false,
          error: action.payload,
        },
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          filters: {
            ...state.statistics.filters,
            activeTab: action.payload,
          },
        },
      };
    case 'SET_PERIOD':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          filters: {
            ...state.statistics.filters,
            period: action.payload,
          },
        },
      };
    case 'SET_REFERENCE_DATE':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          filters: {
            ...state.statistics.filters,
            referenceDate: action.payload,
          },
        },
      };
    case 'SET_CHART_TYPE':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          filters: {
            ...state.statistics.filters,
            chartType: action.payload,
          },
        },
      };
    default:
      return state;
  }
}
