'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

const resetSchema = z
  .object({
    code: z.string().min(1, 'Verification code is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      toast.success('Mã xác minh đã được gửi, vui lòng kiểm tra hộp thư.');
    } catch {
      toast.error('Không thể gửi mã xác minh. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await requestCode(submittedEmail);
      toast.success('Đã gửi lại mã xác minh.');
    } catch {
      toast.error('Không thể gửi lại mã. Vui lòng thử lại.');
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
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-6 md:p-8 bg-[#1F2335] text-[#e4e1e5] font-body relative overflow-hidden">
      {/* Ambient Atmospheric Glows */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] bg-[#A7ACD9]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#C6AC6D]/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/studiologo.png" alt="dillustration" width={160} height={40} className="h-10 w-auto object-contain" />
        </Link>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <div className="glass-container rounded-[28px] p-8 md:p-10 relative overflow-hidden">
          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/70">
            <span className="material-symbols-outlined text-2xl">history</span>
          </div>

          <div className="relative z-10">
            {step === 'email' ? (
              <>
                <h1 className="font-h1 text-3xl font-bold text-white mb-2">Recover access</h1>
                <p className="text-sm text-[#78767A] mb-8 leading-relaxed">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác minh gồm 6 số để bạn đặt lại mật khẩu.
                </p>

                <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.12em] text-[#78767A] font-semibold block">
                      EMAIL ADDRESS
                    </label>
                    <div className="input-field rounded-xl flex items-center px-4 py-3.5 text-white bg-[#0e0e11]/50 border border-[#78767A]/30">
                      <input
                        {...emailForm.register('email')}
                        type="email"
                        placeholder="artist@dillustration.com"
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-[#78767A]"
                        disabled={isLoading}
                      />
                    </div>
                    {emailForm.formState.errors.email && (
                      <p className="text-red-400 text-xs ml-1">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#A7ACD9] hover:bg-white text-[#161826] font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Đang gửi...' : 'Gửi mã xác minh'}</span>
                    <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>

                  <div className="text-center pt-2">
                    <Link href="/login" className="text-xs font-semibold text-[#78767A] hover:text-white transition-colors">
                      ← Return to sign in
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h1 className="font-h1 text-3xl font-bold text-white mb-2">Nhập mã xác minh</h1>
                <p className="text-sm text-[#78767A] mb-8 leading-relaxed">
                  Chúng tôi đã gửi mã 6 số tới <span className="text-white">{submittedEmail}</span>. Mã có hiệu lực
                  trong 10 phút. Nhập mã cùng mật khẩu mới bên dưới.
                </p>

                <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.12em] text-[#78767A] font-semibold block">
                      MÃ XÁC MINH
                    </label>
                    <div className="flex gap-2">
                      <div className="input-field flex-1 rounded-xl flex items-center px-4 py-3.5 text-white bg-[#0e0e11]/50 border border-[#78767A]/30">
                        <input
                          {...resetForm.register('code')}
                          type="text"
                          maxLength={6}
                          placeholder="6-digit code"
                          className="w-full bg-transparent text-sm text-white tracking-widest focus:outline-none placeholder-[#78767A]"
                          disabled={isLoading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading || resendCooldown > 0}
                        className="shrink-0 rounded-xl border border-[#78767A]/30 px-4 text-xs font-semibold text-[#A7ACD9] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại mã'}
                      </button>
                    </div>
                    {resetForm.formState.errors.code && (
                      <p className="text-red-400 text-xs ml-1">{resetForm.formState.errors.code.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.12em] text-[#78767A] font-semibold block">
                      MẬT KHẨU MỚI
                    </label>
                    <div className="input-field rounded-xl flex items-center px-4 py-3.5 text-white bg-[#0e0e11]/50 border border-[#78767A]/30">
                      <input
                        {...resetForm.register('newPassword')}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-[#78767A]"
                        disabled={isLoading}
                      />
                    </div>
                    {resetForm.formState.errors.newPassword && (
                      <p className="text-red-400 text-xs ml-1">{resetForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.12em] text-[#78767A] font-semibold block">
                      XÁC NHẬN MẬT KHẨU MỚI
                    </label>
                    <div className="input-field rounded-xl flex items-center px-4 py-3.5 text-white bg-[#0e0e11]/50 border border-[#78767A]/30">
                      <input
                        {...resetForm.register('confirmPassword')}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-[#78767A]"
                        disabled={isLoading}
                      />
                    </div>
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-xs ml-1">{resetForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#A7ACD9] hover:bg-white text-[#161826] font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</span>
                    <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-xs font-semibold text-[#78767A] hover:text-white transition-colors"
                    >
                      ← Đổi email khác
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-[#78767A]">
            Having trouble? <a href="#" className="text-[#A7ACD9] hover:underline">Contact collective support</a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex justify-between items-center text-xs text-[#78767A] z-10 pt-4">
        <div>© 2026 dillustration. Digital Etherealism Art Collective.</div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white">Privacy</Link>
          <Link href="#" className="hover:text-white">Guidelines</Link>
        </div>
      </footer>
    </div>
  );
}
