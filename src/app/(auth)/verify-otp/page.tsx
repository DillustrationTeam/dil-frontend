'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['8', '4', '9', '2', '7', '1']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
    toast.success('A new 6-digit verification code has been sent to your email.');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      toast.error('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success('Email verified successfully! Welcome to the collective.');
      router.push('/');
    } catch {
      toast.error('Invalid OTP code. Please try again.');
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

      {/* Main Verification Shell */}
      <main className="w-full max-w-xl z-10">
        {/* Brand Identity Floating Above */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-2 group">
            <Image
              src="/weblogo.png"
              alt="dillustration"
              width={180}
              height={90}
            <img
              src="/weblogo.png"
              alt="dillustration"
              className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(194,199,246,0.4)] group-hover:scale-105 transition-transform"
            />
          </Link>
          <p className="text-[11px] text-[#7B819F] uppercase tracking-[0.2em] font-medium">
            Digital Etherealism Collective
          </p>
        </div>

        {/* Glassmorphic Container */}
        <div className="glass-container rounded-[28px] p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Subtle Grid Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
            <span className="material-symbols-outlined text-9xl">grid_view</span>
          </div>

          <div className="relative z-10">
            <h1 className="font-h1 text-3xl font-bold mb-2 text-white">Verify Your Email</h1>
            <p className="text-sm text-[#9EA4C1] mb-8 leading-relaxed">
              We have sent a 6-digit verification code to{' '}
              <span className="text-[#A7ACD9] font-medium">curator@ethereal.art</span>. Please enter the code below.
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Label */}
              <label className="text-[11px] uppercase tracking-[0.12em] text-[#7B819F] ml-1 font-semibold block">
                VERIFICATION CODE (6-DIGITS)
              </label>

              {/* 6 OTP Inputs Grid */}
              <div className="grid grid-cols-6 gap-2.5 md:gap-3.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-full h-14 md:h-16 text-center text-xl md:text-2xl font-bold font-h1 bg-[#0e0e11]/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* Resend Code Section */}
              <div className="flex items-center justify-between text-xs text-[#9EA4C1] pt-2">
                <span>Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend}
                  className={`font-semibold transition-colors ${
                    canResend
                      ? 'text-[#A7ACD9] hover:underline cursor-pointer'
                      : 'text-[#7B819F] cursor-not-allowed'
                  }`}
                >
                  {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-[#171A27] font-bold text-base rounded-xl transition-all duration-300 active:scale-95 primary-glow-hover mt-4 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </form>

            {/* Footer Divider */}
            <div className="mt-10 pt-8 border-t border-white/[0.08] flex flex-col items-center gap-4">
              <Link href="/register" className="text-sm text-[#9EA4C1] hover:text-[#A7ACD9] transition-colors">
                ← Wrong email address? Sign up again
              </Link>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-8 flex justify-between items-center px-4 text-xs text-[#7B819F]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#E3C786] shadow-[0_0_8px_#E3C786]" />
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
