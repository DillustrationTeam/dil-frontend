import {
  AdminDashboardOverviewDto,
  AdminFinancialKpiDto,
} from '@/features/admin/types/admin.types';

export interface DashboardState {
  overview: {
    data: AdminDashboardOverviewDto | null;
    loading: boolean;
    error: string | null;
  };
  financialKpis: {
    data: AdminFinancialKpiDto | null;
    loading: boolean;
    error: string | null;
  };
  filters: {
    days: number;
  };
}

export const initialDashboardState: DashboardState = {
  overview: {
    data: null,
    loading: false,
    error: null,
  },
  financialKpis: {
    data: null,
    loading: false,
    error: null,
  },
  filters: {
    days: 120,
  },
};

export type DashboardAction =
  | { type: 'GET_OVERVIEW_REQUEST' }
  | { type: 'GET_OVERVIEW_SUCCESS'; payload: AdminDashboardOverviewDto }
  | { type: 'GET_OVERVIEW_FAILURE'; payload: string }
  | { type: 'GET_KPIS_REQUEST' }
  | { type: 'GET_KPIS_SUCCESS'; payload: AdminFinancialKpiDto }
  | { type: 'GET_KPIS_FAILURE'; payload: string }
  | { type: 'SET_DAYS_FILTER'; payload: number };

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
        financialKpis: {
          ...state.financialKpis,
          data: action.payload.financialKpis,
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
    case 'GET_KPIS_REQUEST':
      return {
        ...state,
        financialKpis: {
          ...state.financialKpis,
          loading: true,
          error: null,
        },
      };
    case 'GET_KPIS_SUCCESS':
      return {
        ...state,
        financialKpis: {
          ...state.financialKpis,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_KPIS_FAILURE':
      return {
        ...state,
        financialKpis: {
          ...state.financialKpis,
          loading: false,
          error: action.payload,
        },
      };
    case 'SET_DAYS_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          days: action.payload,
        },
      };
    default:
      return state;
  }
}
