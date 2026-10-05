'use client';

import { useEffect, useState } from 'react';
import { walletService } from '@/services/wallet.service';
import Link from 'next/link';

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [locked, setLocked] = useState(0);
  const [amount, setAmount] = useState(100000);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletFailed, setWalletFailed] = useState(false);
  const [returnTo, setReturnTo] = useState('');
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const destination = query.get('returnTo') ?? '';
    if (destination.startsWith('/payment/checkout/')) setReturnTo(destination);
    const suggested = Number(query.get('amount'));
    if (Number.isSafeInteger(suggested) && suggested > 0 && suggested <= 500000000) setAmount(suggested);
    walletService.getMine().then(data => { setBalance(data.wallet.balance); setLocked(data.wallet.lockedBalance); })
      .catch(() => setWalletFailed(true)).finally(() => setWalletLoading(false));
  }, []);
  const topUp = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const order = await walletService.topUp(amount);
      if (order.checkoutAction && order.checkoutFields?.length) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = order.checkoutAction;
        order.checkoutFields.forEach(field => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = field.name;
          input.value = field.value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }
      if (!order.paymentUrl) throw new Error('No payment checkout');
      window.location.assign(order.paymentUrl);
    } catch { setError('Không tạo được đơn nạp tiền. Hãy thử lại.'); setBusy(false); }
  };
  return <main className="mx-auto max-w-xl space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-white">
    <h1 className="text-2xl font-bold">Ví Dillustration</h1>
    <p>Số dư khả dụng: <strong>{walletFailed ? 'Không tải được' : walletLoading ? 'Đang tải…' : money(balance ?? 0)}</strong></p>
    <p>Tiền đang giữ ký quỹ: <strong>{money(locked)}</strong></p>
    <p className="text-sm text-slate-400">Nạp tiền qua SePay. Khi SePay xác nhận thanh toán, tiền vào ví; bạn dùng số dư ví để ký quỹ đơn vẽ.</p>
    {returnTo && <p className="text-sm text-slate-300">Sau khi thanh toán, <Link href={returnTo} className="text-[#C5C9F8] underline">quay lại đơn cần ký quỹ</Link> để kiểm tra số dư và xác nhận.</p>}
    <form onSubmit={topUp} className="space-y-3"><label htmlFor="amount" className="block text-sm">Số tiền nạp (VND)</label><input id="amount" type="number" min={10000} max={500000000} step={1000} required value={amount} onChange={event => setAmount(Number(event.target.value))} className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2" /><button disabled={busy} className="commission-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Đang tạo đơn…' : 'Nạp tiền qua SePay'}</button></form>
    {walletFailed && <p role="alert" className="text-sm text-red-300">Không tải được số dư ví. Hãy tải lại trang trước khi ký quỹ.</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </main>;
}
