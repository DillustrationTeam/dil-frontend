'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, ExternalLink, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { PaymentOrderDto } from '../types/payment.types';
import { AccountPageFooter, AccountPageHeading, AccountShell } from './account-shell';
import { InlineLoader } from '@/features/navigation';

const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

/**
 * PayOS trả về `qrCode` là CHUỖI QR theo chuẩn VietQR (EMVCo), không phải URL ảnh.
 * Vì vậy không thể gán thẳng vào <img src>. Hàm này chuẩn hoá:
 * - Ảnh dựng sẵn (data URI / URL ảnh) → dùng trực tiếp.
 * - Chuỗi QR thô → dựng ảnh QR qua dịch vụ mã hoá, giữ nguyên toàn bộ dữ liệu
 *   (số tiền, nội dung chuyển khoản) để ứng dụng ngân hàng quét được.
 */
function resolveQrImageSrc(qrCode?: string | null): string | null {
  const raw = (qrCode ?? '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:image')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=0&data=${encodeURIComponent(raw)}`;
}

export function DepositScreen({ userId }: { userId: string | null }) {
  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>('100000');
  const [order, setOrder] = useState<PaymentOrderDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const qrImageSrc = resolveQrImageSrc(order?.qrCode);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng đăng nhập để thực hiện nạp tiền.');
      return;
    }
    if (amount < 10000) {
      setError('Số tiền nạp tối thiểu là 10.000 ₫.');
      return;
    }
    setError(null);
    setQrFailed(false);
    setLoading(true);
    try {
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/wallet` : 'http://localhost:3000/wallet';
      const cancelUrl = typeof window !== 'undefined' ? `${window.location.origin}/checkout` : 'http://localhost:3000/checkout';
      const res = await paymentService.createOrder(amount, returnUrl, cancelUrl);
      setOrder(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tạo đơn nạp tiền thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus() {
    if (!order) return;
    setChecking(true);
    try {
      const res = await paymentService.order(order.paymentOrderId);
      setOrder(res);
      if (res.paymentOrderStatus === 'Paid' || res.paymentOrderStatus === 'Completed') {
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái đơn.');
    } finally {
      setChecking(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPaid = order?.paymentOrderStatus === 'Paid' || order?.paymentOrderStatus === 'Completed';

  return (
    <AccountShell active="deposit">
      <AccountPageHeading
        breadcrumb="Nạp tiền"
        title="Nạp tiền vào ví"
        description="Số dư dùng để đặt giá đấu giá, thanh toán tranh nghệ thuật và đặt vẽ tranh."
        actions={
          <span className="flex items-center gap-1.5 text-xs text-outline">
            <ShieldCheck size={16} className="text-brand-periwinkle" /> Cổng thanh toán bảo mật
          </span>
        }
      />

      <div className="glass-container rounded-3xl border border-white/10 p-6 md:p-8">
        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!order ? (
          <form onSubmit={handleCreateOrder} className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-on-surface-variant">Chọn nhanh số tiền nạp</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(val);
                      setCustomAmount(val.toString());
                    }}
                    className={`rounded-2xl border p-4 text-center font-h1 text-base font-semibold transition-all ${
                      amount === val
                        ? 'border-brand-periwinkle bg-brand-periwinkle/15 text-brand-periwinkle shadow-lg'
                        : 'border-white/10 bg-white/5 text-on-surface hover:border-white/20'
                    }`}
                  >
                    {formatVnd(val)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="custom-amount" className="mb-2 block text-sm font-medium text-on-surface-variant">
                Hoặc nhập số tiền tùy ý (₫)
              </label>
              <input
                id="custom-amount"
                type="number"
                min="10000"
                step="1000"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(Number(e.target.value) || 0);
                }}
                className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-3 font-h1 text-lg font-semibold text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
                placeholder="Nhập số tiền tối thiểu 10.000 ₫"
              />
              <span className="mt-1 block text-xs text-outline">Tối thiểu: 10.000 ₫ · Miễn phí giao dịch</span>
            </div>

            <div className="rounded-2xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 p-4 text-xs text-on-surface-variant">
              Phương thức thanh toán: <strong>Chuyển khoản VietQR qua PayOS</strong>. Hệ thống tự động ghi nhận tiền vào ví trong vòng 1-3 phút sau khi chuyển khoản thành công.
            </div>

            <button
              type="submit"
              disabled={loading || amount < 10000}
              className="w-full rounded-full bg-brand-periwinkle py-3.5 text-center font-h1 text-sm font-bold text-brand-navy shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? <InlineLoader label="Đang khởi tạo đơn…" /> : `Tạo mã nạp ${formatVnd(amount)}`}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {isPaid ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
                <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-400" />
                <h2 className="font-h1 text-xl font-bold text-emerald-300">Nạp tiền thành công!</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Đơn nạp #{order.orderRef} với số tiền {formatVnd(order.amount)} đã được cộng vào số dư ví của bạn.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link href="/wallet" className="rounded-full bg-brand-periwinkle px-6 py-2.5 font-h1 text-xs font-bold text-brand-navy">
                    Xem số dư ví
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOrder(null)}
                    className="rounded-full border border-white/15 px-6 py-2.5 text-xs font-semibold hover:bg-white/10"
                  >
                    Tạo đơn nạp khác
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-periwinkle">
                    <QrCode size={18} /> Quét mã VietQR để thanh toán
                  </div>
                  {qrImageSrc && !qrFailed ? (
                    <div className="overflow-hidden rounded-xl border border-white/20 bg-white p-2 shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImageSrc}
                        alt="Mã QR thanh toán PayOS"
                        className="size-56 object-contain"
                        onError={() => setQrFailed(true)}
                      />
                    </div>
                  ) : (
                    <div className="flex size-56 flex-col items-center justify-center rounded-xl bg-black/20 p-4 text-center text-xs text-outline">
                      <QrCode size={28} className="mb-2 opacity-60" />
                      Hệ thống chưa trả được ảnh mã QR. Vui lòng dùng thông tin chuyển khoản bên cạnh hoặc mở trang thanh toán ngân hàng.
                    </div>
                  )}
                  {qrImageSrc && qrFailed && (
                    <p className="mt-2 max-w-56 text-[11px] text-amber-300">
                      Không tải được ảnh mã QR. Bạn vẫn có thể chuyển khoản theo thông tin bên cạnh.
                    </p>
                  )}
                  {order.paymentUrl && (
                    <a
                      href={order.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-periwinkle hover:underline"
                    >
                      Mở trang thanh toán ngân hàng <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm">
                  <h3 className="font-h1 font-bold text-on-surface">Thông tin chuyển khoản</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-outline">Số tiền cần chuyển:</span>
                      <p className="font-h1 text-lg font-bold text-brand-periwinkle">{formatVnd(order.amount)}</p>
                    </div>
                    {order.accountNumber && (
                      <div>
                        <span className="text-outline">Số tài khoản nhận:</span>
                        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm">
                          <span>{order.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.accountNumber || '')}
                            className="text-brand-periwinkle hover:text-white"
                            title="Sao chép số tài khoản"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    {order.accountName && (
                      <div>
                        <span className="text-outline">Chủ tài khoản:</span>
                        <p className="font-semibold text-on-surface">{order.accountName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-outline">Nội dung chuyển khoản (bắt buộc):</span>
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-brand-periwinkle">
                        <span>{order.orderRef}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.orderRef)}
                          className="text-brand-periwinkle hover:text-white"
                          title="Sao chép nội dung"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    {copied && <p className="text-xs text-emerald-400">Đã sao chép vào bộ nhớ tạm!</p>}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={checking}
                      onClick={handleCheckStatus}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-periwinkle py-2.5 font-h1 text-xs font-bold text-brand-navy shadow hover:brightness-110"
                    >
                      <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                      {checking ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AccountPageFooter right="Nạp tiền vào ví" />
    </AccountShell>
  );
}
