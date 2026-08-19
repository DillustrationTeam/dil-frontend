'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth - e.pageX * 2) / 100;
      const y = (window.innerHeight - e.pageY * 2) / 100;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const message = await authService.forgotPassword(data);
      toast.success(message);
      setIsSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#1F2335] text-[#e4e1e5] font-body relative overflow-hidden">
      {/* Ambient Background Decorations with Parallax */}
      <div
        className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#c2c7f6]/10 floating-bg-element pointer-events-none transition-transform duration-500"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
        }}
      />
      <div
        className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#565c84]/5 floating-bg-element pointer-events-none transition-transform duration-500"
        style={{
          transform: `translate(${mousePos.x * 1}px, ${mousePos.y * 1}px)`,
        }}
      />

      {/* Brand Header Logo */}
      <header className="fixed top-0 left-0 w-full p-6 flex justify-center md:justify-start z-50">
        <Link href="/">
          <img
            src="/weblogo.png"
            alt="dillustration"
            className="h-14 md:h-16 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </Link>
      </header>

      {/* Main Recovery Canvas */}
      <main className="w-full max-w-[480px] relative z-10">
        {/* Recovery Card */}
        <div className="glass-container rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
          {/* Subtle internal glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#c2c7f6]/5 rounded-full blur-3xl group-hover:bg-[#c2c7f6]/10 transition-colors duration-700 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#c2c7f6]/10 flex items-center justify-center mb-6">
                <span
                  className="material-symbols-outlined text-[#A7ACD9] text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock_reset
                </span>
              </div>
              <h1 className="font-h1 text-3xl font-bold text-white tracking-tight">Recover access</h1>
              <p className="text-sm text-[#c7c5cf]">
                Enter the email associated with your account and we&apos;ll send a magic link to reset your password.
              </p>
            </div>

            {isSubmitted ? (
              <div className="space-y-6 text-center">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-white">
                  <span className="material-symbols-outlined text-4xl text-[#A7ACD9] mb-2 block">
                    check_circle
                  </span>
                  A password recovery link has been sent to your email inbox if registered.
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center space-x-2 text-[#A7ACD9] hover:text-white font-semibold text-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-base">keyboard_backspace</span>
                  <span>Return to sign in</span>
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <label
                    className="text-xs uppercase tracking-widest text-[#919099] pl-1 font-medium block"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      {...register('email')}
                      className="w-full bg-[#1b1b1e]/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:border-[#A7ACD9] focus:bg-[#1b1b1e]/60 text-sm"
                      id="email"
                      placeholder="artist@dillustration.com"
                      type="email"
                      disabled={isLoading}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[#A7ACD9]/50 text-xl">
                        alternate_email
                      </span>
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#dfe0ff] text-[#13183d] font-bold text-base py-4 rounded-xl transition-all duration-300 active:scale-95 periwinkle-glow hover:shadow-[0_0_24px_rgba(167,172,217,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? 'Processing...' : 'Send Link'}</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </form>
            )}

            {/* Footer Links */}
            <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-4">
              <Link
                className="text-xs text-[#c7c5cf] hover:text-[#A7ACD9] transition-colors flex items-center gap-2 font-medium"
                href="/login"
              >
                <span className="material-symbols-outlined text-sm">keyboard_backspace</span>
                <span>Return to sign in</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Support Text */}
        <p className="text-center mt-8 text-xs text-[#c7c5cf]/50">
          Having trouble?{' '}
          <Link href="#" className="text-[#A7ACD9]/70 hover:text-[#A7ACD9] underline transition-all">
            Contact collective support
          </Link>
        </p>
      </main>

      {/* Footer Identity */}
      <footer className="fixed bottom-0 left-0 w-full p-6 hidden md:block z-50">
        <div className="flex justify-between items-center opacity-40 hover:opacity-80 transition-opacity duration-500 text-xs text-[#919099] max-w-7xl mx-auto">
          <span>© 2026 dillustration. Digital Etherealism Art Collective.</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[#A7ACD9]">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#A7ACD9]">
              Guidelines
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
