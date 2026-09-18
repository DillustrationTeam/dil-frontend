'use client';

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-white text-[#1F2335] font-semibold hover:bg-[#A7ACD9] primary-glow',
  secondary:
    'bg-[#A7ACD9] text-[#1F2335] font-semibold hover:shadow-[0_0_15px_rgba(167,172,217,0.4)]',
  ghost:
    'border border-white/10 bg-white/5 text-[#E4E1E5] hover:bg-white/10 hover:border-[#A7ACD9]/40',
};

export function Button({
  children,
  onClick,
  disabled,
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
