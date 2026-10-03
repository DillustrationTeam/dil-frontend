'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { securitySettingsService } from '@/features/profile-settings/services/security-settings.service';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#A7ACD9]';

type Stage = 'idle' | 'setup' | 'recovery';

export function TwoFactorSettingsForm() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [sharedKey, setSharedKey] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifyCodeTouched, setVerifyCodeTouched] = useState(false);
  const [disablePasswordTouched, setDisablePasswordTouched] = useState(false);

  const verifyCodeError = !verifyCodeTouched
    ? undefined
    : !verifyCode.trim()
      ? 'Vui lòng nhập mã xác minh.'
      : verifyCode.trim().length !== 6
        ? 'Mã xác minh phải gồm 6 số.'
        : undefined;

  const disablePasswordError =
    disablePasswordTouched && !disablePassword ? 'Vui lòng nhập mật khẩu.' : undefined;

  useEffect(() => {
    securitySettingsService
      .get2FAStatus()
      .then(setEnabled)
      .catch(() => setEnabled(false));
  }, []);

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const { sharedKey: key, authenticatorUri } = await securitySettingsService.setup2FA();
      const qr = await QRCode.toDataURL(authenticatorUri);
      setSharedKey(key);
      setQrDataUrl(qr);
      setStage('setup');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể bắt đầu thiết lập 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verifyCode.trim()) {
      toast.error('Vui lòng nhập mã xác minh từ ứng dụng.');
      return;
    }

    setIsLoading(true);
    try {
      const codes = await securitySettingsService.verifyAndEnable2FA(verifyCode.trim());
      setRecoveryCodes(codes);
      setStage('recovery');
      setEnabled(true);
      setVerifyCode('');
      setVerifyCodeTouched(false);
      toast.success('Đã bật xác minh 2 bước.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mã xác minh không đúng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSavedRecoveryCodes = () => {
    setStage('idle');
    setRecoveryCodes([]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAllCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCode('__all__');
    toast.success('Đã copy toàn bộ 10 mã khôi phục.');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDisable = async () => {
    if (!disablePassword) {
      toast.error('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      await securitySettingsService.disable2FA(disablePassword);
      toast.success('Đã tắt xác minh 2 bước.');
      setEnabled(false);
      setShowDisableForm(false);
      setDisablePassword('');
      setDisablePasswordTouched(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tắt 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  if (enabled === null) {
    return null;
  }

  return (
    <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-[#A7ACD9]">Xác minh 2 bước (2FA)</p>
        {enabled && stage === 'idle' && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Đã bật
          </span>
        )}
      </div>

      {stage === 'idle' && !enabled && (
        <>
          <p className="text-sm text-[#78767A]">
            Bật xác minh 2 bước để tăng bảo mật — mỗi lần đăng nhập sẽ cần thêm mã từ ứng dụng xác thực (Google
            Authenticator, Authy...).
          </p>
          <button
            type="button"
            onClick={handleStartSetup}
            disabled={isLoading}
            className="rounded-xl bg-[#A7ACD9] px-5 py-3 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bật 2FA
          </button>
        </>
      )}

      {stage === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-[#78767A]">
            Quét mã QR bằng ứng dụng xác thực, hoặc nhập khóa bí mật bên dưới nếu không quét được.
          </p>
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR xác thực 2FA" className="h-48 w-48 rounded-xl bg-white p-2" />
          )}
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-[#78767A]">Khóa bí mật</p>
            <p className="break-all font-mono text-sm text-white">{sharedKey}</p>
          </div>
          <div>
            <input
              value={verifyCode}
              onChange={(event) => setVerifyCode(event.target.value)}
              onBlur={() => setVerifyCodeTouched(true)}
              maxLength={6}
              className={`${inputClass} ${verifyCodeError ? 'border-red-400' : ''}`}
              placeholder="Nhập mã 6 số từ ứng dụng"
            />
            {verifyCodeError && <p className="mt-1 text-xs text-red-400">{verifyCodeError}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleVerifyAndEnable}
              disabled={isLoading}
              className="flex-1 rounded-xl bg-[#A7ACD9] py-3 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Xác nhận
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('idle');
                setVerifyCode('');
                setVerifyCodeTouched(false);
              }}
              className="rounded-xl border border-white/10 px-4 text-sm text-[#78767A] hover:text-white"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {stage === 'recovery' && (
        <div className="space-y-4">
          <p className="text-sm text-amber-400">
            Lưu lại 10 mã khôi phục này ở nơi an toàn — mỗi mã chỉ dùng được 1 lần để đăng nhập nếu bạn mất quyền
            truy cập ứng dụng xác thực. Mã sẽ KHÔNG hiện lại lần nào nữa.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white">
            {recoveryCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleCopyCode(code)}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-white/10"
                title="Copy mã này"
              >
                <span>{code}</span>
                {copiedCode === code ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 shrink-0 text-[#919099]" />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopyAllCodes}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-[#C7C5CF] transition hover:border-[#A7ACD9] hover:text-white"
          >
            {copiedCode === '__all__' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            Copy tất cả
          </button>
          <button
            type="button"
            onClick={handleConfirmSavedRecoveryCodes}
            className="w-full rounded-xl bg-[#A7ACD9] py-3 text-sm font-bold text-[#1F2335] transition hover:bg-white"
          >
            Tôi đã lưu lại
          </button>
        </div>
      )}

      {enabled && stage === 'idle' && (
        <>
          {!showDisableForm ? (
            <button
              type="button"
              onClick={() => setShowDisableForm(true)}
              className="text-xs font-semibold text-red-400 hover:underline"
            >
              Tắt 2FA
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                  onBlur={() => setDisablePasswordTouched(true)}
                  className={`${inputClass} ${disablePasswordError ? 'border-red-400' : ''}`}
                  placeholder="Nhập mật khẩu để xác nhận tắt 2FA"
                />
                {disablePasswordError && <p className="mt-1 text-xs text-red-400">{disablePasswordError}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-red-500/90 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Xác nhận tắt 2FA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableForm(false);
                    setDisablePassword('');
                    setDisablePasswordTouched(false);
                  }}
                  className="rounded-xl border border-white/10 px-4 text-sm text-[#78767A] hover:text-white"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
