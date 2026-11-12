'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, History, KeyRound, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { authService } from '@/services/auth.service';
import {
  AUTH_INPUT_CLASS,
  AUTH_INPUT_WRAP_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AuthShell,
} from '@/features/auth/components/auth-shell';

interface EmailFormValues {
  email: string;
}

interface ResetFormValues {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  const emailSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, isEng ? 'Email is required' : 'Vui lòng nhập email')
          .email(isEng ? 'Invalid email address' : 'Email không hợp lệ'),
      }),
    [isEng]
  );

  const resetSchema = useMemo(
    () =>
      z
        .object({
          code: z
            .string()
            .min(1, isEng ? 'Verification code is required' : 'Vui lòng nhập mã xác minh'),
          newPassword: z
            .string()
            .min(6, isEng ? 'Password must be at least 6 characters' : 'Mật khẩu phải có ít nhất 6 ký tự'),
          confirmPassword: z
            .string()
            .min(1, isEng ? 'Please confirm your new password' : 'Vui lòng xác nhận mật khẩu mới'),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: isEng ? 'Passwords do not match' : 'Mật khẩu xác nhận không khớp',
          path: ['confirmPassword'],
        }),
    [isEng]
  );

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const requestCode = async (email: string) => {
    await authService.forgotPassword({ email });
    setSubmittedEmail(email);
    setStep('reset');
    setResendCooldown(60);
  };

  const onSubmitEmail = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      await requestCode(data.email);
      toast.success(
        isEng
          ? 'Verification code sent, please check your inbox.'
          : 'Mã xác minh đã được gửi, vui lòng kiểm tra hộp thư.'
      );
    } catch {
      toast.error(
        isEng
          ? 'Unable to send verification code. Please try again.'
          : 'Không thể gửi mã xác minh. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await requestCode(submittedEmail);
      toast.success(isEng ? 'Verification code resent.' : 'Đã gửi lại mã xác minh.');
    } catch {
      toast.error(
        isEng ? 'Unable to resend code. Please try again.' : 'Không thể gửi lại mã. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetFormValues) => {
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: submittedEmail,
        code: data.code.trim(),
        newPassword: data.newPassword,
      });
      toast.success(
        isEng
          ? 'Password changed successfully! Please sign in again.'
          : 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.'
      );
      router.push('/login');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEng
            ? 'Unable to reset password. Please try again.'
            : 'Không thể đổi mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/15 text-[#A7ACD9]">
        <History className="h-5 w-5" aria-hidden />
      </div>

      {step === 'email' ? (
        <>
          <h1 className="font-h1 text-2xl font-bold text-white sm:text-3xl">
            {isEng ? 'Recover Access' : 'Khôi phục truy cập'}
          </h1>
          <p className="mt-1.5 mb-7 text-sm leading-relaxed text-[#C7C5CF]">
            {isEng
              ? 'Enter your registered email and we will send a 6-digit verification code to reset your password.'
              : 'Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác minh gồm 6 số để bạn đặt lại mật khẩu.'}
          </p>

          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-5">
            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="recover-email">
                {isEng ? 'Email Address' : 'Địa chỉ Email'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Mail className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                <input
                  {...emailForm.register('email')}
                  id="recover-email"
                  type="email"
                  placeholder="name@example.com"
                  className={`${AUTH_INPUT_CLASS} px-3.5`}
                  disabled={isLoading}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-xs text-red-400">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className={AUTH_PRIMARY_BTN_CLASS}>
              <span>
                {isLoading
                  ? isEng
                    ? 'Sending...'
                    : 'Đang gửi...'
                  : isEng
                    ? 'Send Verification Code'
                    : 'Gửi mã xác minh'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>

            <div className="pt-1 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#919099] transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                <span>{isEng ? 'Return to sign in' : 'Quay lại đăng nhập'}</span>
              </Link>
            </div>
          </form>
        </>
      ) : (
        <>
          <h1 className="font-h1 text-2xl font-bold text-white sm:text-3xl">
            {isEng ? 'Enter Verification Code' : 'Nhập mã xác minh'}
          </h1>
          <p className="mt-1.5 mb-7 text-sm leading-relaxed text-[#C7C5CF]">
            {isEng ? (
              <>
                We sent a 6-digit code to <span className="font-medium text-white">{submittedEmail}</span>. It expires in 10 minutes.
              </>
            ) : (
              <>
                Chúng tôi đã gửi mã 6 số tới <span className="font-medium text-white">{submittedEmail}</span>. Mã có hiệu lực trong 10 phút.
              </>
            )}
          </p>

          <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-5">
            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="reset-code">
                {isEng ? 'Verification Code' : 'Mã xác minh'}
              </label>
              <div className="flex gap-2">
                <div className={`${AUTH_INPUT_WRAP_CLASS} flex-1`}>
                  <KeyRound className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                  <input
                    {...resetForm.register('code')}
                    id="reset-code"
                    type="text"
                    maxLength={6}
                    placeholder={isEng ? '6-digit code' : 'Mã 6 chữ số'}
                    className={`${AUTH_INPUT_CLASS} px-3.5 tracking-widest`}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading || resendCooldown > 0}
                  className="h-12 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-[#A7ACD9] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {resendCooldown > 0
                    ? isEng
                      ? `Resend (${resendCooldown}s)`
                      : `Gửi lại (${resendCooldown}s)`
                    : isEng
                      ? 'Resend code'
                      : 'Gửi lại mã'}
                </button>
              </div>
              {resetForm.formState.errors.code && (
                <p className="text-xs text-red-400">{resetForm.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="new-password">
                {isEng ? 'New Password' : 'Mật khẩu mới'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Lock className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                <input
                  {...resetForm.register('newPassword')}
                  id="new-password"
                  type="password"
                  placeholder="••••••••••••"
                  className={`${AUTH_INPUT_CLASS} px-3.5`}
                  disabled={isLoading}
                />
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-red-400">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={AUTH_LABEL_CLASS} htmlFor="confirm-password">
                {isEng ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}
              </label>
              <div className={AUTH_INPUT_WRAP_CLASS}>
                <Lock className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
                <input
                  {...resetForm.register('confirmPassword')}
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••••••"
                  className={`${AUTH_INPUT_CLASS} px-3.5`}
                  disabled={isLoading}
                />
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-400">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className={AUTH_PRIMARY_BTN_CLASS}>
              <span>
                {isLoading
                  ? isEng
                    ? 'Processing...'
                    : 'Đang xử lý...'
                  : isEng
                    ? 'Reset Password'
                    : 'Đặt lại mật khẩu'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#919099] transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                <span>{isEng ? 'Use another email' : 'Đổi email khác'}</span>
              </button>
            </div>
          </form>
        </>
      )}

      <div className="mt-7 border-t border-white/10 pt-5 text-center text-xs text-[#919099]">
        {isEng ? 'Having trouble?' : 'Gặp sự cố?'}{' '}
        <Link href="/guide#guide-faq" className="text-[#A7ACD9] hover:underline">
          {isEng ? 'Contact platform support' : 'Liên hệ hỗ trợ nền tảng'}
        </Link>
      </div>
    </AuthShell>
  );
}
