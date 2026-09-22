'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';
import { useGoogleAuth } from '@/features/auth/hooks/use-google-auth';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email address is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the community guidelines' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type VerifyState = 'idle' | 'sending' | 'sent' | 'confirming' | 'verified';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const googleLogin = useGoogleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationTicket, setVerificationTicket] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: true,
    },
  });

  const emailValue = watch('email');

  useEffect(() => {
    if (verifiedEmail && emailValue !== verifiedEmail) {
      setVerifyState('idle');
      setVerificationTicket(null);
      setVerificationCode('');
    }
  }, [emailValue, verifiedEmail]);

  const handleSendCode = async () => {
    if (!emailValue || errors.email) {
      toast.error('Please enter a valid email address first.');
      return;
    }

    setVerifyState('sending');
    try {
      await authService.sendVerificationCode(emailValue);
      setVerifyState('sent');
      setResendCooldown(60);
      toast.success('Verification code sent, please check your inbox.');
    } catch (err) {
      setVerifyState('idle');
      toast.error(err instanceof Error ? err.message : 'Failed to send verification code.');
    }
  };

  const handleConfirmCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }

    setVerifyState('confirming');
    try {
      const result = await authService.confirmVerificationCode(emailValue, verificationCode.trim());
      setVerificationTicket(result.verificationTicket);
      setVerifiedEmail(emailValue);
      setVerifyState('verified');
      toast.success('Email verified!');
    } catch (err) {
      setVerifyState('sent');
      toast.error(err instanceof Error ? err.message : 'Invalid or expired code.');
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (verifyState !== 'verified' || !verificationTicket) {
      toast.error('Please verify your email before registering.');
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
      toast.success(`Account created! Welcome to the collective, ${authResponse.user.fullName}!`);
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || 'Registration failed. Email might already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#1F2335] text-[#e4e1e5] font-body relative overflow-hidden">
      {/* Custom Cursor Glow */}
      <div
        className="fixed w-64 h-64 bg-[#A7ACD9]/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[100] transition-opacity duration-300 hidden md:block"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      {/* Atmospheric Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c2c7f6]/10 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#A7ACD9]/5 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* Main Registration Shell */}
      <main className="w-full max-w-xl z-10">
        {/* Brand Identity Floating Above */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-2 group">
            <Image
              src="/weblogo.png"
              alt="dillustration"
              width={180}
              height={90}
              className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(194,199,246,0.4)] group-hover:scale-105 transition-transform"
            />
          </Link>
          <p className="text-xs text-[#c7c5cf] uppercase tracking-widest font-medium">
            Digital Etherealism Collective
          </p>
        </div>

        {/* Glassmorphic Container */}
        <div className="glass-container rounded-3xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Subtle Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-9xl">grid_view</span>
          </div>

          <div className="relative z-10">
            <h1 className="font-h1 text-3xl font-bold mb-2 text-white">Create Account</h1>
            <p className="text-sm text-[#c7c5cf] mb-8">
              Join the curated gallery of ethereal digital artists.
            </p>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-[#919099] ml-1 font-medium block">
                  Full Name
                </label>
                <input
                  {...register('fullName')}
                  className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
                  placeholder="Claude Monet"
                  type="text"
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-red-400 text-xs ml-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-[#919099] ml-1 font-medium block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">
                    alternate_email
                  </span>
                  <input
                    {...register('email')}
                    className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl pl-12 pr-28 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
                    placeholder="curator@ethereal.art"
                    type="email"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#A7ACD9]/20 px-3 py-1.5 text-xs font-semibold text-[#A7ACD9] hover:bg-[#A7ACD9]/30 transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    {verifyState === 'verified'
                      ? 'Verified'
                      : verifyState === 'sending'
                        ? 'Sending...'
                        : resendCooldown > 0
                          ? `Resend (${resendCooldown}s)`
                          : verifyState === 'sent' || verifyState === 'confirming'
                            ? 'Resend code'
                            : 'Send code'}
                  </button>
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
                )}

                {verifyState === 'verified' ? (
                  <p className="flex items-center gap-1 text-xs text-emerald-400 ml-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Email verified
                  </p>
                ) : (verifyState === 'sent' || verifyState === 'confirming') && (
                  <div className="flex gap-2">
                    <input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm tracking-widest"
                      placeholder="6-digit code"
                      maxLength={6}
                      disabled={verifyState === 'confirming'}
                    />
                    <button
                      type="button"
                      onClick={handleConfirmCode}
                      disabled={verifyState === 'confirming'}
                      className="shrink-0 rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-bold text-[#1F2335] disabled:opacity-60 cursor-pointer"
                    >
                      {verifyState === 'confirming' ? 'Checking...' : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-[#919099] ml-1 font-medium block">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">
                    lock_open
                  </span>
                  <input
                    {...register('password')}
                    className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
                    placeholder="••••••••••••"
                    type="password"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <div className="mt-1">
                  <input
                    {...register('terms')}
                    id="terms"
                    type="checkbox"
                    className="rounded border-white/10 bg-[#0e0e11] text-[#A7ACD9] focus:ring-[#A7ACD9] cursor-pointer"
                  />
                </div>
                <label htmlFor="terms" className="text-xs text-[#c7c5cf] leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <span className="text-[#A7ACD9] underline hover:text-white">
                    Digital Etherealism Guidelines
                  </span>{' '}
                  and community standards for artistic integrity.
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-400 text-xs ml-1">{errors.terms.message}</p>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || verifyState !== 'verified'}
                className="w-full py-4 bg-white text-[#1F2335] font-bold text-base rounded-xl transition-all duration-300 active:scale-95 primary-glow-hover mt-4 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Creating Account...' : 'Begin Journey'}</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </form>

            {/* Social Proof / Footer */}
            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-6">
              <p className="text-sm text-[#c7c5cf]">
                Already part of the collective?{' '}
                <Link href="/login" className="text-[#A7ACD9] hover:underline font-bold">
                  Sign In
                </Link>
              </p>

              <div className="flex items-center gap-4 w-full">
                <div className="h-[1px] flex-grow bg-white/10" />
                <span className="text-[10px] text-[#919099] uppercase tracking-widest">
                  Or continue with
                </span>
                <div className="h-[1px] flex-grow bg-white/10" />
              </div>

              <div className="w-full">
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-[#c7c5cf] hover:text-white cursor-pointer w-full"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-8 flex justify-between items-center px-4 text-xs text-[#919099]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#e3c786] shadow-[0_0_8px_#e3c786]" />
            <span className="uppercase tracking-wider">Gallery Servers Online</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[#A7ACD9]">
              Privacy
            </Link>
            <span>v2.04</span>
          </div>
        </div>
      </main>
    </div>
  );
}
