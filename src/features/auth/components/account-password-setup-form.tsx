'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { AuthResponseDto } from '@/types/auth.types';

interface AccountPasswordSetupFormProps {
  introText: React.ReactNode;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (username: string, password: string) => Promise<AuthResponseDto>;
  onSuccess: (authResponse: AuthResponseDto) => void;
  onCancel: () => void;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/;

/**
 * Form chọn username + password dùng chung cho 2 luồng:
 * 1. Đăng ký mới qua Google (tài khoản chưa tồn tại) — xem CompleteGoogleRegistrationCommand.
 * 2. Tài khoản Google có sẵn nhưng chưa có mật khẩu (tạo trước khi tính năng này ra đời) —
 *    bị chặn ở đây TRƯỚC KHI vào home, xem CompleteAccountPasswordSetupCommand.
 * Component chỉ lo UI + validate phía client; caller truyền onSubmit để gọi đúng API endpoint.
 */
export function AccountPasswordSetupForm({
  introText,
  submitLabel,
  submittingLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: AccountPasswordSetupFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!USERNAME_PATTERN.test(username)) {
      toast.error('Username must be 3-30 characters: letters, numbers, underscores or dots.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authResponse = await onSubmit(username, password);
      onSuccess(authResponse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete account setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>{introText}</div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-[#919099] ml-1 font-medium block">
          Username
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
          placeholder="your_username"
          type="text"
          autoComplete="username"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-[#919099] ml-1 font-medium block">
          Password
        </label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
          placeholder="••••••••••••"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-[#919099] ml-1 font-medium block">
          Confirm Password
        </label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A7ACD9] focus:ring-1 focus:ring-[#A7ACD9] transition-all text-sm"
          placeholder="••••••••••••"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-white text-[#1F2335] font-bold text-base rounded-xl transition-all duration-300 active:scale-95 primary-glow-hover flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full text-center text-sm text-[#919099] hover:text-white transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
