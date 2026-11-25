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
      toast.success('Tài khoản đã được xóa.');
      clearAuth();
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="glass-container space-y-4 rounded-[32px] border border-[#A8321C]/30 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-[#A8321C]">Xóa tài khoản</p>
        <p className="text-sm text-[#6E6459]">
          Hành động này sẽ xóa vĩnh viễn tài khoản của bạn và đăng xuất khỏi mọi thiết bị. Email đăng nhập sẽ được
          giải phóng để bạn có thể đăng ký lại sau này. Không thể thực hiện nếu bạn còn đơn commission đang chạy,
          còn tiền trong ví, hoặc đang có tranh chấp chưa giải quyết.
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border border-[#A8321C]/40 px-4 py-2.5 text-sm font-semibold text-[#A8321C] transition hover:bg-[#A8321C]/10"
        > Xóa tài khoản </button>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#E5D8C2] p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#A8321C]/30 bg-[#F7F2E9] p-6">
            <p className="text-sm font-bold text-[#241F1A]">Xác nhận xóa tài khoản</p>
            <p className="mt-2 text-xs text-[#6E6459]"> Nhập mật khẩu và gõ chữ <span className="font-bold text-[#241F1A]">DELETE</span> để xác nhận. Hành động
 này không thể hoàn tác. </p>

            <div className="mt-4 space-y-3">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => markTouched('password')}
                  placeholder="Mật khẩu"
                  className={`w-full rounded-xl border bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#A8321C]/30 ${
                    fieldErrors.password ? 'border-[#A8321C]/30' : 'border-[#221E1A]/10'
                  }`}
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-[#A8321C]">{fieldErrors.password}</p>}
              </div>
              <div>
                <input
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  onBlur={() => markTouched('confirmText')}
                  placeholder='Gõ "DELETE" để xác nhận'
                  className={`w-full rounded-xl border bg-[#FFFCF6] px-4 py-3 text-[#241F1A] outline-none focus:border-[#A8321C]/30 ${
                    fieldErrors.confirmText ? 'border-[#A8321C]/30' : 'border-[#221E1A]/10'
                  }`}
                />
                {fieldErrors.confirmText && <p className="mt-1 text-xs text-[#A8321C]">{fieldErrors.confirmText}</p>}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#221E1A]/10 px-4 py-2 text-sm text-[#6E6459] transition hover:border-[#221E1A]/20"
              > Hủy </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={!canConfirm || isSubmitting}
                className="rounded-xl bg-[#A8321C]/12 px-4 py-2 text-sm font-bold text-[#241F1A] transition hover:bg-[#A8321C]/10 disabled:cursor-not-allowed disabled:opacity-50"
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
