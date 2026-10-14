import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  AuthResponseDto,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserDto,
} from '@/types/auth.types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponseDto> {
    const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/login', { emailOrUsername: data.email, password: data.password });
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to authenticate.');
    }
    return response.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponseDto> {
    const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/register', data);
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to register account.');
    }
    return response.data.data;
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
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', data);
    return response.data.data?.message || 'Password reset link sent to your email if registered.';
  },

  async resetPassword(data: ResetPasswordRequest): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    if (response.data.error) {
      throw new Error(response.data.error.details?.join(', ') || 'Password reset failed.');
    }
    return response.data.data?.message || 'Password reset successfully.';
  },

  async getCurrentUser(): Promise<{ user: UserDto; roles: string[] }> {
    const response = await apiClient.get<ApiResponse<{ user: UserDto; roles: string[] }>>('/auth/me');
    if (response.data.error || !response.data.data) {
      throw new Error(response.data.error?.details?.join(', ') || 'Failed to load user profile.');
    }
    return response.data.data;
  },
};
