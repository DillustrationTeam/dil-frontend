'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { securitySettingsService } from '@/features/profile-settings/services/security-settings.service';

export function DangerZoneForm() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmText: false });

  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE' && password.length > 0;

  const fieldErrors = {
    password: touched.password && !password ? 'Vui lòng nhập mật khẩu.' : undefined,
    confirmText: !touched.confirmText
      ? undefined
      : !confirmText.trim()
        ? 'Vui lòng gõ "DELETE" để xác nhận.'
        : confirmText.trim().toUpperCase() !== 'DELETE'
          ? 'Vui lòng gõ chính xác chữ "DELETE".'
          : undefined,
  };

  const markTouched = (field: keyof typeof touched) => setTouched((previous) => ({ ...previous, [field]: true }));

  const closeModal = () => {
    setIsModalOpen(false);
    setPassword('');
    setConfirmText('');
    setTouched({ password: false, confirmText: false });
  };

  const handleDeactivate = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    try {
      await securitySettingsService.deactivateAccount(password);
      toast.success('Tài khoản đã được vô hiệu hóa.');
      clearAuth();
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể vô hiệu hóa tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="glass-container space-y-4 rounded-[32px] border border-red-500/20 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-red-400">Vô hiệu hóa tài khoản</p>
        <p className="text-sm text-[#C7C5CF]">
          Hành động này sẽ vô hiệu hóa tài khoản của bạn và đăng xuất khỏi mọi thiết bị. Không thể thực hiện nếu bạn
          còn đơn commission đang chạy, còn tiền trong ví, hoặc đang có tranh chấp chưa giải quyết.
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
        >
          Vô hiệu hóa tài khoản
        </button>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#1F2335] p-6">
            <p className="text-sm font-bold text-white">Xác nhận vô hiệu hóa tài khoản</p>
            <p className="mt-2 text-xs text-[#C7C5CF]">
              Nhập mật khẩu và gõ chữ <span className="font-bold text-white">DELETE</span> để xác nhận. Hành động
              này không thể tự hoàn tác.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => markTouched('password')}
                  placeholder="Mật khẩu"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none focus:border-red-400 ${
                    fieldErrors.password ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
              </div>
              <div>
                <input
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  onBlur={() => markTouched('confirmText')}
                  placeholder='Gõ "DELETE" để xác nhận'
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none focus:border-red-400 ${
                    fieldErrors.confirmText ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                {fieldErrors.confirmText && <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmText}</p>}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#C7C5CF] transition hover:border-white/30"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={!canConfirm || isSubmitting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
