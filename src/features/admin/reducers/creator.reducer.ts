import {
  CreatorApplicationDetailDto,
  CreatorApplicationDto,
  PagedResult,
} from '@/features/admin/types/admin.types';

export interface CreatorApplicationState {
  applications: {
    data: PagedResult<CreatorApplicationDto>;
    loading: boolean;
    error: string | null;
  };
  application: {
    data: CreatorApplicationDetailDto;
    loading: boolean;
    error: string | null;
  };
}

const initialCreatorApplicationDetail: CreatorApplicationDetailDto = {
  id: '',
  fullName: '',
  email: '',
  idCardUrl: '',
  portfolioUrl: '',
  statement: '',
  applicationStatus: '',
  submittedAt: '',
};

export const initialCreatorState: CreatorApplicationState = {
  applications: {
    data: {
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
      totalElements: 0,
      isFirst: true,
      isLast: true,
    },
    loading: false,
    error: null,
  },
  application: {
    data: initialCreatorApplicationDetail,
    loading: false,
    error: null,
  },
};

type CreatorAction =
  | { type: 'GET_APPLICATIONS_REQUEST' }
  | { type: 'GET_APPLICATIONS_SUCCESS'; payload: PagedResult<CreatorApplicationDto> }
  | { type: 'GET_APPLICATIONS_FAILURE'; payload: string }
  | { type: 'GET_APPLICATION_REQUEST' }
  | { type: 'GET_APPLICATION_SUCCESS'; payload: CreatorApplicationDetailDto }
  | { type: 'GET_APPLICATION_FAILURE'; payload: string }
  | { type: 'SET_PAGE'; payload: number };

export function creatorReducer(
  state: CreatorApplicationState,
  action: CreatorAction
): CreatorApplicationState {
  switch (action.type) {
    case 'GET_APPLICATIONS_REQUEST':
      return {
        ...state,
        applications: {
          ...state.applications,
          loading: true,
          error: null,
        },
      };
    case 'GET_APPLICATIONS_SUCCESS':
      return {
        ...state,
        applications: {
          ...state.applications,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_APPLICATIONS_FAILURE':
      return {
        ...state,
        applications: {
          ...state.applications,
          loading: false,
          error: action.payload,
        },
      };
    case 'GET_APPLICATION_REQUEST':
      return {
        ...state,
        application: {
          ...state.application,
          loading: true,
          error: null,
        },
      };
    case 'GET_APPLICATION_SUCCESS':
      return {
        ...state,
        application: {
          ...state.application,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_APPLICATION_FAILURE':
      return {
        ...state,
        application: {
          ...state.application,
          loading: false,
          error: action.payload,
        },
      };
    case 'SET_PAGE':
      return {
        ...state,
        applications: {
          ...state.applications,
          data: {
            ...state.applications.data,
            page: action.payload,
          },
        },
      };
    default:
      return state;
  }
}
