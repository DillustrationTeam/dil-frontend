'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
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

interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  terms: boolean;
}

type VerifyState = 'idle' | 'sending' | 'sent' | 'confirming' | 'verified';

export default function RegisterPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const setAuth = useAuthStore((state) => state.setAuth);

  const registerSchema = useMemo(
    () =>
      z.object({
        fullName: z
          .string()
          .min(2, isEng ? 'Full name must be at least 2 characters' : 'Họ tên phải có ít nhất 2 ký tự'),
        email: z
          .string()
          .min(1, isEng ? 'Email address is required' : 'Vui lòng nhập địa chỉ email')
          .email(isEng ? 'Invalid email address' : 'Địa chỉ email không hợp lệ'),
        password: z
          .string()
          .min(6, isEng ? 'Password must be at least 6 characters' : 'Mật khẩu phải có ít nhất 6 ký tự'),
        terms: z.boolean().refine((val) => val === true, {
          message: isEng
            ? 'Please read and agree to the Platform Guidelines & Personal Data Protection Policy'
            : 'Vui lòng đọc và đồng ý với Quy chế nền tảng & Chính sách bảo vệ dữ liệu cá nhân',
        }),
      }),
    [isEng]
  );

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
    undefined,
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

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationTicket, setVerificationTicket] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
  });

  const emailValue = useWatch({ control, name: 'email' });
  const emailRegistration = register('email');
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void emailRegistration.onChange(event);
    if (verifiedEmail && event.target.value !== verifiedEmail) {
      setVerifyState('idle');
      setVerificationTicket(null);
      setVerificationCode('');
    }
  };

  const handleSendCode = async () => {
    if (!emailValue || errors.email) {
      toast.error(
        isEng ? 'Please enter a valid email address first.' : 'Vui lòng nhập email hợp lệ trước.'
      );
      return;
    }

    setVerifyState('sending');
    try {
      await authService.sendVerificationCode(emailValue);
      setVerifyState('sent');
      setResendCooldown(60);
      toast.success(
        isEng
          ? 'Verification code sent, please check your inbox.'
          : 'Đã gửi mã xác minh, vui lòng kiểm tra hộp thư.'
      );
    } catch (err) {
      setVerifyState('idle');
      toast.error(
        err instanceof Error
          ? err.message
          : isEng
            ? 'Failed to send verification code.'
            : 'Gửi mã xác minh thất bại.'
      );
    }
  };

  const handleConfirmCode = async () => {
    if (!verificationCode.trim()) {
      toast.error(isEng ? 'Please enter the verification code.' : 'Vui lòng nhập mã xác minh.');
      return;
    }

    setVerifyState('confirming');
    try {
      const result = await authService.confirmVerificationCode(emailValue, verificationCode.trim());
      setVerificationTicket(result.verificationTicket);
      setVerifiedEmail(emailValue);
      setVerifyState('verified');
      toast.success(isEng ? 'Email verified!' : 'Xác thực email thành công!');
    } catch (err) {
      setVerifyState('sent');
      toast.error(
        err instanceof Error
          ? err.message
          : isEng
            ? 'Invalid or expired code.'
            : 'Mã xác minh không đúng hoặc đã hết hạn.'
      );
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (verifyState !== 'verified' || !verificationTicket) {
      toast.error(
        isEng
          ? 'Please verify your email before registering.'
          : 'Vui lòng xác thực email trước khi đăng ký.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const authResponse = await authService.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        verificationTicket,
      });
      setAuth(authResponse);
      toast.success(
        isEng
          ? `Account created! Welcome, ${authResponse.user.fullName}!`
          : `Đã tạo tài khoản! Chào mừng ${authResponse.user.fullName}!`
      );
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(
        errorObj.message ||
          (isEng
            ? 'Registration failed. Email might already be registered.'
            : 'Đăng ký thất bại. Email có thể đã được sử dụng.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {passwordSetup ? (
        <AccountPasswordSetupForm
          introText={
            <>
              <p className="text-sm text-[#C7C5CF]">
                {isEng ? 'Welcome back' : 'Chào mừng trở lại'}
                {passwordSetup.fullName ? `, ${passwordSetup.fullName}` : ''}!{' '}
                {isEng ? 'Signed in as' : 'Đăng nhập với'}{' '}
                <span className="font-medium text-white">{passwordSetup.email}</span>.
              </p>
              <p className="mt-2 text-sm text-[#C7C5CF]">
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
              <p className="text-sm text-[#C7C5CF]">
                {isEng ? 'Welcome' : 'Chào mừng'}
                {googleRegistration.fullName ? `, ${googleRegistration.fullName}` : ''}!{' '}
                {isEng ? 'Signed in with Google as' : 'Đăng nhập Google bằng'}{' '}
                <span className="font-medium text-white">{googleRegistration.email}</span>.
              </p>
              <p className="mt-2 text-sm text-[#C7C5CF]">
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
      ) : (
        <>
          <header className="mb-7">
            <h1 className="font-h1 text-2xl font-bold text-white sm:text-3xl">
              {isEng ? 'Create Account' : 'Tạo tài khoản'}
            </h1>
            <p className="mt-1.5 text-sm text-[#C7C5CF]">
              {isEng
                ? 'Join DILLUSTRATION to commission artists, join auctions, and trade art.'
                : 'Tham gia DILLUSTRATION để đặt vẽ tranh, đấu giá và giao lưu tác phẩm.'}
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="fullName">
                {isEng ? 'Full Name' : 'Họ và tên'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <User className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                <input
                  {...register('fullName')}
                  id="fullName"
                  className={`${AUTH_INPUT_CLASS} px-3.5`}
                  placeholder={isEng ? 'Enter your full name' : 'Nhập họ và tên của bạn'}
                  type="text"
                  autoComplete="name"
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
            </div>

            {/* Email Address + OTP verification */}
            <div className="space-y-2">
              <label className={AUTH_LABEL_CLASS} htmlFor="email">
                {isEng ? 'Email Address' : 'Địa chỉ Email'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Mail className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                <input
                  {...emailRegistration}
                  id="email"
                  onChange={handleEmailChange}
                  className={`${AUTH_INPUT_CLASS} pl-3.5 pr-28`}
                  placeholder="name@example.com"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={
                    isLoading ||
                    verifyState === 'sending' ||
                    verifyState === 'verified' ||
                    !emailValue ||
                    !!errors.email ||
                    resendCooldown > 0
                  }
                  className="absolute right-2 cursor-pointer rounded-lg border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 px-3 py-1.5 text-xs font-semibold text-[#c2c7f6] transition-colors hover:bg-[#A7ACD9]/25 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {verifyState === 'verified'
                    ? isEng
                      ? 'Verified'
                      : 'Đã xác thực'
                    : verifyState === 'sending'
                      ? isEng
                        ? 'Sending...'
                        : 'Đang gửi...'
                      : resendCooldown > 0
                        ? isEng
                          ? `Resend (${resendCooldown}s)`
                          : `Gửi lại (${resendCooldown}s)`
                        : verifyState === 'sent' || verifyState === 'confirming'
                          ? isEng
                            ? 'Resend code'
                            : 'Gửi lại mã'
                          : isEng
                            ? 'Send code'
                            : 'Gửi mã'}
                </button>
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}

              {verifyState === 'verified' ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {isEng ? 'Email verified' : 'Email đã được xác thực'}
                </p>
              ) : (
                (verifyState === 'sent' || verifyState === 'confirming') && (
                  <div className="flex gap-2">
                    <input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#141724]/90 px-4 text-sm tracking-widest text-[#E4E1E5] placeholder:text-[#919099] focus:border-[#A7ACD9] focus:outline-none focus:ring-1 focus:ring-[#A7ACD9]"
                      placeholder={isEng ? '6-digit code' : 'Mã 6 chữ số'}
                      maxLength={6}
                      disabled={verifyState === 'confirming'}
                    />
                    <button
                      type="button"
                      onClick={handleConfirmCode}
                      disabled={verifyState === 'confirming'}
                      className="h-11 shrink-0 cursor-pointer rounded-xl bg-[#A7ACD9] px-4 text-xs font-bold text-[#1F2335] transition-colors hover:bg-[#c2c7f6] disabled:opacity-60"
                    >
                      {verifyState === 'confirming'
                        ? isEng
                          ? 'Checking...'
                          : 'Đang kiểm tra...'
                        : isEng
                          ? 'Confirm'
                          : 'Xác nhận'}
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="password">
                {isEng ? 'Password' : 'Mật khẩu'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Lock className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                <input
                  {...register('password')}
                  id="password"
                  className={`${AUTH_INPUT_CLASS} pl-3.5 pr-11`}
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 cursor-pointer text-[#919099] transition-colors hover:text-white"
                  aria-label={isEng ? 'Toggle password visibility' : 'Hiện/ẩn mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* PDPL & Platform Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <input
                {...register('terms')}
                id="terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/15 bg-[#141724] text-[#A7ACD9] focus:ring-[#A7ACD9]"
              />
              <label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#C7C5CF]">
                {isEng ? (
                  <>
                    I agree to the{' '}
                    <Link href="/guide" className="text-[#A7ACD9] underline hover:text-white">
                      Platform Guidelines
                    </Link>{' '}
                    and the processing of account information under the{' '}
                    <Link href="/privacy" className="text-[#A7ACD9] underline hover:text-white">
                      Personal Data Protection Policy
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Tôi đồng ý với{' '}
                    <Link href="/guide" className="text-[#A7ACD9] underline hover:text-white">
                      Quy chế nền tảng
                    </Link>{' '}
                    và việc xử lý thông tin tài khoản theo{' '}
                    <Link href="/privacy" className="text-[#A7ACD9] underline hover:text-white">
                      Chính sách bảo vệ dữ liệu cá nhân
                    </Link>
                    .
                  </>
                )}
              </label>
            </div>
            {errors.terms && <p className="text-xs text-red-400">{errors.terms.message}</p>}

            <button
              type="submit"
              disabled={isLoading || verifyState !== 'verified'}
              className={AUTH_PRIMARY_BTN_CLASS}
            >
              <span>
                {isLoading
                  ? isEng
                    ? 'Creating Account...'
                    : 'Đang tạo tài khoản...'
                  : isEng
                    ? 'Create Account'
                    : 'Đăng ký tài khoản'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <div className="mt-7 space-y-5 border-t border-white/10 pt-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-widest text-[#919099]">
                {isEng ? 'Or continue with' : 'Hoặc tiếp tục với'}
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <GoogleAuthButton onClick={() => googleLogin()} />

            <p className="text-center text-xs text-[#C7C5CF]">
              {isEng ? 'Already have an account?' : 'Đã có tài khoản?'}{' '}
              <Link href="/login" className="font-bold text-[#A7ACD9] transition-colors hover:text-white hover:underline">
                {isEng ? 'Sign In' : 'Đăng nhập'}
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthShell>
  );
}
