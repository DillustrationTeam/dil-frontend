import {
  DEFAULT_PLATFORM_FEE_POLICY,
  PlatformFeePolicyDto,
  UpdatePlatformFeePolicyRequest,
} from '@/features/admin/types/platform-fee.types';

export interface PlatformFeeState {
  policy: {
    data: PlatformFeePolicyDto | null;
    loading: boolean;
    error: string | null;
  };
  form: {
    values: UpdatePlatformFeePolicyRequest;
    isDirty: boolean;
  };
  updating: boolean;
  updateError: string | null;
  updateSuccess: boolean;
}

export const initialPlatformFeeState: PlatformFeeState = {
  policy: {
    data: null,
    loading: false,
    error: null,
  },
  form: {
    values: DEFAULT_PLATFORM_FEE_POLICY,
    isDirty: false,
  },
  updating: false,
  updateError: null,
  updateSuccess: false,
};

export type PlatformFeeAction =
  | { type: 'GET_POLICY_REQUEST' }
  | { type: 'GET_POLICY_SUCCESS'; payload: PlatformFeePolicyDto }
  | { type: 'GET_POLICY_FAILURE'; payload: string }
  | { type: 'UPDATE_POLICY_REQUEST' }
  | { type: 'UPDATE_POLICY_SUCCESS'; payload: PlatformFeePolicyDto }
  | { type: 'UPDATE_POLICY_FAILURE'; payload: string }
  | {
      type: 'SET_FORM_FIELD';
      payload: { field: keyof UpdatePlatformFeePolicyRequest; value: number };
    }
  | { type: 'RESET_FORM' }
  | { type: 'CLEAR_FEEDBACK' };

export function platformFeeReducer(
  state: PlatformFeeState,
  action: PlatformFeeAction
): PlatformFeeState {
  switch (action.type) {
    case 'GET_POLICY_REQUEST':
      return {
        ...state,
        policy: {
          ...state.policy,
          loading: true,
          error: null,
        },
      };

    case 'GET_POLICY_SUCCESS': {
      const { platformFeePercent, milestoneAutoApprovalDays, defaultFreeRevisionLimit, presignedUrlExpirationMinutes } = action.payload;
      return {
        ...state,
        policy: {
          data: action.payload,
          loading: false,
          error: null,
        },
        form: {
          values: {
            platformFeePercent,
            milestoneAutoApprovalDays,
            defaultFreeRevisionLimit,
            presignedUrlExpirationMinutes,
          },
          isDirty: false,
        },
      };
    }

    case 'GET_POLICY_FAILURE':
      return {
        ...state,
        policy: {
          ...state.policy,
          loading: false,
          error: action.payload,
        },
      };

    case 'UPDATE_POLICY_REQUEST':
      return {
        ...state,
        updating: true,
        updateError: null,
        updateSuccess: false,
      };

    case 'UPDATE_POLICY_SUCCESS': {
      const { platformFeePercent, milestoneAutoApprovalDays, defaultFreeRevisionLimit, presignedUrlExpirationMinutes } = action.payload;
      return {
        ...state,
        policy: {
          ...state.policy,
          data: action.payload,
        },
        form: {
          values: {
            platformFeePercent,
            milestoneAutoApprovalDays,
            defaultFreeRevisionLimit,
            presignedUrlExpirationMinutes,
          },
          isDirty: false,
        },
        updating: false,
        updateError: null,
        updateSuccess: true,
      };
    }

    case 'UPDATE_POLICY_FAILURE':
      return {
        ...state,
        updating: false,
        updateError: action.payload,
        updateSuccess: false,
      };

    case 'SET_FORM_FIELD':
      return {
        ...state,
        form: {
          values: {
            ...state.form.values,
            [action.payload.field]: action.payload.value,
          },
          isDirty: true,
        },
        updateSuccess: false,
        updateError: null,
      };

    case 'RESET_FORM': {
      const source = state.policy.data ?? DEFAULT_PLATFORM_FEE_POLICY;
      return {
        ...state,
        form: {
          values: {
            platformFeePercent: source.platformFeePercent,
            milestoneAutoApprovalDays: source.milestoneAutoApprovalDays,
            defaultFreeRevisionLimit: source.defaultFreeRevisionLimit,
            presignedUrlExpirationMinutes: source.presignedUrlExpirationMinutes,
          },
          isDirty: false,
        },
        updateError: null,
        updateSuccess: false,
      };
    }

    case 'CLEAR_FEEDBACK':
      return {
        ...state,
        updateError: null,
        updateSuccess: false,
      };

    default:
      return state;
  }
}
