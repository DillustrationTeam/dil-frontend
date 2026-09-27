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

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const authResponse = await authService.login({
        email: data.email,
        password: data.password,
      });
      setAuth(authResponse);
      toast.success(`Welcome back, ${authResponse.user.fullName}!`);
      router.push('/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
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
                  className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(194,199,246,0.4)] hover:scale-105 transition-transform"
                />
              </Link>
            </div>
            <p className="text-[#C7C5CF] text-base font-body">
              Enter the digital gallery of etherealism.
            </p>
          </header>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Input */}
            <div className="space-y-2">
              <label
                className="text-xs text-[#C7C5CF] uppercase tracking-widest block ml-1 font-medium"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative group periwinkle-glow rounded-xl transition-all duration-300 border border-white/10 bg-white/5">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#919099] text-xl">
                    alternate_email
                  </span>
                </div>
                <input
                  {...register('email')}
                  className="block w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#E4E1E5] focus:outline-none placeholder-white/20 text-base"
                  id="email"
                  placeholder="artist@dillustration.com"
                  type="email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
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
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center space-x-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all active:scale-[0.97] cursor-pointer text-xs font-medium"
            >
              <span className="material-symbols-outlined text-lg">public</span>
              <span>Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center space-x-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all active:scale-[0.97] cursor-pointer text-xs font-medium"
            >
              <span className="material-symbols-outlined text-lg">token</span>
              <span>Web3</span>
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
