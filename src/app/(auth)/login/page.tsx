'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Info, KeyRound, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/context/language-context';
import { useAuthStore } from '@/store/use-auth-store';
import { useGoogleAuth } from '@/features/auth/hooks/use-google-auth';
import { AccountPasswordSetupForm } from '@/features/auth/components/account-password-setup-form';
import {
  AUTH_INPUT_CLASS,
  AUTH_INPUT_WRAP_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AuthShell,
  GoogleAuthButton,
} from '@/features/auth/components/auth-shell';
import {
  isGoogleRegistrationRequired,
  isPasswordSetupRequired,
  isTwoFactorRequired,
} from '@/types/auth.types';

interface LoginFormValues {
  emailOrUsername: string;
  password: string;
  remember?: boolean;
}

/**
 * Tài khoản seed, dùng cho khối "Test mode (development only)".
 *
 * Danh sách này phải khớp dữ liệu seed thật của backend — thiếu một role nghĩa là
 * không ai đăng nhập được role đó khi demo. Ba role đang dùng: client / creator / admin.
 */
const seedAccounts = [
  { label: 'Client', email: 'client.demo@dillustration.test', password: 'Demo@123456' },
  { label: 'Creator', email: 'creator.demo@dillustration.test', password: 'Demo@123456' },
  { label: 'Admin', email: 'admin.demo@dillustration.local', password: 'Seed123!' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginSchema = useMemo(
    () =>
      z.object({
        emailOrUsername: z
          .string()
          .min(1, isEng ? 'Email or username is required' : 'Vui lòng nhập email hoặc tên đăng nhập'),
        password: z.string().min(1, isEng ? 'Password is required' : 'Vui lòng nhập mật khẩu'),
        remember: z.boolean().optional(),
      }),
    [isEng]
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorTicket, setTwoFactorTicket] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [googleRegistration, setGoogleRegistration] = useState<{
    ticket: string;
    email: string;
    fullName: string | null;
  } | null>(null);
  const [passwordSetup, setPasswordSetup] = useState<{
    ticket: string;
    email: string;
    fullName: string | null;
  } | null>(null);

  const googleLogin = useGoogleAuth(
    (email, ticket) => {
      setPendingEmail(email);
      setTwoFactorTicket(ticket);
    },
    (registrationTicket, suggestedEmail, suggestedFullName) => {
      setGoogleRegistration({
        ticket: registrationTicket,
        email: suggestedEmail,
        fullName: suggestedFullName,
      });
    },
    (passwordSetupTicket, email, fullName) => {
      setPasswordSetup({ ticket: passwordSetupTicket, email, fullName });
    }
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const fillSeedAccount = (account: (typeof seedAccounts)[number]) => {
    setValue('emailOrUsername', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await authService.login({
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      });

      if (isTwoFactorRequired(result)) {
        setTwoFactorTicket(result.twoFactorTicket);
        setPendingEmail(result.email);
        return;
      }

      if (isGoogleRegistrationRequired(result) || isPasswordSetupRequired(result)) {
        toast.error(
          isEng
            ? 'Unexpected response from server. Please try again.'
            : 'Phản hồi không hợp lệ từ máy chủ. Vui lòng thử lại.'
        );
        return;
      }

      setAuth(result);
      toast.success(
        isEng ? `Welcome back, ${result.user.fullName}!` : `Chào mừng trở lại, ${result.user.fullName}!`
      );
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(
        errorObj.message ||
          (isEng
            ? 'Login failed. Please check your credentials.'
            : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorTicket) return;
    if (!twoFactorCode.trim()) {
      toast.error(isEng ? 'Please enter the verification code.' : 'Vui lòng nhập mã xác minh.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authService.verifyTwoFactorLogin({
        email: pendingEmail,
        twoFactorTicket,
        code: twoFactorCode.trim(),
      });

      if (isPasswordSetupRequired(result)) {
        setPasswordSetup({
          ticket: result.passwordSetupTicket,
          email: result.email,
          fullName: result.fullName,
        });
        setTwoFactorTicket(null);
        setTwoFactorCode('');
        return;
      }

      setAuth(result);
      toast.success(
        isEng ? `Welcome back, ${result.user.fullName}!` : `Chào mừng trở lại, ${result.user.fullName}!`
      );
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(
        errorObj.message || (isEng ? 'Invalid verification code.' : 'Mã xác minh không hợp lệ.')
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelTwoFactor = () => {
    setTwoFactorTicket(null);
    setPendingEmail('');
    setTwoFactorCode('');
  };

  return (
    <AuthShell>
      {passwordSetup ? (
        <AccountPasswordSetupForm
          introText={
            <>
              <p className="text-sm text-[#6E6459]">
                {isEng ? 'Welcome back' : 'Chào mừng trở lại'}
                {passwordSetup.fullName ? `, ${passwordSetup.fullName}` : ''}!{' '}
                {isEng ? 'Signed in as' : 'Đăng nhập với'}{' '}
                <span className="font-medium text-[#241F1A]">{passwordSetup.email}</span>.
              </p>
              <p className="mt-2 text-sm text-[#6E6459]">
                {isEng
                  ? "This account doesn't have a username and password yet — set them now before continuing."
                  : 'Tài khoản này chưa có tên đăng nhập và mật khẩu — hãy thiết lập ngay trước khi tiếp tục.'}
              </p>
            </>
          }
          submitLabel={isEng ? 'Finish & Continue' : 'Hoàn tất & Tiếp tục'}
          submittingLabel={isEng ? 'Saving...' : 'Đang lưu...'}
          onSubmit={(username, password) =>
            authService.completeAccountPasswordSetup({
              email: passwordSetup.email,
              setupTicket: passwordSetup.ticket,
              username,
              password,
            })
          }
          onSuccess={(authResponse) => {
            setAuth(authResponse);
            setPasswordSetup(null);
            toast.success(
              isEng
                ? `Welcome back, ${authResponse.user.fullName}!`
                : `Chào mừng trở lại, ${authResponse.user.fullName}!`
            );
            router.push('/');
          }}
          onCancel={() => setPasswordSetup(null)}
        />
      ) : googleRegistration ? (
        <AccountPasswordSetupForm
          introText={
            <>
              <p className="text-sm text-[#6E6459]">
                {isEng ? 'Welcome' : 'Chào mừng'}
                {googleRegistration.fullName ? `, ${googleRegistration.fullName}` : ''}!{' '}
                {isEng ? 'Signed in with Google as' : 'Đăng nhập Google bằng'}{' '}
                <span className="font-medium text-[#241F1A]">{googleRegistration.email}</span>.
              </p>
              <p className="mt-2 text-sm text-[#6E6459]">
                {isEng
                  ? "Google accounts don't come with a password here — choose a username and password to finish creating your account."
                  : 'Tài khoản Google cần thiết lập tên đăng nhập và mật khẩu để hoàn tất tạo tài khoản.'}
              </p>
            </>
          }
          submitLabel={isEng ? 'Finish Creating Account' : 'Hoàn tất tạo tài khoản'}
          submittingLabel={isEng ? 'Creating Account...' : 'Đang tạo tài khoản...'}
          onSubmit={(username, password) =>
            authService.completeGoogleRegistration({
              registrationTicket: googleRegistration.ticket,
              username,
              password,
            })
          }
          onSuccess={(authResponse) => {
            setAuth(authResponse);
            setGoogleRegistration(null);
            toast.success(
              isEng
                ? `Account created! Welcome, ${authResponse.user.fullName}!`
                : `Đã tạo tài khoản! Chào mừng ${authResponse.user.fullName}!`
            );
            router.push('/');
          }}
          onCancel={() => setGoogleRegistration(null)}
        />
      ) : !twoFactorTicket ? (
        <>
          <header className="mb-6">
            <h1 className="font-h1 text-[clamp(1.85rem,3vw,2.4rem)] font-normal leading-[1.1] text-[#241F1A]">
              {isEng ? 'Sign In' : 'Đăng nhập'}
            </h1>
            <p className="mt-2 text-[0.9375rem] text-[#6E6459]">
              {isEng
                ? 'Welcome back to the DILLUSTRATION digital art gallery.'
                : 'Chào mừng bạn quay lại phòng trưng bày và giao dịch tranh số.'}
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email / Username */}
            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="emailOrUsername">
                {isEng ? 'Email or Username' : 'Email hoặc Tên đăng nhập'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Mail className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#746A5F]" aria-hidden />
                <input
                  {...register('emailOrUsername')}
                  className={`${AUTH_INPUT_CLASS} px-3.5 !h-11`}
                  id="emailOrUsername"
                  placeholder={isEng ? 'name@example.com or username' : 'name@example.com hoặc tên đăng nhập'}
                  type="text"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              {errors.emailOrUsername && (
                <p className="text-xs text-[#A8321C]">{errors.emailOrUsername.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={AUTH_LABEL_CLASS} htmlFor="password">
                  {isEng ? 'Password' : 'Mật khẩu'}
                </label>
                <Link
                  className="text-xs font-medium text-[#B24A26] transition-colors hover:text-[#241F1A]"
                  href="/forgot-password"
                >
                  {isEng ? 'Forgot Password?' : 'Quên mật khẩu?'}
                </Link>
              </div>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Lock className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#746A5F]" aria-hidden />
                <input
                  {...register('password')}
                  className={`${AUTH_INPUT_CLASS} !h-11 pl-3.5 pr-11`}
                  id="password"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  className="absolute right-3.5 cursor-pointer text-[#746A5F] transition-colors hover:text-[#241F1A]"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={isEng ? 'Toggle password visibility' : 'Hiện/ẩn mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#A8321C]">{errors.password.message}</p>}
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                {...register('remember')}
                className="h-5 w-5 cursor-pointer appearance-none rounded-[6px] border border-[#221E1A]/20 bg-[#FFFCF6] checked:border-[#B24A26] checked:bg-[#B24A26] focus:ring-2 focus:ring-[#B24A26]/30"
                id="remember"
                type="checkbox"
              />
              <label className="cursor-pointer select-none text-[0.875rem] text-[#6E6459]" htmlFor="remember">
                {isEng ? 'Keep me signed in' : 'Ghi nhớ đăng nhập'}
              </label>
            </div>

            <button className={AUTH_PRIMARY_BTN_CLASS} type="submit" disabled={isLoading}>
              <span>
                {isLoading ? (isEng ? 'Signing in...' : 'Đang xác thực...') : isEng ? 'Sign In' : 'Đăng nhập'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <div className="mt-6 space-y-4 border-t border-[#221E1A]/10 pt-5">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#F0E7D8]" />
              <span className="text-[0.75rem] uppercase tracking-[0.10em] text-[#746A5F]">
                {isEng ? 'Or continue with' : 'Hoặc tiếp tục với'}
              </span>
              <div className="h-px flex-1 bg-[#F0E7D8]" />
            </div>

            <GoogleAuthButton onClick={() => googleLogin()} />

            <p className="text-center text-[0.9375rem] text-[#6E6459]">
              {isEng ? 'New to DILLUSTRATION?' : 'Chưa có tài khoản?'}{' '}
              <Link className="font-bold text-[#B24A26] transition-colors hover:text-[#241F1A] hover:underline" href="/register">
                {isEng ? 'Create an account' : 'Đăng ký ngay'}
              </Link>
            </p>

            {/* Dev-only: bấm vào mới xổ ra, điền nhanh tài khoản seed theo role */}
            {process.env.NODE_ENV !== 'production' && (
              <details className="rounded-[10px] border border-dashed border-[#221E1A]/22 px-3.5 py-3 text-[0.8125rem] text-[#5D554B] [&[open]_summary]:mb-3 [&[open]_summary]:text-[#241F1A]">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-[#635B51] transition-colors hover:text-[#241F1A] [&::-webkit-details-marker]:hidden">
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {isEng ? 'Test mode (development only)' : 'Chế độ test (chỉ môi trường dev)'}
                </summary>
                <div className="flex flex-wrap gap-2">
                  {seedAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillSeedAccount(account)}
                      className="min-h-9 min-w-[5rem] flex-1 cursor-pointer rounded-[10px] border border-[#221E1A]/22 px-2 text-[0.8125rem] font-medium text-[#241F1A] transition-colors hover:border-[#B24A26] hover:bg-[#B24A26]/10 hover:text-[#8C3718]"
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#B24A26]/30 bg-[#B24A26]/15 text-[#B24A26]">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-h1 text-lg font-bold text-[#241F1A]">
                {isEng ? 'Two-Factor Verification' : 'Xác thực hai lớp (2FA)'}
              </h2>
              <p className="text-xs text-[#746A5F]">{pendingEmail}</p>
            </div>
          </div>

          <p className="text-sm text-[#6E6459]">
            {isEng
              ? 'Enter the 6-digit code from your authenticator app or a recovery code (XXXXX-XXXXX).'
              : 'Nhập mã 6 chữ số từ ứng dụng xác thực hoặc mã khôi phục (định dạng XXXXX-XXXXX).'}
          </p>

          <div className={AUTH_INPUT_WRAP_CLASS}>
            <input
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
              maxLength={11}
              className={`${AUTH_INPUT_CLASS} px-4 text-center text-lg tracking-widest`}
              placeholder="••••••"
              disabled={isVerifying}
            />
          </div>

          <button
            type="button"
            onClick={handleVerifyTwoFactor}
            disabled={isVerifying}
            className={AUTH_PRIMARY_BTN_CLASS}
          >
            {isVerifying
              ? isEng
                ? 'Verifying...'
                : 'Đang xác minh...'
              : isEng
                ? 'Verify & Continue'
                : 'Xác minh & Tiếp tục'}
          </button>

          <button
            type="button"
            onClick={handleCancelTwoFactor}
            className="w-full cursor-pointer text-center text-xs font-medium text-[#746A5F] transition-colors hover:text-[#241F1A]"
          >
            {isEng ? 'Back to sign in' : 'Quay lại đăng nhập'}
          </button>
        </div>
      )}
    </AuthShell>
  );
}
