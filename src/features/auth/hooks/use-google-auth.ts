'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';
import { isGoogleRegistrationRequired, isPasswordSetupRequired, isTwoFactorRequired } from '@/types/auth.types';

/**
 * Google sign-in/sign-up dùng chung cho login & register.
 * Backend tìm-hoặc-đăng nhập (find-or-login) cho tài khoản đã tồn tại; nếu đây là tài khoản Google
 * HOÀN TOÀN MỚI, backend CHƯA tạo user — trả về registrationTicket để FE hiện form username + password,
 * tài khoản chỉ thực sự được tạo sau khi form đó hoàn tất (xem onRegistrationRequired). Nếu đây là
 * tài khoản Google CÓ SẴN nhưng chưa có mật khẩu (tạo trước khi tính năng bắt buộc username+password
 * ra đời), backend cũng CHƯA phát token — trả về passwordSetupTicket, chỉ vào được home sau khi hoàn
 * tất form đó (xem onPasswordSetupRequired).
 */
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function useGoogleAuth(
  onTwoFactorRequired?: (email: string, twoFactorTicket: string) => void,
  onRegistrationRequired?: (registrationTicket: string, suggestedEmail: string, suggestedFullName: string | null) => void,
  onPasswordSetupRequired?: (passwordSetupTicket: string, email: string, fullName: string | null) => void
) {
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

        if (isGoogleRegistrationRequired(result)) {
          if (onRegistrationRequired) {
            onRegistrationRequired(result.registrationTicket, result.suggestedEmail, result.suggestedFullName);
          } else {
            toast.error('Vui lòng hoàn tất đăng ký (chọn username + password) ở trang Register.');
          }
          return;
        }

        if (isPasswordSetupRequired(result)) {
          if (onPasswordSetupRequired) {
            onPasswordSetupRequired(result.passwordSetupTicket, result.email, result.fullName);
          } else {
            toast.error('Vui lòng tạo username + password ở trang Login trước khi tiếp tục.');
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
