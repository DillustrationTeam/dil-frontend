import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { getApiErrorMessage } from '@/lib/api-error';
import { UserDto } from '@/types/auth.types';
import { LinkedAccountsDto, SessionDto } from '@/features/profile-settings/types/security-settings.types';

export const securitySettingsService = {
  async requestEmailChangeReauth(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/change-email/request-reauth');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể gửi mã xác thực.'));
    }
  },

  async requestChangeEmail(
    newEmail: string,
    currentPassword?: string,
    twoFactorCode?: string,
    reauthCode?: string
  ): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/change-email/request', {
        newEmail,
        currentPassword,
        twoFactorCode,
        reauthCode,
      });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể gửi mã xác minh.'));
    }
  },

  async confirmChangeEmail(newEmail: string, code: string, currentSessionId: string | null): Promise<UserDto> {
    try {
      const response = await apiClient.post<ApiResponse<UserDto>>('/auth/me/change-email/confirm', {
        newEmail,
        code,
        currentSessionId,
      });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Không thể xác nhận đổi email.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể xác nhận đổi email.'));
    }
  },

  async requestChangePasswordOtp(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/change-password/request-otp');
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể gửi mã xác minh.'));
    }
  },

  async changePassword(
    currentPassword: string | undefined,
    newPassword: string,
    code: string,
    currentSessionId: string | null
  ): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/change-password', {
        currentPassword,
        newPassword,
        code,
        currentSessionId,
      });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    }
  },

  async linkGoogleAccount(accessToken: string): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/linked-accounts/google', { accessToken });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể liên kết tài khoản Google.'));
    }
  },

  async getLinkedAccounts(): Promise<LinkedAccountsDto> {
    try {
      const response = await apiClient.get<ApiResponse<LinkedAccountsDto>>('/auth/me/linked-accounts');
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Không thể tải thông tin liên kết.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải thông tin liên kết.'));
    }
  },

  async unlinkAccount(provider: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<{ message: string }>>(`/auth/me/linked-accounts/${provider}`);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể gỡ liên kết.'));
    }
  },

  async getSessions(currentSessionId: string | null): Promise<SessionDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<SessionDto[]>>('/auth/me/sessions', {
        params: currentSessionId ? { currentSessionId } : undefined,
      });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Không thể tải danh sách phiên.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải danh sách phiên.'));
    }
  },

  async revokeSession(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<{ message: string }>>(`/auth/me/sessions/${id}`);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể đăng xuất thiết bị này.'));
    }
  },

  async revokeOtherSessions(currentSessionId: string | null): Promise<number> {
    try {
      const response = await apiClient.delete<ApiResponse<{ revokedCount: number }>>('/auth/me/sessions', {
        params: currentSessionId ? { currentSessionId } : undefined,
      });
      return response.data.data?.revokedCount ?? 0;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể đăng xuất các thiết bị khác.'));
    }
  },

  async deactivateAccount(password: string): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/deactivate', { password });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể vô hiệu hóa tài khoản.'));
    }
  },

  async get2FAStatus(): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ enabled: boolean }>>('/auth/me/2fa/status');
      return response.data.data?.enabled ?? false;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tải trạng thái 2FA.'));
    }
  },

  async setup2FA(): Promise<{ sharedKey: string; authenticatorUri: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ sharedKey: string; authenticatorUri: string }>>(
        '/auth/me/2fa/setup'
      );
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Không thể bắt đầu thiết lập 2FA.');
      }
      return response.data.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể bắt đầu thiết lập 2FA.'));
    }
  },

  async verifyAndEnable2FA(code: string): Promise<string[]> {
    try {
      const response = await apiClient.post<ApiResponse<{ recoveryCodes: string[] }>>('/auth/me/2fa/enable', {
        code,
      });
      if (response.data.error || !response.data.data) {
        throw new Error(response.data.error?.detail || 'Mã xác minh không đúng.');
      }
      return response.data.data.recoveryCodes;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Mã xác minh không đúng.'));
    }
  },

  async disable2FA(password: string): Promise<void> {
    try {
      await apiClient.post<ApiResponse<{ message: string }>>('/auth/me/2fa/disable', { password });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Không thể tắt 2FA.'));
    }
  },
};
