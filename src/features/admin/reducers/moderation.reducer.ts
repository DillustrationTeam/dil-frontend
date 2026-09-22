import {
  ArtworkInspectionDetailDto,
  ModerationQueueFilters,
  ModerationQueueItemDto,
  ModerationQueueMeta,
  ModerationStatus,
} from '@/features/admin/types/moderation.types';

export interface ModerationState {
  queue: {
    items: ModerationQueueItemDto[];
    loading: boolean;
    error: string | null;
    meta: ModerationQueueMeta;
    filters: ModerationQueueFilters;
  };
  selectedArtwork: {
    data: ArtworkInspectionDetailDto | null;
    loading: boolean;
    error: string | null;
  };
  decision: {
    submitting: boolean;
    error: string | null;
    successMessage: string | null;
  };
}

export const initialModerationState: ModerationState = {
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
    },
    filters: {
      status: 'Pending',
      search: '',
      page: 1,
      pageSize: 10,
    },
  },
  selectedArtwork: {
    data: null,
    loading: false,
    error: null,
  },
  decision: {
    submitting: false,
    error: null,
    successMessage: null,
  },
};

export type ModerationAction =
  | { type: 'GET_QUEUE_REQUEST' }
  | {
      type: 'GET_QUEUE_SUCCESS';
      payload: { items: ModerationQueueItemDto[]; meta: ModerationQueueMeta };
    }
  | { type: 'GET_QUEUE_FAILURE'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: ModerationStatus }
  | { type: 'SET_SEARCH_FILTER'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'INSPECT_ARTWORK_REQUEST'; payload: string }
  | { type: 'INSPECT_ARTWORK_SUCCESS'; payload: ArtworkInspectionDetailDto }
  | { type: 'INSPECT_ARTWORK_FAILURE'; payload: string }
  | { type: 'CLEAR_SELECTED_ARTWORK' }
  | { type: 'EXECUTE_DECISION_REQUEST' }
  | { type: 'EXECUTE_DECISION_SUCCESS'; payload: string }
  | { type: 'EXECUTE_DECISION_FAILURE'; payload: string }
  | { type: 'CLEAR_FEEDBACK' };

export function moderationReducer(
  state: ModerationState,
  action: ModerationAction
): ModerationState {
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
          items: action.payload.items,
          meta: action.payload.meta,
          error: null,
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

    case 'INSPECT_ARTWORK_REQUEST':
      return {
        ...state,
        selectedArtwork: {
          ...state.selectedArtwork,
          loading: true,
          error: null,
        },
      };

    case 'INSPECT_ARTWORK_SUCCESS':
      return {
        ...state,
        selectedArtwork: {
          data: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'INSPECT_ARTWORK_FAILURE':
      return {
        ...state,
        selectedArtwork: {
          ...state.selectedArtwork,
          loading: false,
          error: action.payload,
        },
      };

    case 'CLEAR_SELECTED_ARTWORK':
      return {
        ...state,
        selectedArtwork: {
          data: null,
          loading: false,
          error: null,
        },
      };

    case 'EXECUTE_DECISION_REQUEST':
      return {
        ...state,
        decision: {
          submitting: true,
          error: null,
          successMessage: null,
        },
      };

    case 'EXECUTE_DECISION_SUCCESS':
      return {
        ...state,
        decision: {
          submitting: false,
          error: null,
          successMessage: action.payload,
        },
      };

    case 'EXECUTE_DECISION_FAILURE':
      return {
        ...state,
        decision: {
          submitting: false,
          error: action.payload,
          successMessage: null,
        },
      };

    case 'CLEAR_FEEDBACK':
      return {
        ...state,
        decision: {
          ...state.decision,
          error: null,
          successMessage: null,
        },
      };

    default:
      return state;
  }
}
