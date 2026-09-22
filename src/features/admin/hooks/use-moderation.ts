'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api-error';
import { adminModerationService } from '@/features/admin/services/moderation.service';
import {
  initialModerationState,
  moderationReducer,
} from '@/features/admin/reducers/moderation.reducer';
import {
  ExecuteModerationDecisionRequest,
  ModerationActionType,
  ModerationQueueFilters,
  ModerationStatus,
} from '@/features/admin/types/moderation.types';

export function useModeration() {
  const [state, dispatch] = useReducer(moderationReducer, initialModerationState);
  const initialLoadRef = useRef(false);

  const loadQueue = useCallback(
    async (overrideFilters?: Partial<ModerationQueueFilters>) => {
      dispatch({ type: 'GET_QUEUE_REQUEST' });

      const filters: ModerationQueueFilters = {
        ...state.queue.filters,
        ...(overrideFilters || {}),
      };

      try {
        const result = await adminModerationService.getModerationQueue(filters);
        dispatch({
          type: 'GET_QUEUE_SUCCESS',
          payload: {
            items: result.items,
            meta: result.meta,
          },
        });

        return result.items;
      } catch (error) {
        const errorMsg = getErrorMessage(
          error,
          'Failed to fetch content moderation queue.'
        );
        dispatch({
          type: 'GET_QUEUE_FAILURE',
          payload: errorMsg,
        });
        return [];
      }
    },
    [state.queue.filters]
  );

  const inspectArtwork = useCallback(async (artworkId: string) => {
    dispatch({ type: 'INSPECT_ARTWORK_REQUEST', payload: artworkId });

    try {
      const detail = await adminModerationService.getArtworkInspectionDetail(artworkId);
      dispatch({
        type: 'INSPECT_ARTWORK_SUCCESS',
        payload: detail,
      });
      return detail;
    } catch (error) {
      const errorMsg = getErrorMessage(
        error,
        'Failed to fetch artwork inspection details.'
      );
      dispatch({
        type: 'INSPECT_ARTWORK_FAILURE',
        payload: errorMsg,
      });
      return null;
    }
  }, []);

  const clearSelectedArtwork = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_ARTWORK' });
  }, []);

  const setStatusFilter = useCallback(
    async (status: ModerationStatus) => {
      dispatch({ type: 'SET_STATUS_FILTER', payload: status });
      await loadQueue({ status, page: 1 });
    },
    [loadQueue]
  );

  const setSearchFilter = useCallback(
    async (search: string) => {
      dispatch({ type: 'SET_SEARCH_FILTER', payload: search });
      await loadQueue({ search, page: 1 });
    },
    [loadQueue]
  );

  const setPage = useCallback(
    async (page: number) => {
      dispatch({ type: 'SET_PAGE', payload: page });
      await loadQueue({ page });
    },
    [loadQueue]
  );

  const executeDecision = useCallback(
    async (
      artworkId: string,
      action: ModerationActionType,
      moderationNote?: string
    ) => {
      // Validate reject action requiring note
      if (action === 'reject' && (!moderationNote || !moderationNote.trim())) {
        toast.error('Please enter an internal audit note when rejecting and deleting an artwork.');
        return false;
      }

      dispatch({ type: 'EXECUTE_DECISION_REQUEST' });

      const payload: ExecuteModerationDecisionRequest = {
        action,
        moderationNote: moderationNote?.trim() || undefined,
      };

      try {
        const response = await adminModerationService.executeModerationDecision(
          artworkId,
          payload
        );

        dispatch({
          type: 'EXECUTE_DECISION_SUCCESS',
          payload: response.message,
        });

        toast.success(response.message || 'Moderation decision executed successfully!');

        // Refresh queue
        await loadQueue();

        // Refresh currently inspected item details
        await inspectArtwork(artworkId);

        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(
          error,
          'Failed to execute moderation decision.'
        );
        dispatch({
          type: 'EXECUTE_DECISION_FAILURE',
          payload: errorMsg,
        });
        toast.error(errorMsg);
        return false;
      }
    },
    [inspectArtwork, loadQueue]
  );

  const clearFeedback = useCallback(() => {
    dispatch({ type: 'CLEAR_FEEDBACK' });
  }, []);

  // Initial load
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      void loadQueue().then((items) => {
        // Auto-select first item if available
        if (items.length > 0) {
          void inspectArtwork(items[0].artworkId);
        }
      });
    }
  }, [inspectArtwork, loadQueue]);

  return {
    state,
    // Accessors
    items: state.queue.items,
    meta: state.queue.meta,
    filters: state.queue.filters,
    selectedArtwork: state.selectedArtwork.data,
    isQueueLoading: state.queue.loading,
    isInspectionLoading: state.selectedArtwork.loading,
    isDecisionSubmitting: state.decision.submitting,
    queueError: state.queue.error,
    inspectionError: state.selectedArtwork.error,
    decisionError: state.decision.error,
    decisionSuccess: state.decision.successMessage,
    // Actions
    loadQueue,
    inspectArtwork,
    clearSelectedArtwork,
    setStatusFilter,
    setSearchFilter,
    setPage,
    executeDecision,
    clearFeedback,
  };
}
