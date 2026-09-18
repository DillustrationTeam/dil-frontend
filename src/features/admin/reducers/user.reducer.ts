import {
  AdminUserDto,
  AdminUserFilters,
  PagedResult,
} from '@/features/admin/types/admin.types';

export interface UserManagementState {
  users: {
    data: PagedResult<AdminUserDto>;
    filters: AdminUserFilters;
    loading: boolean;
    error: string | null;
  };
  user: {
    data: AdminUserDto;
    loading: boolean;
    error: string | null;
  };
}

export const initialUser: AdminUserDto = {
  id: '',
  fullName: '',
  email: '',
  role: '',
  status: '',
  createdAt: null,
};

export const initialUserState: UserManagementState = {
  users: {
    data: {
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
      totalElements: 0,
      isFirst: true,
      isLast: true,
    },
    filters: {
      keyword: '',
      role: null,
      status: null,
    },
    loading: false,
    error: null,
  },
  user: {
    data: initialUser,
    loading: false,
    error: null,
  },
};

type UserAction =
  | { type: 'GET_USERS_REQUEST' }
  | { type: 'GET_USERS_SUCCESS'; payload: PagedResult<AdminUserDto> }
  | { type: 'GET_USERS_FAILURE'; payload: string }
  | { type: 'GET_USER_REQUEST' }
  | { type: 'GET_USER_SUCCESS'; payload: AdminUserDto }
  | { type: 'GET_USER_FAILURE'; payload: string }
  | { type: 'SET_FILTERS'; payload: { field: keyof AdminUserFilters; value: string | null } }
  | { type: 'SET_PAGE'; payload: number };

export function userReducer(state: UserManagementState, action: UserAction): UserManagementState {
  switch (action.type) {
    case 'GET_USERS_REQUEST':
      return {
        ...state,
        users: {
          ...state.users,
          loading: true,
          error: null,
        },
      };
    case 'GET_USERS_SUCCESS':
      return {
        ...state,
        users: {
          ...state.users,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_USERS_FAILURE':
      return {
        ...state,
        users: {
          ...state.users,
          loading: false,
          error: action.payload,
        },
      };
    case 'GET_USER_REQUEST':
      return {
        ...state,
        user: {
          ...state.user,
          loading: true,
          error: null,
        },
      };
    case 'GET_USER_SUCCESS':
      return {
        ...state,
        user: {
          ...state.user,
          loading: false,
          data: action.payload,
        },
      };
    case 'GET_USER_FAILURE':
      return {
        ...state,
        user: {
          ...state.user,
          loading: false,
          error: action.payload,
        },
      };
    case 'SET_FILTERS':
      return {
        ...state,
        users: {
          ...state.users,
          filters: {
            ...state.users.filters,
            [action.payload.field]: action.payload.value,
          },
          data: {
            ...state.users.data,
            page: 0,
          },
        },
      };
    case 'SET_PAGE':
      return {
        ...state,
        users: {
          ...state.users,
          data: {
            ...state.users.data,
            page: action.payload,
          },
        },
      };
    default:
      return state;
  }
}
