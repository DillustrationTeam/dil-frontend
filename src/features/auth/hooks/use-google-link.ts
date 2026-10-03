'use client';

import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { securitySettingsService } from '@/features/profile-settings/services/security-settings.service';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/**
 * Liên kết tài khoản Google vào tài khoản ĐANG đăng nhập (khác với useGoogleAuth dùng cho đăng nhập/đăng ký).
 */
export function useGoogleLink(onLinked: () => void) {
  const googleLink = useGoogleLogin({
    onSuccess: async (tokenResponse: { access_token: string }) => {
      try {
        await securitySettingsService.linkGoogleAccount(tokenResponse.access_token);
        toast.success('Đã liên kết tài khoản Google.');
        onLinked();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không thể liên kết tài khoản Google.');
      }
    },
    onError: () => {
      toast.error('Liên kết Google bị hủy hoặc thất bại.');
    },
  });

  return () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In chưa được cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }
    googleLink();
  };
}
