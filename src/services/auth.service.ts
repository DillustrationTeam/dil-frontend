import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  AuthResponseDto,
  ConfirmVerificationCodeResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserDto,
} from '@/types/auth.types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponseDto> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/login', data);
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to authenticate.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to authenticate.'));
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponseDto> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/register', data);
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to register account.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to register account.'));
    }
  },

  async sendVerificationCode(email: string): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/send-verification-code', { email });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to send verification code.'));
    }
  },

  async confirmVerificationCode(email: string, code: string): Promise<ConfirmVerificationCodeResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ConfirmVerificationCodeResponse>>(
        '/auth/confirm-verification-code',
        { email, code }
      );
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Invalid or expired code.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Invalid or expired code.'));
    }
  },

  async loginWithGoogle(accessToken: string): Promise<AuthResponseDto> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/google', { accessToken });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to authenticate with Google.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to authenticate with Google.'));
    }
  },

  async revokeToken(refreshToken: string): Promise<boolean> {
    try {
      await apiClient.post('/auth/revoke-token', { refreshToken });
      return true;
    } catch {
      return false;
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', data);
      return response.data.data?.message || 'Password reset link sent to your email if registered.';
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to send password reset link.'));
    }
  },

  async resetPassword(data: ResetPasswordRequest): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
      if (response.data.error) {
        throw new Error(response.data.error.detail || 'Password reset failed.');
      }
      return response.data.data?.message || 'Password reset successfully.';
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Password reset failed.'));
    }
  },

  async getCurrentUser(): Promise<{ user: UserDto; roles: string[] }> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: UserDto; roles: string[] }>>('/auth/me');
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Failed to load user profile.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to load user profile.'));
    }
  },
};
