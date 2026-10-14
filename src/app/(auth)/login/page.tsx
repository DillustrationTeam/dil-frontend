'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';
import { useGoogleAuth } from '@/features/auth/hooks/use-google-auth';
import { isTwoFactorRequired } from '@/types/auth.types';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const seedAccounts = [
  { label: 'Client', email: 'client.demo@dillustration.test', password: 'Demo@123456' },
  { label: 'Creator', email: 'creator.demo@dillustration.test', password: 'Demo@123456' },
  { label: 'Admin', email: 'admin.demo@dillustration.local', password: 'Seed123!' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorTicket, setTwoFactorTicket] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const googleLogin = useGoogleAuth((email, ticket) => {
    setPendingEmail(email);
    setTwoFactorTicket(ticket);
  });

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

      setAuth(result);
      toast.success(`Welcome back, ${result.user.fullName}!`);
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorTicket) {
      return;
    }
    if (!twoFactorCode.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      const authResponse = await authService.verifyTwoFactorLogin({
        email: pendingEmail,
        twoFactorTicket,
        code: twoFactorCode.trim(),
      });
      setAuth(authResponse);
      toast.success(`Welcome back, ${authResponse.user.fullName}!`);
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || 'Invalid verification code.');
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
    <main className="min-h-screen w-full flex items-center justify-center relative px-6 py-12 overflow-hidden bg-[#1F2335]">
      {/* Ambient Decorative Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#A7ACD9] floating-bg animate-pulse" />
      <div
        className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#c2c7f6] floating-bg"
        style={{ animationDelay: '2s' }}
      />
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="watermark text-[20rem] absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rotate-12">
          dill
        </div>
        <div className="watermark text-[20rem] absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 -rotate-12">
          art
        </div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-lg z-10">
        <div className="glass-container rounded-[32px] p-8 md:p-12 relative overflow-hidden">
          {/* Logo Section */}
          <header className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <Link href="/">
                <Image
                  src="/studiologo.png"
                  alt="dillustration"
                  width={220}
                  height={112}
                  priority
                  style={{ width: 'auto' }}
                  className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(194,199,246,0.4)] hover:scale-105 transition-transform"
                />
              </Link>
            </div>
            <p className="text-[#C7C5CF] text-base font-body">
              Enter the digital gallery of etherealism.
            </p>
          </header>

          {!twoFactorTicket ? (
            <>
          {/* Dev-only: điền nhanh tài khoản seed theo role */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mb-8 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#919099] text-center">
                Dev quick login
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {seedAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillSeedAccount(account)}
                    className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-[#A7ACD9] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Input */}
            <div className="space-y-2">
              <label
                className="text-xs text-[#C7C5CF] uppercase tracking-widest block ml-1 font-medium"
                htmlFor="emailOrUsername"
              >
                Email or Username
              </label>
              <div className="relative group periwinkle-glow rounded-xl transition-all duration-300 border border-white/10 bg-white/5">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#919099] text-xl">
                    alternate_email
                  </span>
                </div>
                <input
                  {...register('emailOrUsername')}
                  className="block w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#E4E1E5] focus:outline-none placeholder-white/20 text-base"
                  id="emailOrUsername"
                  placeholder="artist@dillustration.com or username"
                  type="text"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              {errors.emailOrUsername && (
                <p className="text-red-400 text-xs ml-1">{errors.emailOrUsername.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  className="text-xs text-[#C7C5CF] uppercase tracking-widest block font-medium"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  className="text-xs text-[#A7ACD9] hover:text-white transition-colors duration-200"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group periwinkle-glow rounded-xl transition-all duration-300 border border-white/10 bg-white/5">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#919099] text-xl">lock</span>
                </div>
                <input
                  {...register('password')}
                  className="block w-full bg-transparent border-none py-4 pl-12 pr-12 text-[#E4E1E5] focus:outline-none placeholder-white/20 text-base"
                  id="password"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button
                    className="text-[#919099] hover:text-white transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Keep me signed in Checkbox */}
            <div className="flex items-center space-x-2 px-1">
              <input
                {...register('remember')}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#A7ACD9] focus:ring-[#A7ACD9] focus:ring-offset-0 cursor-pointer"
                id="remember"
                type="checkbox"
              />
              <label
                className="text-sm text-[#C7C5CF] cursor-pointer select-none"
                htmlFor="remember"
              >
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-white text-[#1F2335] font-semibold text-lg py-4 rounded-xl transition-all duration-300 active:scale-[0.98] primary-glow flex items-center justify-center space-x-3 group cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Authenticating...' : 'Enter Gallery'}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-[#1F2335]/80 px-4 text-[#919099] backdrop-blur-sm">
                Or Curate via
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => googleLogin()}
              className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-[#C7C5CF] hover:text-white cursor-pointer w-full"
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

          {/* Footer Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-[#C7C5CF]">
              New to the collective?
              <Link
                className="text-white font-bold hover:text-[#A7ACD9] transition-colors ml-1"
                href="/register"
              >
                Register Now
              </Link>
            </p>
          </div>
            </>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-[#C7C5CF]">
                Enter the 6-digit code from your authenticator app for{' '}
                <span className="text-white font-medium">{pendingEmail}</span>.
              </p>
              <input
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                maxLength={11}
                className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-lg tracking-widest text-[#E4E1E5] placeholder-white/20 focus:border-[#A7ACD9] focus:outline-none"
                placeholder="••••••"
                disabled={isVerifying}
              />
              <p className="text-center text-xs text-[#919099]">
                Or enter one of your recovery codes (format XXXXX-XXXXX).
              </p>
              <button
                type="button"
                onClick={handleVerifyTwoFactor}
                disabled={isVerifying}
                className="w-full bg-white text-[#1F2335] font-semibold text-lg py-4 rounded-xl transition-all duration-300 active:scale-[0.98] primary-glow disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={handleCancelTwoFactor}
                className="w-full text-center text-sm text-[#919099] hover:text-white transition-colors"
              >
                Back to login
              </button>
            </div>
          )}
        </div>

        {/* Decorative Artwork Snippet */}
        <div className="mt-8 flex justify-between items-center opacity-60 px-2">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-[#A7ACD9] flex items-center justify-center text-[#1F2335] font-bold text-xs">
              EV
            </div>
            <div>
              <p className="text-[10px] uppercase text-[#919099] tracking-wider font-semibold">
                Featured Curator
              </p>
              <p className="text-xs text-white font-medium">Ethereal_Visions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#A7ACD9] animate-ping" />
            <p className="text-[10px] uppercase text-[#A7ACD9] tracking-wider font-semibold">
              1.2k Artists Online
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
