import {
  UserAccountStatus,
  UserAdminDetailDto,
  UserAdminListItemDto,
  UserManagementFilters,
  UserManagementMeta,
} from '@/features/admin/types/user-management.types';

export interface UserManagementState {
  users: {
    items: UserAdminListItemDto[];
    loading: boolean;
    error: string | null;
    meta: UserManagementMeta;
    filters: UserManagementFilters;
  };
  selectedUserId: string | null;
  selectedUser: {
    data: UserAdminDetailDto | null;
    loading: boolean;
    error: string | null;
  };
  sanctionAction: {
    submitting: boolean;
    error: string | null;
    successMessage: string | null;
  };
  rolesAction: {
    submitting: boolean;
    error: string | null;
    successMessage: string | null;
  };
}

export const initialUserState: UserManagementState = {
  users: {
    items: [],
    loading: false,
    error: null,
    meta: {
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
      activeCount: 0,
      lockedCount: 0,
    },
    filters: {
      search: '',
      role: 'All',
      status: 'All',
      page: 1,
      pageSize: 10,
    },
  },
  selectedUserId: null,
  selectedUser: {
    data: null,
    loading: false,
    error: null,
  },
  sanctionAction: {
    submitting: false,
    error: null,
    successMessage: null,
  },
  rolesAction: {
    submitting: false,
    error: null,
    successMessage: null,
  },
};

export type UserAction =
  | { type: 'GET_USERS_REQUEST' }
  | {
      type: 'GET_USERS_SUCCESS';
      payload: { items: UserAdminListItemDto[]; meta: UserManagementMeta };
    }
  | { type: 'GET_USERS_FAILURE'; payload: string }
  | { type: 'SET_SEARCH_FILTER'; payload: string }
  | { type: 'SET_ROLE_FILTER'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: UserAccountStatus }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'INSPECT_USER_REQUEST'; payload: string }
  | { type: 'INSPECT_USER_SUCCESS'; payload: UserAdminDetailDto }
  | { type: 'INSPECT_USER_FAILURE'; payload: string }
  | { type: 'CLEAR_SELECTED_USER' }
  | { type: 'APPLY_SANCTION_REQUEST' }
  | { type: 'APPLY_SANCTION_SUCCESS'; payload: string }
  | { type: 'APPLY_SANCTION_FAILURE'; payload: string }
  | { type: 'UPDATE_ROLES_REQUEST' }
  | { type: 'UPDATE_ROLES_SUCCESS'; payload: string }
  | { type: 'UPDATE_ROLES_FAILURE'; payload: string }
  | { type: 'CLEAR_FEEDBACK' };

export function userReducer(
  state: UserManagementState,
  action: UserAction
): UserManagementState {
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
          items: action.payload.items,
          meta: action.payload.meta,
          error: null,
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

    case 'SET_SEARCH_FILTER':
      return {
        ...state,
        users: {
          ...state.users,
          filters: {
            ...state.users.filters,
            search: action.payload,
            page: 1,
          },
        },
      };

    case 'SET_ROLE_FILTER':
      return {
        ...state,
        users: {
          ...state.users,
          filters: {
            ...state.users.filters,
            role: action.payload,
            page: 1,
          },
        },
      };

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        users: {
          ...state.users,
          filters: {
            ...state.users.filters,
            status: action.payload,
            page: 1,
          },
        },
      };

    case 'SET_PAGE':
      return {
        ...state,
        users: {
          ...state.users,
          filters: {
            ...state.users.filters,
            page: action.payload,
          },
        },
      };

    case 'SET_PAGE_SIZE':
      return {
        ...state,
        users: {
          ...state.users,
          filters: {
            ...state.users.filters,
            pageSize: action.payload,
            page: 1,
          },
        },
      };

    case 'INSPECT_USER_REQUEST':
      return {
        ...state,
        selectedUserId: action.payload,
        selectedUser: {
          ...state.selectedUser,
          loading: true,
          error: null,
        },
      };

    case 'INSPECT_USER_SUCCESS':
      return {
        ...state,
        selectedUser: {
          data: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'INSPECT_USER_FAILURE':
      return {
        ...state,
        selectedUser: {
          ...state.selectedUser,
          loading: false,
          error: action.payload,
        },
      };

    case 'CLEAR_SELECTED_USER':
      return {
        ...state,
        selectedUserId: null,
        selectedUser: {
          data: null,
          loading: false,
          error: null,
        },
      };

    case 'APPLY_SANCTION_REQUEST':
      return {
        ...state,
        sanctionAction: {
          submitting: true,
          error: null,
          successMessage: null,
        },
      };

    case 'APPLY_SANCTION_SUCCESS':
      return {
        ...state,
        sanctionAction: {
          submitting: false,
          error: null,
          successMessage: action.payload,
        },
      };

    case 'APPLY_SANCTION_FAILURE':
      return {
        ...state,
        sanctionAction: {
          submitting: false,
          error: action.payload,
          successMessage: null,
        },
      };

    case 'UPDATE_ROLES_REQUEST':
      return {
        ...state,
        rolesAction: {
          submitting: true,
          error: null,
          successMessage: null,
        },
      };

    case 'UPDATE_ROLES_SUCCESS':
      return {
        ...state,
        rolesAction: {
          submitting: false,
          error: null,
          successMessage: action.payload,
        },
      };

    case 'UPDATE_ROLES_FAILURE':
      return {
        ...state,
        rolesAction: {
          submitting: false,
          error: action.payload,
          successMessage: null,
        },
      };

    case 'CLEAR_FEEDBACK':
      return {
        ...state,
        sanctionAction: {
          ...state.sanctionAction,
          error: null,
          successMessage: null,
        },
        rolesAction: {
          ...state.rolesAction,
          error: null,
          successMessage: null,
        },
      };

    default:
      return state;
  }
}
