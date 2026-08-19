'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/use-auth-store';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email address is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the community guidelines' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: true,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const authResponse = await authService.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      setAuth(authResponse);
      toast.success(`Account created! Welcome to the collective, ${authResponse.user.fullName}!`);
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Email might already be registered.');
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
            <img
              src="/weblogo.png"
              alt="dillustration"
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
                    className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
                    placeholder="curator@ethereal.art"
                    type="email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
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
                disabled={isLoading}
                className="w-full py-4 bg-white text-[#1F2335] font-bold text-base rounded-xl transition-all duration-300 active:scale-95 primary-glow-hover mt-4 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
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

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-[#c7c5cf] hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                  <span>Wallet</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-[#c7c5cf] hover:text-[#A7ACD9] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">fingerprint</span>
                  <span>Passkey</span>
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
