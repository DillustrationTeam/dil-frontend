'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api-error';
import { adminDisputeService } from '@/features/admin/services/dispute.service';
import {
  initialDisputeState,
  disputeReducer,
} from '@/features/admin/reducers/dispute.reducer';
import {
  DisputeQueueFilters,
  DisputeStatus,
  ResolveDisputeArbitrationRequest,
} from '@/features/admin/types/dispute-arbitration.types';

export function useDisputes() {
  const [state, dispatch] = useReducer(disputeReducer, initialDisputeState);
  const initialLoadRef = useRef(false);

  const loadQueue = useCallback(
    async (overrideFilters?: Partial<DisputeQueueFilters>) => {
      dispatch({ type: 'GET_QUEUE_REQUEST' });

      const filters: DisputeQueueFilters = {
        ...state.queue.filters,
        ...(overrideFilters || {}),
      };

      try {
        const result = await adminDisputeService.getDisputeQueue(filters);
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
          'Failed to fetch dispute arbitration queue.'
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

  const inspectDispute = useCallback(async (disputeId: string) => {
    dispatch({ type: 'INSPECT_DISPUTE_REQUEST', payload: disputeId });

    try {
      const detail = await adminDisputeService.getDisputeDetail(disputeId);
      dispatch({
        type: 'INSPECT_DISPUTE_SUCCESS',
        payload: detail,
      });
      return detail;
    } catch (error) {
      const errorMsg = getErrorMessage(
        error,
        'Failed to fetch dispute arbitration dossier.'
      );
      dispatch({
        type: 'INSPECT_DISPUTE_FAILURE',
        payload: errorMsg,
      });
      return null;
    }
  }, []);

  const clearSelectedDispute = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_DISPUTE' });
  }, []);

  const setStatusFilter = useCallback(
    async (status: DisputeStatus) => {
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

  const resolveDispute = useCallback(
    async (disputeId: string, payload: ResolveDisputeArbitrationRequest) => {
      if (payload.clientRefundPercent < 0 || payload.clientRefundPercent > 100) {
        toast.error('Tỷ lệ hoàn tiền phải từ 0% đến 100%.');
        return false;
      }

      if (!payload.adminNote.trim()) {
        toast.error('Vui lòng nhập ghi chú / căn cứ phán quyết trọng tài.');
        return false;
      }

      dispatch({ type: 'RESOLVE_DISPUTE_REQUEST' });

      try {
        const response = await adminDisputeService.resolveDispute(disputeId, {
          clientRefundPercent: payload.clientRefundPercent,
          adminNote: payload.adminNote.trim(),
          resolution:
            payload.clientRefundPercent === 100
              ? 'ClientWin100'
              : payload.clientRefundPercent === 0
              ? 'ArtistWin100'
              : 'SplitCustom',
        });

        dispatch({
          type: 'RESOLVE_DISPUTE_SUCCESS',
          payload: response.message,
        });

        toast.success(response.message || 'Phán quyết trọng tài đã thực thi thành công!');

        // Refresh queue and re-inspect current dispute
        await loadQueue();
        await inspectDispute(disputeId);
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(
          error,
          'Thực thi phán quyết trọng tài thất bại.'
        );
        dispatch({
          type: 'RESOLVE_DISPUTE_FAILURE',
          payload: errorMsg,
        });
        toast.error(errorMsg);
        return false;
      }
    },
    [inspectDispute, loadQueue]
  );

  const clearFeedback = useCallback(() => {
    dispatch({ type: 'CLEAR_FEEDBACK' });
  }, []);

  // Initial load - auto select first item for instant preview
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      void loadQueue().then((items) => {
        if (items.length > 0) {
          void inspectDispute(items[0].disputeId);
        }
      });
    }
  }, [inspectDispute, loadQueue]);

  return {
    state,
    // Accessors
    items: state.queue.items,
    meta: state.queue.meta,
    filters: state.queue.filters,
    selectedDisputeId: state.selectedDisputeId,
    selectedDispute: state.selectedDispute.data,
    isQueueLoading: state.queue.loading,
    isInspectionLoading: state.selectedDispute.loading,
    isArbitrationSubmitting: state.arbitrationAction.submitting,
    queueError: state.queue.error,
    detailError: state.selectedDispute.error,
    arbitrationError: state.arbitrationAction.error,
    // Actions
    loadQueue,
    inspectDispute,
    clearSelectedDispute,
    setStatusFilter,
    setSearchFilter,
    setPage,
    resolveDispute,
    clearFeedback,
  };
}
