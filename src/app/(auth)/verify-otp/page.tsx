'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { AUTH_LABEL_CLASS, AUTH_PRIMARY_BTN_CLASS, AuthShell } from '@/features/auth/components/auth-shell';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const emailParam = new URLSearchParams(window.location.search).get('email');
    if (emailParam) setTargetEmail(emailParam);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    toast.success(
      isEng
        ? 'A new 6-digit verification code has been sent to your email.'
        : 'Đã gửi mã xác minh 6 chữ số mới tới email của bạn.'
    );
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      toast.error(
        isEng ? 'Please enter the complete 6-digit OTP code.' : 'Vui lòng nhập đủ mã OTP 6 chữ số.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(
        isEng
          ? 'Email verified successfully!'
          : 'Xác minh email thành công!'
      );
      router.push('/');
    } catch {
      toast.error(isEng ? 'Invalid OTP code. Please try again.' : 'Mã OTP không hợp lệ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <header className="mb-7">
        <h1 className="font-h1 text-2xl font-bold text-white sm:text-3xl">
          {isEng ? 'Verify Your Email' : 'Xác minh Email'}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#C7C5CF]">
          {isEng ? (
            <>
              Enter the 6-digit verification code sent to{' '}
              <span className="font-medium text-[#A7ACD9]">
                {targetEmail ?? 'your registered email'}
              </span>
              .
            </>
          ) : (
            <>
              Nhập mã xác minh 6 chữ số đã gửi tới{' '}
              <span className="font-medium text-[#A7ACD9]">
                {targetEmail ?? 'email đã đăng ký của bạn'}
              </span>
              .
            </>
          )}
        </p>
      </header>

      <form onSubmit={handleVerify} className="space-y-5">
        <div className="space-y-2">
          <label className={AUTH_LABEL_CLASS}>
            {isEng ? 'Verification Code (6 digits)' : 'Mã xác minh (6 số)'}
          </label>

          <div className="grid grid-cols-6 gap-2.5 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="•"
                className="h-13 w-full rounded-xl border border-white/10 bg-[#141724]/90 text-center font-h1 text-xl font-bold text-white placeholder:text-[#919099] transition-all focus:border-[#A7ACD9] focus:outline-none focus:ring-1 focus:ring-[#A7ACD9]"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#C7C5CF]">
          <span>{isEng ? "Didn't receive the code?" : 'Chưa nhận được mã?'}</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className={`font-semibold transition-colors ${
              canResend ? 'cursor-pointer text-[#A7ACD9] hover:underline' : 'cursor-not-allowed text-[#919099]'
            }`}
          >
            {canResend
              ? isEng
                ? 'Resend Code'
                : 'Gửi lại mã'
              : isEng
                ? `Resend in ${timer}s`
                : `Gửi lại sau ${timer}s`}
          </button>
        </div>

        <button type="submit" disabled={isLoading} className={AUTH_PRIMARY_BTN_CLASS}>
          <span>
            {isLoading
              ? isEng
                ? 'Verifying...'
                : 'Đang xác minh...'
              : isEng
                ? 'Verify & Continue'
                : 'Xác minh & Tiếp tục'}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="mt-7 border-t border-white/10 pt-5 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C7C5CF] transition-colors hover:text-[#A7ACD9]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          <span>
            {isEng ? 'Wrong email address? Sign up again' : 'Sai địa chỉ email? Đăng ký lại'}
          </span>
        </Link>
      </div>
    </AuthShell>
  );
}
