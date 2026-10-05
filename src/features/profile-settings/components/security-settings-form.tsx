'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Laptop, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';
import { securitySettingsService } from '@/features/profile-settings/services/security-settings.service';
import { clientProfileService } from '@/features/marketplace/services/client-profile.service';
import { LinkedAccountsDto, SessionDto } from '@/features/profile-settings/types/security-settings.types';
import { useGoogleLink } from '@/features/auth/hooks/use-google-link';
import { TwoFactorSettingsForm } from '@/features/profile-settings/components/two-factor-settings-form';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

export function SecuritySettingsForm() {
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const sessionId = useAuthStore((state) => state.sessionId);
  const setUser = useAuthStore((state) => state.setUser);
  const { lang } = useLanguage();

  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountsDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [isUsernameSubmitting, setIsUsernameSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState('');
  const [usernamePasswordTouched, setUsernamePasswordTouched] = useState(false);

  const usernameError = !usernameTouched
    ? undefined
    : !username.trim()
      ? 'Vui lòng nhập username.'
      : !USERNAME_REGEX.test(username.trim())
        ? 'Username chỉ gồm chữ, số, "." và "_", từ 3-30 ký tự.'
        : undefined;

  // Chỉ bắt xác thực mật khẩu khi THỰC SỰ đổi sang username khác (không áp dụng lúc đặt lần đầu) —
  // và chỉ với tài khoản có mật khẩu (tài khoản chỉ đăng nhập Google không có gì để xác thực).
  const isActualUsernameChange =
    Boolean(originalUsername) && username.trim().toLowerCase() !== (originalUsername ?? '').toLowerCase();
  const requiresPasswordForUsername = isActualUsernameChange && Boolean(linkedAccounts?.hasPassword);
  const usernamePasswordError =
    requiresPasswordForUsername && usernamePasswordTouched && !currentPasswordForUsername
      ? 'Vui lòng nhập mật khẩu hiện tại để xác nhận đổi username.'
      : undefined;

  useEffect(() => {
    const trimmed = username.trim();
    const canCheck = Boolean(trimmed) && USERNAME_REGEX.test(trimmed);

    const timer = setTimeout(() => {
      if (!canCheck) {
        setUsernameAvailable(null);
        setIsCheckingUsername(false);
        return;
      }

      setIsCheckingUsername(true);
      clientProfileService
        .checkUsernameAvailability(trimmed)
        .then(setUsernameAvailable)
        .finally(() => setIsCheckingUsername(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSaveUsername = async () => {
    setUsernameTouched(true);
    setUsernamePasswordTouched(true);
    if (!username.trim() || !USERNAME_REGEX.test(username.trim())) {
      return;
    }

    if (requiresPasswordForUsername && !currentPasswordForUsername) {
      return;
    }

    setIsUsernameSubmitting(true);
    try {
      const updated = await clientProfileService.updateMyProfile({
        username: username.trim(),
        currentPassword: requiresPasswordForUsername ? currentPasswordForUsername : undefined,
      });
      toast.success('Đã lưu username.');
      setUsername(updated.username ?? '');
      setOriginalUsername(updated.username ?? null);
      setCurrentPasswordForUsername('');
      setUsernamePasswordTouched(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu username.');
    } finally {
      setIsUsernameSubmitting(false);
    }
  };

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailStep, setEmailStep] = useState<'idle' | 'reauth' | 'code'>('idle');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [twoFactorCodeForEmail, setTwoFactorCodeForEmail] = useState('');
  const [reauthCode, setReauthCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailTouched, setEmailTouched] = useState({ newEmail: false, code: false });

  const emailErrors = {
    newEmail: !emailTouched.newEmail
      ? undefined
      : !newEmail.trim()
        ? 'Vui lòng nhập email mới.'
        : !EMAIL_REGEX.test(newEmail.trim())
          ? 'Email không đúng định dạng.'
          : undefined,
    code: !emailTouched.code
      ? undefined
      : !emailCode.trim()
        ? 'Vui lòng nhập mã xác minh.'
        : emailCode.trim().length !== 6
          ? 'Mã xác minh phải gồm 6 số.'
          : undefined,
  };

  const markEmailTouched = (field: keyof typeof emailTouched) =>
    setEmailTouched((previous) => ({ ...previous, [field]: true }));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStep, setPasswordStep] = useState<'idle' | 'code'>('idle');
  const [passwordOtpCode, setPasswordOtpCode] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordOtpTouched, setPasswordOtpTouched] = useState(false);

  const passwordOtpError = !passwordOtpTouched
    ? undefined
    : !passwordOtpCode.trim()
      ? 'Vui lòng nhập mã xác minh.'
      : passwordOtpCode.trim().length !== 6
        ? 'Mã xác minh phải gồm 6 số.'
        : undefined;

  const passwordErrors = {
    currentPassword:
      passwordTouched.currentPassword && linkedAccounts?.hasPassword && !currentPassword
        ? 'Vui lòng nhập mật khẩu hiện tại.'
        : undefined,
    newPassword: !passwordTouched.newPassword
      ? undefined
      : !newPassword
        ? 'Vui lòng nhập mật khẩu mới.'
        : newPassword.length < 6
          ? 'Mật khẩu mới phải từ 6 ký tự.'
          : undefined,
    confirmPassword: !passwordTouched.confirmPassword
      ? undefined
      : !confirmPassword
        ? 'Vui lòng xác nhận mật khẩu mới.'
        : confirmPassword !== newPassword
          ? 'Mật khẩu xác nhận không khớp.'
          : undefined,
  };

  const markPasswordTouched = (field: keyof typeof passwordTouched) =>
    setPasswordTouched((previous) => ({ ...previous, [field]: true }));

  const resetPasswordTouched = () =>
    setPasswordTouched({ currentPassword: false, newPassword: false, confirmPassword: false });

  const loadLinkedAccounts = () => {
    securitySettingsService
      .getLinkedAccounts()
      .then(setLinkedAccounts)
      .catch(() => setLinkedAccounts(null));
  };

  const loadSessions = () => {
    securitySettingsService
      .getSessions(sessionId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setIsLoadingSessions(false));
  };

  useEffect(() => {
    if (!user?.id) return;
    clientProfileService
      .getClientById(user.id)
      .then((profile) => {
        setUsername(profile.username ?? '');
        setOriginalUsername(profile.username ?? null);
      })
      .catch(() => {
        // Chưa từng thiết lập Client Profile — giữ username rỗng, cho phép đặt lần đầu.
      });
  }, [user?.id]);

  useEffect(() => {
    loadLinkedAccounts();
    loadSessions();
    securitySettingsService
      .get2FAStatus()
      .then(setTwoFactorEnabled)
      .catch(() => setTwoFactorEnabled(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetEmailFlow = () => {
    setEmailStep('idle');
    setNewEmail('');
    setEmailCode('');
    setCurrentPasswordForEmail('');
    setTwoFactorCodeForEmail('');
    setReauthCode('');
    setEmailTouched({ newEmail: false, code: false });
  };

  const handleRequestEmailReauth = async () => {
    setIsEmailSubmitting(true);
    try {
      await securitySettingsService.requestEmailChangeReauth();
      setEmailStep('reauth');
      toast.success('Đã gửi mã xác thực tới email hiện tại.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi mã xác thực.');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleRequestCode = async () => {
    if (!newEmail.trim()) {
      toast.error('Vui lòng nhập email mới.');
      return;
    }
    if (linkedAccounts?.hasPassword) {
      if (!currentPasswordForEmail) {
        toast.error('Vui lòng nhập mật khẩu hiện tại.');
        return;
      }
      if (twoFactorEnabled && !twoFactorCodeForEmail.trim()) {
        toast.error('Vui lòng nhập mã 2FA.');
        return;
      }
    } else if (!reauthCode.trim()) {
      toast.error('Vui lòng nhập mã xác thực đã gửi tới email hiện tại.');
      return;
    }

    setIsEmailSubmitting(true);
    try {
      await securitySettingsService.requestChangeEmail(
        newEmail.trim(),
        linkedAccounts?.hasPassword ? currentPasswordForEmail : undefined,
        linkedAccounts?.hasPassword && twoFactorEnabled ? twoFactorCodeForEmail.trim() : undefined,
        linkedAccounts?.hasPassword ? undefined : reauthCode.trim()
      );
      setEmailStep('code');
      toast.success('Đã gửi mã xác minh tới email mới.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi mã.');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleConfirmEmail = async () => {
    if (!emailCode.trim()) {
      toast.error('Vui lòng nhập mã xác minh.');
      return;
    }
    setIsEmailSubmitting(true);
    try {
      const updatedUser = await securitySettingsService.confirmChangeEmail(newEmail.trim(), emailCode.trim(), sessionId);
      setUser(updatedUser, roles);
      toast.success('Đã đổi email thành công. Các thiết bị khác đã bị đăng xuất.');
      resetEmailFlow();
      loadLinkedAccounts();
      loadSessions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xác nhận đổi email.');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    if (linkedAccounts?.hasPassword && !currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp.');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await securitySettingsService.requestChangePasswordOtp();
      setPasswordStep('code');
      toast.success('Đã gửi mã xác minh tới email của bạn.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi mã xác minh.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleConfirmChangePassword = async () => {
    if (!passwordOtpCode.trim()) {
      toast.error('Vui lòng nhập mã xác minh.');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await securitySettingsService.changePassword(
        linkedAccounts?.hasPassword ? currentPassword : undefined,
        newPassword,
        passwordOtpCode.trim(),
        sessionId
      );
      toast.success('Đã cập nhật mật khẩu. Các thiết bị khác đã bị đăng xuất.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtpCode('');
      setPasswordStep('idle');
      resetPasswordTouched();
      setPasswordOtpTouched(false);
      loadLinkedAccounts();
      loadSessions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleCancelPasswordOtp = () => {
    setPasswordStep('idle');
    setPasswordOtpCode('');
    setPasswordOtpTouched(false);
  };

  const handleUnlink = async (provider: string) => {
    try {
      await securitySettingsService.unlinkAccount(provider);
      toast.success(`Đã gỡ liên kết ${provider}.`);
      loadLinkedAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gỡ liên kết.');
    }
  };

  const triggerGoogleLink = useGoogleLink(loadLinkedAccounts);

  const handleRevokeSession = async (id: string) => {
    try {
      await securitySettingsService.revokeSession(id);
      toast.success('Đã đăng xuất thiết bị.');
      loadSessions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đăng xuất thiết bị.');
    }
  };

  const handleRevokeOthers = async () => {
    try {
      const count = await securitySettingsService.revokeOtherSessions(sessionId);
      toast.success(`Đã đăng xuất ${count} thiết bị khác.`);
      loadSessions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đăng xuất các thiết bị khác.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Username</p>
        <div>
          <div className="relative">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onBlur={() => setUsernameTouched(true)}
              className={`${inputClass} pr-10 ${usernameError ? 'border-red-400' : ''}`}
              placeholder="vd: nguyenvanan"
            />
            {username.trim() && USERNAME_REGEX.test(username.trim()) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                {isCheckingUsername ? (
                  <span className="text-[#78767A]">...</span>
                ) : usernameAvailable === true ? (
                  <span className="text-emerald-400">✓</span>
                ) : usernameAvailable === false ? (
                  <span className="text-red-400">✗</span>
                ) : null}
              </span>
            )}
          </div>
          {usernameError && <p className="mt-1 text-xs text-red-400">{usernameError}</p>}
          {!usernameError && !isCheckingUsername && usernameAvailable === false && (
            <p className="mt-1 text-xs text-red-400">Username này đã có người dùng hoặc không thể sử dụng.</p>
          )}
        </div>

        {requiresPasswordForUsername && (
          <div>
            <input
              type="password"
              value={currentPasswordForUsername}
              onChange={(event) => setCurrentPasswordForUsername(event.target.value)}
              onBlur={() => setUsernamePasswordTouched(true)}
              className={`${inputClass} ${usernamePasswordError ? 'border-red-400' : ''}`}
              placeholder="Mật khẩu hiện tại (để xác nhận đổi username)"
            />
            {usernamePasswordError && <p className="mt-1 text-xs text-red-400">{usernamePasswordError}</p>}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSaveUsername()}
          disabled={isUsernameSubmitting || usernameAvailable === false}
          className="rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUsernameSubmitting ? 'Đang lưu...' : 'Lưu username'}
        </button>
      </section>

      <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Email đăng nhập</p>
        <p className="text-sm text-[#C7C5CF]">
          Email hiện tại: <span className="text-white">{user?.email}</span>
        </p>

        {emailStep === 'idle' && linkedAccounts && !linkedAccounts.hasPassword && (
          <div className="space-y-3">
            <p className="text-xs text-[#78767A]">
              Tài khoản của bạn đăng nhập bằng Google, chưa có mật khẩu. Để đổi email, cần xác thực lại qua email
              hiện tại trước.
            </p>
            <button
              type="button"
              onClick={handleRequestEmailReauth}
              disabled={isEmailSubmitting}
              className="rounded-xl bg-[#A7ACD9] px-4 py-2.5 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Gửi mã xác thực tới email hiện tại
            </button>
          </div>
        )}

        {emailStep === 'idle' && linkedAccounts?.hasPassword && (
          <div className="space-y-3">
            <input
              type="password"
              value={currentPasswordForEmail}
              onChange={(event) => setCurrentPasswordForEmail(event.target.value)}
              className={inputClass}
              placeholder="Mật khẩu hiện tại"
            />
            {twoFactorEnabled && (
              <input
                value={twoFactorCodeForEmail}
                onChange={(event) => setTwoFactorCodeForEmail(event.target.value)}
                maxLength={6}
                className={inputClass}
                placeholder="Mã 2FA"
              />
            )}
            <div>
              <div className="flex gap-2">
                <input
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  onBlur={() => markEmailTouched('newEmail')}
                  className={`${inputClass} ${emailErrors.newEmail ? 'border-red-400' : ''}`}
                  placeholder="Email mới"
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isEmailSubmitting}
                  className="shrink-0 rounded-xl bg-[#A7ACD9] px-4 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gửi mã
                </button>
              </div>
              {emailErrors.newEmail && <p className="mt-1 text-xs text-red-400">{emailErrors.newEmail}</p>}
            </div>
          </div>
        )}

        {emailStep === 'reauth' && (
          <div className="space-y-3">
            <p className="text-xs text-[#78767A]">Mã xác thực đã gửi tới email hiện tại ({user?.email}).</p>
            <input
              value={reauthCode}
              onChange={(event) => setReauthCode(event.target.value)}
              maxLength={6}
              className={inputClass}
              placeholder="Mã xác thực 6 số"
            />
            <div>
              <div className="flex gap-2">
                <input
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  onBlur={() => markEmailTouched('newEmail')}
                  className={`${inputClass} ${emailErrors.newEmail ? 'border-red-400' : ''}`}
                  placeholder="Email mới"
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isEmailSubmitting}
                  className="shrink-0 rounded-xl bg-[#A7ACD9] px-4 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gửi mã
                </button>
              </div>
              {emailErrors.newEmail && <p className="mt-1 text-xs text-red-400">{emailErrors.newEmail}</p>}
            </div>
            <button type="button" onClick={resetEmailFlow} className="text-xs text-[#78767A] hover:text-white">
              Hủy
            </button>
          </div>
        )}

        {emailStep === 'code' && (
          <div className="space-y-3">
            <p className="text-xs text-[#78767A]">Mã xác minh đã gửi tới {newEmail}.</p>
            <div>
              <div className="flex gap-2">
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  onBlur={() => markEmailTouched('code')}
                  maxLength={6}
                  className={`${inputClass} ${emailErrors.code ? 'border-red-400' : ''}`}
                  placeholder="Mã 6 số"
                />
                <button
                  type="button"
                  onClick={handleConfirmEmail}
                  disabled={isEmailSubmitting}
                  className="shrink-0 rounded-xl bg-[#A7ACD9] px-4 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Xác nhận
                </button>
              </div>
              {emailErrors.code && <p className="mt-1 text-xs text-red-400">{emailErrors.code}</p>}
            </div>
            <button type="button" onClick={resetEmailFlow} className="text-xs text-[#78767A] hover:text-white">
              Hủy
            </button>
          </div>
        )}
      </section>

      <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">
          {linkedAccounts?.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
        </p>
        {linkedAccounts && !linkedAccounts.hasPassword && (
          <p className="text-xs text-[#78767A]">
            Tài khoản của bạn đang đăng nhập bằng Google, chưa có mật khẩu. Đặt mật khẩu để có thể đăng nhập bằng
            email/mật khẩu.
          </p>
        )}
        {linkedAccounts?.hasPassword && (
          <div>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              onBlur={() => markPasswordTouched('currentPassword')}
              disabled={passwordStep === 'code'}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50 ${
                passwordErrors.currentPassword ? 'border-red-400' : ''
              }`}
              placeholder="Mật khẩu hiện tại"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-400">{passwordErrors.currentPassword}</p>
            )}
          </div>
        )}
        <div>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            onBlur={() => markPasswordTouched('newPassword')}
            disabled={passwordStep === 'code'}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50 ${
              passwordErrors.newPassword ? 'border-red-400' : ''
            }`}
            placeholder="Mật khẩu mới"
          />
          {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword}</p>}
        </div>
        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onBlur={() => markPasswordTouched('confirmPassword')}
            disabled={passwordStep === 'code'}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50 ${
              passwordErrors.confirmPassword ? 'border-red-400' : ''
            }`}
            placeholder="Xác nhận mật khẩu mới"
          />
          {passwordErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-400">{passwordErrors.confirmPassword}</p>
          )}
        </div>

        {passwordStep === 'idle' ? (
          <button
            type="button"
            onClick={handleSendPasswordOtp}
            disabled={isPasswordSubmitting}
            className="w-full rounded-xl bg-[#A7ACD9] py-3 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Gửi mã xác minh
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#78767A]">Mã xác minh đã gửi tới email {user?.email}.</p>
            <input
              value={passwordOtpCode}
              onChange={(event) => setPasswordOtpCode(event.target.value)}
              onBlur={() => setPasswordOtpTouched(true)}
              maxLength={6}
              className={`${inputClass} ${passwordOtpError ? 'border-red-400' : ''}`}
              placeholder="Mã 6 số"
            />
            {passwordOtpError && <p className="mt-1 text-xs text-red-400">{passwordOtpError}</p>}
            <button
              type="button"
              onClick={handleConfirmChangePassword}
              disabled={isPasswordSubmitting}
              className="w-full rounded-xl bg-[#A7ACD9] py-3 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {linkedAccounts?.hasPassword ? 'Xác nhận đổi mật khẩu' : 'Xác nhận đặt mật khẩu'}
            </button>
            <button
              type="button"
              onClick={handleCancelPasswordOtp}
              className="text-xs text-[#78767A] hover:text-white"
            >
              Hủy
            </button>
          </div>
        )}
      </section>

      <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Tài khoản liên kết</p>
        {linkedAccounts && linkedAccounts.linkedProviders.length > 0 ? (
          linkedAccounts.linkedProviders.map((provider) => (
            <div
              key={provider}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm text-white">
                <ShieldCheck className="h-4 w-4 text-[#A7ACD9]" />
                {provider}
              </span>
              <button
                type="button"
                onClick={() => handleUnlink(provider)}
                className="text-xs font-semibold text-red-400 hover:underline"
              >
                Gỡ liên kết
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#78767A]">Chưa liên kết tài khoản nào.</p>
        )}
        {linkedAccounts && !linkedAccounts.linkedProviders.includes('Google') && (
          <button
            type="button"
            onClick={triggerGoogleLink}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-[#A7ACD9] hover:text-[#A7ACD9]"
          >
            Liên kết Google
          </button>
        )}
      </section>

      <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Phiên đăng nhập</p>
          <button
            type="button"
            onClick={handleRevokeOthers}
            className="text-xs font-semibold text-red-400 hover:underline"
          >
            Đăng xuất tất cả thiết bị khác
          </button>
        </div>
        {isLoadingSessions ? (
          <p className="text-sm text-[#78767A]">Đang tải...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[#78767A]">Không có phiên nào.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-start gap-2.5">
                  <Laptop className="mt-0.5 h-4 w-4 shrink-0 text-[#A7ACD9]" />
                  <div>
                    <p className="text-sm text-white">
                      {session.userAgent ? session.userAgent.slice(0, 60) : 'Thiết bị không xác định'}
                      {session.isCurrent && (
                        <span className="ml-2 rounded-full bg-[#A7ACD9]/15 px-2 py-0.5 text-[10px] text-[#A7ACD9]">
                          Thiết bị này
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#78767A]">
                      {session.createdByIp ?? 'IP không xác định'} · Hoạt động lần cuối:{' '}
                      {new Date(session.lastUsedAt ?? session.createdAt).toLocaleString(lang === 'ENG' ? 'en-US' : 'vi-VN')}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(session.id)}
                    className="shrink-0 text-[#C7C5CF] transition hover:text-red-400"
                    aria-label="Đăng xuất thiết bị này"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <TwoFactorSettingsForm />
    </div>
  );
}
