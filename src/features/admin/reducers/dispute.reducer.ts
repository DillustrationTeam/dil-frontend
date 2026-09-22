import {
  DisputeArbitrationDetailDto,
  DisputeQueueFilters,
  DisputeQueueItemDto,
  DisputeQueueMeta,
  DisputeStatus,
} from '@/features/admin/types/dispute-arbitration.types';

export interface DisputeManagementState {
  queue: {
    items: DisputeQueueItemDto[];
    loading: boolean;
    error: string | null;
    meta: DisputeQueueMeta;
    filters: DisputeQueueFilters;
  };
  selectedDisputeId: string | null;
  selectedDispute: {
    data: DisputeArbitrationDetailDto | null;
    loading: boolean;
    error: string | null;
  };
  arbitrationAction: {
    submitting: boolean;
    error: string | null;
    successMessage: string | null;
  };
}

export const initialDisputeState: DisputeManagementState = {
  queue: {
    items: [],
    loading: false,
    error: null,
    meta: {
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
      pendingCount: 0,
      underReviewCount: 0,
      resolvedCount: 0,
      totalLockedEscrow: 0,
    },
    filters: {
      status: 'All',
      search: '',
      page: 1,
      pageSize: 10,
    },
  },
  selectedDisputeId: null,
  selectedDispute: {
    data: null,
    loading: false,
    error: null,
  },
  arbitrationAction: {
    submitting: false,
    error: null,
    successMessage: null,
  },
};

export type DisputeAction =
  | { type: 'GET_QUEUE_REQUEST' }
  | {
      type: 'GET_QUEUE_SUCCESS';
      payload: { items: DisputeQueueItemDto[]; meta: DisputeQueueMeta };
    }
  | { type: 'GET_QUEUE_FAILURE'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: DisputeStatus }
  | { type: 'SET_SEARCH_FILTER'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'INSPECT_DISPUTE_REQUEST'; payload: string }
  | { type: 'INSPECT_DISPUTE_SUCCESS'; payload: DisputeArbitrationDetailDto }
  | { type: 'INSPECT_DISPUTE_FAILURE'; payload: string }
  | { type: 'CLEAR_SELECTED_DISPUTE' }
  | { type: 'RESOLVE_DISPUTE_REQUEST' }
  | { type: 'RESOLVE_DISPUTE_SUCCESS'; payload: string }
  | { type: 'RESOLVE_DISPUTE_FAILURE'; payload: string }
  | { type: 'CLEAR_FEEDBACK' };

export function disputeReducer(
  state: DisputeManagementState,
  action: DisputeAction
): DisputeManagementState {
  switch (action.type) {
    case 'GET_QUEUE_REQUEST':
      return {
        ...state,
        queue: {
          ...state.queue,
          loading: true,
          error: null,
        },
      };

    case 'GET_QUEUE_SUCCESS':
      return {
        ...state,
        queue: {
          ...state.queue,
          loading: false,
          error: null,
          items: action.payload.items,
          meta: action.payload.meta,
        },
      };

    case 'GET_QUEUE_FAILURE':
      return {
        ...state,
        queue: {
          ...state.queue,
          loading: false,
          error: action.payload,
        },
      };

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        queue: {
          ...state.queue,
          filters: {
            ...state.queue.filters,
            status: action.payload,
            page: 1,
          },
        },
      };

    case 'SET_SEARCH_FILTER':
      return {
        ...state,
        queue: {
          ...state.queue,
          filters: {
            ...state.queue.filters,
            search: action.payload,
            page: 1,
          },
        },
      };

    case 'SET_PAGE':
      return {
        ...state,
        queue: {
          ...state.queue,
          filters: {
            ...state.queue.filters,
            page: action.payload,
          },
        },
      };

    case 'INSPECT_DISPUTE_REQUEST':
      return {
        ...state,
        selectedDisputeId: action.payload,
        selectedDispute: {
          ...state.selectedDispute,
          loading: true,
          error: null,
        },
      };

    case 'INSPECT_DISPUTE_SUCCESS':
      return {
        ...state,
        selectedDispute: {
          data: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'INSPECT_DISPUTE_FAILURE':
      return {
        ...state,
        selectedDispute: {
          ...state.selectedDispute,
          loading: false,
          error: action.payload,
        },
      };

    case 'CLEAR_SELECTED_DISPUTE':
      return {
        ...state,
        selectedDisputeId: null,
        selectedDispute: {
          data: null,
          loading: false,
          error: null,
        },
      };

    case 'RESOLVE_DISPUTE_REQUEST':
      return {
        ...state,
        arbitrationAction: {
          submitting: true,
          error: null,
          successMessage: null,
        },
      };

    case 'RESOLVE_DISPUTE_SUCCESS':
      return {
        ...state,
        arbitrationAction: {
          submitting: false,
          error: null,
          successMessage: action.payload,
        },
      };

    case 'RESOLVE_DISPUTE_FAILURE':
      return {
        ...state,
        arbitrationAction: {
          submitting: false,
          error: action.payload,
          successMessage: null,
        },
      };

    case 'CLEAR_FEEDBACK':
      return {
        ...state,
        arbitrationAction: {
          ...state.arbitrationAction,
          error: null,
          successMessage: null,
        },
      };

    default:
      return state;
  }
}
