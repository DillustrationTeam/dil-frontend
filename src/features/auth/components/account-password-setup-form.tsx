'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { AuthResponseDto } from '@/types/auth.types';
import { AUTH_INPUT_CLASS, AUTH_INPUT_WRAP_CLASS, AUTH_LABEL_CLASS, AUTH_PRIMARY_BTN_CLASS } from './auth-shell';

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
 * 2. Tài khoản Google có sẵn nhưng chưa có mật khẩu — bắt buộc thiết lập trước khi vào hệ thống.
 */
export function AccountPasswordSetupForm({
  introText,
  submitLabel,
  submittingLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: AccountPasswordSetupFormProps) {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!USERNAME_PATTERN.test(username)) {
      toast.error(
        isEng
          ? 'Username must be 3-30 characters: letters, numbers, underscores or dots.'
          : 'Tên đăng nhập phải từ 3–30 ký tự: chữ, số, dấu gạch dưới hoặc dấu chấm.'
      );
      return;
    }
    if (password.length < 6) {
      toast.error(
        isEng ? 'Password must be at least 6 characters long.' : 'Mật khẩu phải có ít nhất 6 ký tự.'
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isEng ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authResponse = await onSubmit(username, password);
      onSuccess(authResponse);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEng
            ? 'Failed to complete account setup.'
            : 'Không thể hoàn tất thiết lập tài khoản.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>{introText}</div>

      <div className="space-y-1.5">
        <label className={AUTH_LABEL_CLASS}>{isEng ? 'Username' : 'Tên đăng nhập'}</label>
        <div className={AUTH_INPUT_WRAP_CLASS}>
          <User className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`${AUTH_INPUT_CLASS} px-3.5`}
            placeholder={isEng ? 'your_username' : 'ten_dang_nhap'}
            type="text"
            autoComplete="username"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={AUTH_LABEL_CLASS}>{isEng ? 'Password' : 'Mật khẩu'}</label>
        <div className={AUTH_INPUT_WRAP_CLASS}>
          <Lock className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${AUTH_INPUT_CLASS} pl-3.5 pr-11`}
            placeholder="••••••••••••"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 text-[#919099] transition-colors hover:text-white"
            aria-label={isEng ? 'Toggle password visibility' : 'Hiện/ẩn mật khẩu'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={AUTH_LABEL_CLASS}>{isEng ? 'Confirm Password' : 'Xác nhận mật khẩu'}</label>
        <div className={AUTH_INPUT_WRAP_CLASS}>
          <Lock className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#919099]" aria-hidden />
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${AUTH_INPUT_CLASS} px-3.5`}
            placeholder="••••••••••••"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className={AUTH_PRIMARY_BTN_CLASS}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full cursor-pointer text-center text-xs font-medium text-[#919099] transition-colors hover:text-white"
      >
        {isEng ? 'Cancel' : 'Hủy'}
      </button>
    </form>
  );
}
