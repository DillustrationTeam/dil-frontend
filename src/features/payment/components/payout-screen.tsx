'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, CircleAlert, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import { walletService } from '../services/wallet.service';
import type { BankAccountDto, BankAccountRequest, PayoutDto } from '../types/payment.types';
import type { WalletOverviewDto } from '../types/wallet.types';
import { AccountPageFooter, AccountPageHeading, AccountShell } from './account-shell';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

const statusMap: Record<string, { text: string; color: string }> = {
  Pending: { text: 'Chờ xử lý', color: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
  Approved: { text: 'Đã duyệt', color: 'border-sky-400/30 bg-sky-500/10 text-sky-300' },
  Processing: { text: 'Đang chuyển khoản', color: 'border-blue-400/30 bg-blue-500/10 text-blue-300' },
  Processed: { text: 'Thành công', color: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  Completed: { text: 'Thành công', color: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  Rejected: { text: 'Bị từ chối', color: 'border-red-400/30 bg-red-500/10 text-red-300' },
  Cancelled: { text: 'Đã hủy', color: 'border-white/20 bg-white/5 text-outline' },
};

export function PayoutScreen({ userId }: { userId: string | null }) {
  const [wallet, setWallet] = useState<WalletOverviewDto | null>(null);
  const [banks, setBanks] = useState<BankAccountDto[]>([]);
  const [payouts, setPayouts] = useState<PayoutDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form rút tiền
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [note, setNote] = useState('');

  // Form thêm ngân hàng
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState<BankAccountRequest>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isDefault: true,
  });

  async function loadData() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, banksRes, payoutsRes] = await Promise.all([
        walletService.getOverview().catch(() => null),
        paymentService.banks().catch(() => []),
        paymentService.payouts().catch(() => ({ items: [], nextCursor: null })),
      ]);
      if (walletRes) setWallet(walletRes);
      setBanks(banksRes);
      setPayouts(payoutsRes.items);
      if (banksRes.length > 0 && !selectedBankId) {
        const def = banksRes.find((b) => b.isDefault) || banksRes[0];
        setSelectedBankId(def.bankAccountId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin.');
    } finally {
      setLoading(false);
    }
  }

  // Giữ loader trong ref: effect chỉ chạy lại theo `userId`, không phụ thuộc
  // identity của hàm (tránh react-hooks/exhaustive-deps).
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  });

  useEffect(() => {
    // Chờ 1 microtask: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
    void (async () => {
      await Promise.resolve();
      await loadDataRef.current();
    })();
  }, [userId]);

  async function handleAddBank(e: React.FormEvent) {
    e.preventDefault();
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await paymentService.saveBank(bankForm);
      setSuccess('Thêm tài khoản ngân hàng thành công.');
      setShowAddBank(false);
      setBankForm({ bankName: '', accountNumber: '', accountHolder: '', isDefault: false });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu tài khoản ngân hàng.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteBank(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) return;
    try {
      await paymentService.deleteBank(id);
      setSuccess('Đã xóa tài khoản ngân hàng.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tài khoản ngân hàng.');
    }
  }

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!selectedBankId) {
      setError('Vui lòng chọn tài khoản nhận tiền.');
      return;
    }
    if (!numAmount || numAmount < 50000) {
      setError('Số tiền rút tối thiểu là 50.000 ₫.');
      return;
    }
    if (wallet && numAmount > wallet.wallet.balance) {
      setError('Số dư khả dụng không đủ để thực hiện yêu cầu.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await paymentService.payout(numAmount, selectedBankId, note);
      setSuccess('Gửi yêu cầu rút tiền thành công! Hệ thống sẽ xử lý trong vòng 24 giờ làm việc.');
      setAmount('');
      setNote('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yêu cầu rút tiền không thành công.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell active="payout">
      <AccountPageHeading
        breadcrumb="Rút tiền"
        title="Rút tiền về ngân hàng"
        description="Chuyển số dư tích lũy từ hoạt động vẽ tranh và đấu giá về tài khoản ngân hàng nội địa Việt Nam."
        actions={
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm hover:border-brand-periwinkle/50 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        }
      />

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <CircleAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Khối tạo yêu cầu rút */}
          <section className="glass-container rounded-3xl border border-white/10 p-6 md:p-8">
            <h2 className="mb-4 font-h1 text-lg font-bold">Tạo yêu cầu rút tiền</h2>

            {banks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm">
                <Building2 size={36} className="mx-auto mb-2 text-outline" />
                <p className="text-on-surface-variant">Bạn chưa có tài khoản ngân hàng nào để nhận tiền.</p>
                <button
                  type="button"
                  onClick={() => setShowAddBank(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-4 py-2 font-h1 text-xs font-bold text-brand-navy"
                >
                  <Plus size={14} /> Thêm tài khoản ngân hàng
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-on-surface-variant">Chọn tài khoản nhận tiền</label>
                  <div className="space-y-2">
                    {banks.map((b) => (
                      <label
                        key={b.bankAccountId}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                          selectedBankId === b.bankAccountId
                            ? 'border-brand-periwinkle bg-brand-periwinkle/10 text-on-surface'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="bankAccount"
                            value={b.bankAccountId}
                            checked={selectedBankId === b.bankAccountId}
                            onChange={() => setSelectedBankId(b.bankAccountId)}
                            className="size-4 accent-brand-periwinkle"
                          />
                          <div>
                            <p className="font-semibold">{b.bankName}</p>
                            <p className="font-mono text-xs text-outline">{b.accountNumberMasked} · {b.accountHolder}</p>
                          </div>
                        </div>
                        {b.isDefault && (
                          <span className="rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-2.5 py-0.5 text-[11px] text-brand-periwinkle">
                            Mặc định
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="payout-amount" className="text-xs font-medium text-on-surface-variant">Số tiền muốn rút (₫)</label>
                    {wallet && (
                      <span className="text-xs text-outline">
                        Khả dụng: <strong className="text-brand-periwinkle">{formatVnd(wallet.wallet.balance)}</strong>
                      </span>
                    )}
                  </div>
                  <input
                    id="payout-amount"
                    type="number"
                    min="50000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Tối thiểu 50.000 ₫"
                    className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-3 font-h1 text-lg font-semibold text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="payout-note" className="mb-2 block text-xs font-medium text-on-surface-variant">Ghi chú (tùy chọn)</label>
                  <input
                    id="payout-note"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Rút tiền vẽ tranh tháng 10"
                    className="w-full rounded-xl border border-white/15 bg-brand-navy/60 px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-brand-periwinkle focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-outline">
                  Thời gian giải ngân thông thường từ 1-24 giờ làm việc. Phí rút tiền: Miễn phí.
                </div>

                <button
                  type="submit"
                  disabled={submitting || !amount || Number(amount) < 50000}
                  className="w-full rounded-full bg-brand-periwinkle py-3 text-center font-h1 text-sm font-bold text-brand-navy shadow-lg transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút tiền'}
                </button>
              </form>
            )}
          </section>

          {/* Lịch sử rút tiền */}
          <section className="glass-container rounded-3xl border border-white/10 p-6 md:p-8">
            <h2 className="mb-4 font-h1 text-lg font-bold">Lịch sử yêu cầu rút tiền</h2>
            {payouts.length === 0 ? (
              <p className="py-6 text-center text-sm text-outline">Chưa có yêu cầu rút tiền nào.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {payouts.map((p) => {
                  const s = statusMap[p.payoutStatus] || { text: p.payoutStatus, color: 'border-white/10 bg-white/5 text-outline' };
                  return (
                    <div key={p.payoutRequestId} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-h1 font-bold text-on-surface">{formatVnd(p.amount)}</span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.color}`}>
                            {s.text}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-outline">
                          {p.payoutNote || 'Yêu cầu rút tiền'} · Tạo lúc {new Date(p.createdAt).toLocaleString('vi-VN')}
                        </p>
                        {p.rejectReason && (
                          <p className="mt-1 text-xs text-red-300">Lý do từ chối: {p.rejectReason}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Cột phải: Quản lý ngân hàng */}
        <div className="space-y-6">
          <section className="glass-container rounded-3xl border border-white/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-h1 text-base font-bold">Tài khoản ngân hàng</h2>
              <button
                type="button"
                onClick={() => setShowAddBank(!showAddBank)}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-brand-periwinkle hover:bg-white/10"
              >
                <Plus size={14} /> Thêm
              </button>
            </div>

            {showAddBank && (
              <form onSubmit={handleAddBank} className="mb-4 space-y-3 rounded-2xl border border-brand-periwinkle/30 bg-brand-periwinkle/5 p-4 text-xs">
                <p className="font-bold text-brand-periwinkle">Thêm tài khoản mới</p>
                <div>
                  <label className="mb-1 block text-outline">Tên ngân hàng (Vietcombank, MB, Techcombank...)</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
                    placeholder="VD: MB Bank"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-outline">Số tài khoản</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-brand-navy px-3 py-2 font-mono text-on-surface"
                    placeholder="VD: 0123456789"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-outline">Tên chủ tài khoản (in hoa, không dấu)</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountHolder}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-white/10 bg-brand-navy px-3 py-2 text-on-surface"
                    placeholder="VD: NGUYEN VAN A"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddBank(false)}
                    className="rounded-full px-3 py-1 text-outline hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-brand-periwinkle px-4 py-1 font-bold text-brand-navy"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {banks.map((b) => (
                <div key={b.bankAccountId} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <div>
                    <p className="font-semibold text-on-surface">{b.bankName}</p>
                    <p className="font-mono text-outline">{b.accountNumberMasked} · {b.accountHolder}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBank(b.bankAccountId)}
                    className="text-outline hover:text-red-300"
                    title="Xóa tài khoản này"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <AccountPageFooter right="Rút tiền & tài khoản ngân hàng" />
    </AccountShell>
  );
}
