'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { useAuthStore } from '@/store/use-auth-store';
import { walletService } from '@/services/wallet.service';
import { LockKeyhole, ShieldCheck, Wallet } from 'lucide-react';

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const userId = useAuthStore(state => state.user?.id);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [walletError, setWalletError] = useState(false);

  useEffect(() => {
    commissionService.getById(id).then(setCommission).catch(() => setError('Không tải được đơn vẽ.'));
    walletService.getMine().then(data => setBalance(data.wallet.balance)).catch(() => setWalletError(true));
  }, [id]);

  const canDeposit = commission?.clientId === userId && commission?.status === 'InProgress' && commission?.escrowStatus === 'Pending';
  const gap = Math.max(0, (commission?.finalPrice ?? 0) - (balance ?? 0));
  const deposit = async () => {
    setLoading(true);
    setError('');
    try {
      await commissionService.depositEscrow(id);
      router.push(`/workroom/${id}`);
    } catch {
      setError('Không thể giữ tiền ký quỹ. Hãy kiểm tra số dư ví và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!commission) return <div className="p-8 text-sm text-slate-400">{error || 'Đang tải đơn vẽ…'}</div>;
  return <main className="max-w-4xl w-full mx-auto px-3 py-8 sm:px-6 sm:py-10">
    <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><h1 className="font-h1 text-2xl md:text-3xl font-extrabold text-white">Deposit Escrow Funds</h1><div className="flex items-center gap-2 text-xs font-medium text-[#A7ACD9]"><LockKeyhole className="h-4 w-4" /> Escrow protected</div></header>
      <section className="border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div className="space-y-1"><span className="text-xs text-[#C5C9F8] font-mono font-bold">#CMD-{commission.id.substring(0, 4)}</span><h2 className="font-h1 text-xl font-bold text-white">{commission.title}</h2><p className="text-xs text-[#8A8FA9]">Creator: <span className="font-bold text-slate-300">@{commission.creatorName || commission.creatorId}</span></p></div><div className="text-left sm:text-right"><span className="text-[10px] text-[#8A8FA9] font-bold block">Total deposit</span><span className="font-h1 text-2xl font-extrabold text-white">{money(commission.finalPrice ?? 0)}</span></div></section>
      <section className="space-y-3">
        <h3 className="font-h1 font-bold text-sm text-white">Payment method</h3>
        <div className="rounded-xl border border-[#A7ACD9] bg-[#A7ACD9]/10 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white">Dillustration Wallet</p>
            <p className="mt-2 text-[10px] text-[#8A8FA9]">Số dư khả dụng: {walletError ? 'Không tải được' : balance === null ? 'Đang tải…' : money(balance)}</p>
          </div>
          <Wallet className="h-5 w-5 shrink-0 text-[#A7ACD9]" />
        </div>
        {balance !== null && gap > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <span>Cần nạp thêm {money(gap)}.</span>
            <Link className="underline" href={`/wallet?returnTo=${encodeURIComponent(`/payment/checkout/${id}`)}&amount=${Math.ceil(gap)}`}>Nạp tiền vào ví</Link>
          </div>
        )}
      </section>

      {(commission.discountAmount ?? 0) > 0 && <p className="text-xs text-[#A7ACD9]">Đã áp dụng giảm giá {money(commission.discountAmount ?? 0)}. Số tiền ký quỹ lấy từ đơn đã được xác nhận.</p>}
      <section className="flex items-start gap-3 border-t border-white/10 pt-5 text-xs"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#A7ACD9]" /><div className="space-y-1"><h4 className="font-h1 font-bold text-white text-sm">Escrow protection</h4><p className="text-[#8A8FA9] leading-relaxed">Tiền nạp qua payOS vào ví. Khoản ký quỹ được giữ cho đơn và trả Creator theo từng cột mốc Client duyệt.</p></div></section>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200">{error}</p>}
      {canDeposit ? <button disabled={loading || balance === null || gap > 0} onClick={deposit} className="commission-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-extrabold transition-all disabled:opacity-50"><LockKeyhole className="h-4 w-4" />{loading ? 'Đang xử lý…' : `Xác nhận ký quỹ ${money(commission.finalPrice ?? 0)}`}</button> : <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-center"><p className="text-xs text-[#8A8FA9]">Đơn chưa thể ký quỹ hoặc đã được ký quỹ.</p><Link href={commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' ? `/client/requests/${id}` : `/workroom/${id}`} className="mt-3 inline-block text-xs text-[#C5C9F8] underline">{commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' ? 'Xem yêu cầu' : 'Xem Workroom'}</Link></div>}
      <Link className="inline-block text-xs text-[#C5C9F8] underline" href="/wallet">Xem ví hoặc nạp tiền</Link>
    </div>
  </main>;
}
