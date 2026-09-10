'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast.success('Reset link dispatched! Please check your email inbox.');
    } catch {
      toast.error('Failed to send reset link. Please try again.');
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
          <Image src="/weblogo.png" alt="dillustration" width={160} height={40} className="h-10 w-auto object-contain" />
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
            <h1 className="font-h1 text-3xl font-bold text-white mb-2">Recover access</h1>
            <p className="text-sm text-[#78767A] mb-8 leading-relaxed">
              Enter the email associated with your account and we&apos;ll send a magic link to reset your password.
            </p>

            {isSubmitted ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#A7ACD9]/10 border border-[#A7ACD9]/30 text-xs text-[#A7ACD9] leading-relaxed">
                  If this email is registered in our system, a password reset link has been sent. Please check your inbox.
                </div>
                <Link
                  href="/login"
                  className="w-full py-4 bg-white text-[#161826] font-bold text-base rounded-xl flex items-center justify-center gap-2"
                >
                  <span>Return to Sign In</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.12em] text-[#78767A] font-semibold block">
                    EMAIL ADDRESS
                  </label>
                  <div className="input-field rounded-xl flex items-center px-4 py-3.5 text-white bg-[#0e0e11]/50 border border-[#78767A]/30">
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="artist@dillustration.com"
                      className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-[#78767A]"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#A7ACD9] hover:bg-white text-[#161826] font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? 'Sending...' : 'Send Link'}</span>
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
