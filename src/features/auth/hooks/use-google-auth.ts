'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';
import { isTwoFactorRequired } from '@/types/auth.types';

/**
 * Google sign-in/sign-up dùng chung cho login & register.
 * Backend tự tạo/link tài khoản (find-or-create), nên không có luồng "sign up" riêng.
 */
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function useGoogleAuth(onTwoFactorRequired?: (email: string, twoFactorTicket: string) => void) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: { access_token: string }) => {
      try {
        const result = await authService.loginWithGoogle(tokenResponse.access_token);

        if (isTwoFactorRequired(result)) {
          if (onTwoFactorRequired) {
            onTwoFactorRequired(result.email, result.twoFactorTicket);
          } else {
            toast.error('Tài khoản này đã bật 2FA — vui lòng đăng nhập ở trang Login để nhập mã xác minh.');
          }
          return;
        }

        setAuth(result);
        toast.success(`Welcome, ${result.user.fullName}!`);
        router.push('/');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled or failed.');
    },
  });

  return () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In chưa được cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }
    googleLogin();
  };
}
