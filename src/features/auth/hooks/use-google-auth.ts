'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';

/**
 * Google sign-in/sign-up dùng chung cho login & register.
 * Backend tự tạo/link tài khoản (find-or-create), nên không có luồng "sign up" riêng.
 */
export function useGoogleAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const authResponse = await authService.loginWithGoogle(tokenResponse.access_token);
        setAuth(authResponse);
        toast.success(`Welcome, ${authResponse.user.fullName}!`);
        router.push('/');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled or failed.');
    },
  });
}
