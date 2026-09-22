'use client';

import { useCallback, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api-error';
import { adminPlatformFeeService } from '@/features/admin/services/platform-fee.service';
import {
  initialPlatformFeeState,
  platformFeeReducer,
} from '@/features/admin/reducers/platform-fee.reducer';
import { UpdatePlatformFeePolicyRequest } from '@/features/admin/types/platform-fee.types';

export function usePlatformFee() {
  const [state, dispatch] = useReducer(platformFeeReducer, initialPlatformFeeState);

  const loadPolicy = useCallback(async () => {
    dispatch({ type: 'GET_POLICY_REQUEST' });

    try {
      const data = await adminPlatformFeeService.getPlatformFeePolicy();
      dispatch({ type: 'GET_POLICY_SUCCESS', payload: data });
      return true;
    } catch (error) {
      const errorMsg = getErrorMessage(
        error,
        'Failed to fetch platform fee and policy configuration.'
      );
      dispatch({
        type: 'GET_POLICY_FAILURE',
        payload: errorMsg,
      });
      return false;
    }
  }, []);

  const setFieldValue = useCallback(
    (field: keyof UpdatePlatformFeePolicyRequest, value: number) => {
      dispatch({
        type: 'SET_FORM_FIELD',
        payload: { field, value },
      });
    },
    []
  );

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const clearFeedback = useCallback(() => {
    dispatch({ type: 'CLEAR_FEEDBACK' });
  }, []);

  const savePolicy = useCallback(
    async (overrideValues?: Partial<UpdatePlatformFeePolicyRequest>) => {
      const payload: UpdatePlatformFeePolicyRequest = {
        ...state.form.values,
        ...(overrideValues || {}),
      };

      // Client-side validations
      if (payload.platformFeePercent < 5 || payload.platformFeePercent > 15) {
        toast.error('Platform fee percentage must be between 5.0% and 15.0%.');
        return false;
      }

      if (
        payload.milestoneAutoApprovalDays < 1 ||
        payload.milestoneAutoApprovalDays > 30
      ) {
        toast.error('Milestone auto-approval timeline must be between 1 and 30 days.');
        return false;
      }

      if (
        payload.defaultFreeRevisionLimit < 0 ||
        payload.defaultFreeRevisionLimit > 20
      ) {
        toast.error('Default free revision limit must be between 0 and 20.');
        return false;
      }

      if (
        payload.presignedUrlExpirationMinutes < 5 ||
        payload.presignedUrlExpirationMinutes > 1440
      ) {
        toast.error('Presigned URL expiration must be between 5 and 1440 minutes.');
        return false;
      }

      dispatch({ type: 'UPDATE_POLICY_REQUEST' });

      try {
        const updated = await adminPlatformFeeService.updatePlatformFeePolicy(payload);
        dispatch({ type: 'UPDATE_POLICY_SUCCESS', payload: updated });
        toast.success('Platform Fee & Policy Updated Successfully!');
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(
          error,
          'Failed to update platform fee and policy configuration.'
        );
        dispatch({
          type: 'UPDATE_POLICY_FAILURE',
          payload: errorMsg,
        });
        toast.error(errorMsg);
        return false;
      }
    },
    [state.form.values]
  );

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  return {
    state,
    // Accessors
    policy: state.policy.data,
    formValues: state.form.values,
    isDirty: state.form.isDirty,
    loading: state.policy.loading,
    updating: state.updating,
    error: state.policy.error,
    updateError: state.updateError,
    updateSuccess: state.updateSuccess,
    // Actions
    loadPolicy,
    setFieldValue,
    resetForm,
    clearFeedback,
    savePolicy,
  };
}
