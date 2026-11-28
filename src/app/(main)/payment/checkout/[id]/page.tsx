'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { useAuthStore } from '@/store/use-auth-store';
import { walletService } from '@/services/wallet.service';
import { LockKeyhole, ShieldCheck, Wallet } from 'lucide-react';
import WorkroomTermsModal from '@/components/modals/WorkroomTermsModal';

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
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  useEffect(() => {
    commissionService.getById(id).then(setCommission).catch(() => setError('Không tải được đơn vẽ.'));
    walletService.getMine().then(data => setBalance(data.wallet.balance)).catch(() => setWalletError(true));
  }, [id]);

  const canDeposit = commission?.clientId === userId && commission?.status === 'InProgress' && commission?.escrowStatus === 'Pending';
  const needsTerms = commission?.clientTermsVersion !== (commission?.currentWorkroomTermsVersion ?? '1.0');
  const depositAmount = (commission?.nextEscrowDepositAmount ?? 0) > 0 ? (commission?.nextEscrowDepositAmount ?? 0) : (commission?.finalPrice ?? 0);
  const gap = Math.max(0, depositAmount - (balance ?? 0));
  const acceptTerms = async () => {
    if (!commission) return;
    setAcceptingTerms(true);
    setTermsError('');
    try {
      setCommission(await commissionService.acceptWorkroomTerms(id));
    } catch {
      setTermsError('Không thể ghi nhận xác nhận điều khoản. Vui lòng thử lại.');
    } finally {
      setAcceptingTerms(false);
    }
  };
  const deposit = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await commissionService.depositEscrow(id);
      router.push(`/workroom/${id}?depositedStage=${updated.currentStage}&staged=${updated.isStagedEscrow ? '1' : '0'}&depositAmount=${depositAmount}`);
    } catch {
      setError('Không thể giữ tiền ký quỹ. Hãy kiểm tra số dư ví và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!commission) return <div className="p-8 text-sm text-[#746A5F]">{error || 'Đang tải đơn vẽ…'}</div>;
  return <main className="max-w-4xl w-full mx-auto px-3 py-8 sm:px-6 sm:py-10">
    <div className="space-y-8 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 sm:p-8">
      <header className="border-b border-[#221E1A]/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><h1 className="font-h1 text-2xl md:text-3xl font-extrabold text-[#241F1A]">Deposit Escrow Funds</h1><div className="flex items-center gap-2 text-xs font-medium text-[#B24A26]"><LockKeyhole className="h-4 w-4" /> Escrow protected</div></header>
      <section className="border-b border-[#221E1A]/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div className="space-y-1"><span className="text-xs text-[#8C3718] font-mono font-bold">#CMD-{commission.id.substring(0, 4)}</span><h2 className="font-h1 text-xl font-bold text-[#241F1A]">{commission.title}</h2><p className="text-xs text-[#6E6459]">Creator: <span className="font-bold text-[#746A5F]">@{commission.creatorName || commission.creatorId}</span></p></div><div className="text-left sm:text-right"><span className="text-[10px] text-[#6E6459] font-bold block">{commission.isStagedEscrow ? `Đợt ký quỹ Mốc #${commission.currentStage ?? 1} (Tổng ${money(commission.finalPrice ?? 0)})` : 'Total deposit'}</span><span className="font-h1 text-2xl font-extrabold text-[#241F1A]">{money(depositAmount)}</span></div></section>
      <section className="space-y-3">
        <h3 className="font-h1 font-bold text-sm text-[#241F1A]">Payment method</h3>
        <div className="rounded-xl border border-[#B24A26] bg-[#B24A26]/10 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#241F1A]">Dillustration Wallet</p>
            <p className="mt-2 text-[10px] text-[#6E6459]">Số dư khả dụng: {walletError ? 'Không tải được' : balance === null ? 'Đang tải…' : money(balance)}</p>
          </div>
          <Wallet className="h-5 w-5 shrink-0 text-[#B24A26]" />
        </div>
        {balance !== null && gap > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-3 text-xs text-[#8A6A1F]">
            <span>Cần nạp thêm {money(gap)}.</span>
            <Link className="underline" href={`/wallet?returnTo=${encodeURIComponent(`/payment/checkout/${id}`)}&amount=${Math.ceil(gap)}`}>Nạp tiền vào ví</Link>
          </div>
        )}
      </section>

      {commission.discountAmount > 0 && <p className="text-xs text-[#B24A26]">Đã áp dụng giảm giá {money(commission.discountAmount)}. Số tiền ký quỹ lấy từ đơn đã được xác nhận.</p>}
      <section className="flex items-start gap-3 border-t border-[#221E1A]/10 pt-5 text-xs"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B24A26]" /><div className="space-y-1"><h4 className="font-h1 font-bold text-[#241F1A] text-sm">Escrow protection</h4><p className="text-[#6E6459] leading-relaxed">Tiền nạp qua SePay vào ví. Khoản ký quỹ được giữ cho đơn và trả họa sĩ theo từng cột mốc khách hàng duyệt.</p></div></section>
      {error && <p role="alert" className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-4 py-3 text-xs text-[#A8321C]">{error}</p>}
      {canDeposit ? <button disabled={loading || balance === null || gap > 0} onClick={deposit} className="commission-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-extrabold transition-all disabled:opacity-50"><LockKeyhole className="h-4 w-4" />{loading ? 'Đang xử lý…' : `Xác nhận ký quỹ ${money(depositAmount)}`}</button> : <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5 text-center"><p className="text-xs text-[#6E6459]">Đơn chưa thể ký quỹ hoặc đã được ký quỹ.</p><Link href={commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' ? `/client/requests/${id}` : `/workroom/${id}`} className="mt-3 inline-block text-xs text-[#8C3718] underline">{commission.status === 'PendingAcceptance' || commission.status === 'Negotiating' ? 'Xem yêu cầu' : 'Xem Workroom'}</Link></div>}
      <Link className="inline-block text-xs text-[#8C3718] underline" href="/wallet">Xem ví hoặc nạp tiền</Link>
    </div>
    {needsTerms && (
      <WorkroomTermsModal
        isOpen
        role="client"
        commission={commission}
        isSubmitting={acceptingTerms}
        error={termsError}
        onConfirm={acceptTerms}
      />
    )}
</main>;
}
