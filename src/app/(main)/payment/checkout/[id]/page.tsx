'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';
import { LockKeyhole, QrCode, ShieldCheck, Wallet } from 'lucide-react';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGW, setSelectedGW] = useState('Wallet');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commissionService.getById(id as string)
      .then(setCommission)
      .catch(console.error);
  }, [id]);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      await commissionService.depositEscrow(id as string, selectedGW);
      router.push(`/workroom/${id}`);
    } catch {
      setError('Unable to deposit escrow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!commission) return <div className="p-8 text-sm text-slate-400">Loading checkout...</div>;
  if (commission.status !== 'AwaitingEscrowDeposit') {
    const deposited = commission.escrowStatus === 'Deposited' || commission.status === 'InProgress';
    return <div className="mx-auto w-full max-w-2xl px-6 py-10"><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-[#A7ACD9]" /><h1 className="mt-4 font-h1 text-xl font-bold text-white">{deposited ? 'Escrow already deposited' : 'Checkout is not available yet'}</h1><p className="mt-2 text-sm text-slate-400">{deposited ? 'This commission is ready in its workroom.' : 'Wait for the creator to accept your request before depositing escrow.'}</p><Link href={deposited ? `/workroom/${id}` : '/client/commissions'} className="commission-primary mt-6 inline-flex rounded-xl px-5 py-3 text-xs font-bold">{deposited ? 'Open workroom' : 'View commissions'}</Link></div></div>;
  }

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-10 flex-grow">
      
      <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-h1 text-2xl md:text-3xl font-extrabold text-white">Deposit Escrow Funds</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#A7ACD9]">
            <LockKeyhole className="h-4 w-4" /> Escrow protected
          </div>
        </div>

        {/* 1. ORDER SUMMARY CARD */}
        <div className="border-b border-white/10 pb-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs text-[#C5C9F8] font-mono font-bold">#CMD-{commission.id.substring(0, 4)}</span>
              <h2 className="font-h1 text-xl font-bold text-white">{commission.title}</h2>
              <p className="text-xs text-[#8A8FA9]">Creator: <span className="font-bold text-slate-300">@{commission.creatorId}</span></p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-[#8A8FA9] font-bold block">Total deposit</span>
              <span className="font-h1 text-2xl font-extrabold text-white">${commission.finalPrice ?? commission.totalPrice ?? commission.price ?? 0}</span>
            </div>
          </div>
        </div>

        {/* 2. PAYMENT GATEWAY SELECTOR */}
        <div className="space-y-3">
          <p className="font-h1 font-bold text-sm text-white">Payment method</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            <button type="button"
              onClick={() => setSelectedGW('VNPay')}
              aria-pressed={selectedGW === 'VNPay'}
              className={`p-4 text-left flex flex-col justify-between h-28 border rounded-xl transition-colors ${selectedGW === 'VNPay' ? 'border-[#A7ACD9] bg-[#A7ACD9]/10' : 'border-white/10 bg-white/[0.035] hover:border-[#A7ACD9]/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">VNPay Banking QR</span>
                <QrCode className="h-4 w-4 text-[#A7ACD9]" />
              </div>
              <p className="text-[10px] text-[#8A8FA9]">Scan QR code via banking app (VietQR)</p>
            </button>

            <button type="button"
              onClick={() => setSelectedGW('MoMo')}
              aria-pressed={selectedGW === 'MoMo'}
              className={`p-4 text-left flex flex-col justify-between h-28 border rounded-xl transition-colors ${selectedGW === 'MoMo' ? 'border-[#A7ACD9] bg-[#A7ACD9]/10' : 'border-white/10 bg-white/[0.035] hover:border-[#A7ACD9]/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">MoMo E-Wallet</span>
                <Wallet className="h-4 w-4 text-[#A7ACD9]" />
              </div>
              <p className="text-[10px] text-[#8A8FA9]">Instant mobile wallet payment</p>
            </button>

            <button type="button"
              onClick={() => setSelectedGW('Wallet')}
              aria-pressed={selectedGW === 'Wallet'}
              className={`p-4 text-left flex flex-col justify-between h-28 border rounded-xl transition-colors ${selectedGW === 'Wallet' ? 'border-[#A7ACD9] bg-[#A7ACD9]/10' : 'border-white/10 bg-white/[0.035] hover:border-[#A7ACD9]/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Dillustration Wallet</span>
                <Wallet className="h-4 w-4 text-[#A7ACD9]" />
              </div>
              <p className="text-[10px] text-[#8A8FA9]">Available balance is verified when you confirm</p>
            </button>

          </div>
        </div>

        {/* 3. PLATFORM SECURITY COMMITMENT BOX */}
        <div className="flex items-start gap-3 border-t border-white/10 pt-5 text-xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#A7ACD9]" />
          <div className="space-y-1">
            <h4 className="font-h1 font-bold text-white text-sm">Escrow protection</h4>
            <p className="text-[#8A8FA9] leading-relaxed">
              Your money will be held safely in the Escrow Wallet and only released when you approve each milestone output.
            </p>
          </div>
        </div>

        {error && <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200">{error}</p>}

        {/* 4. PRIMARY CTA BUTTON */}
        <button 
          onClick={handlePay}
          disabled={loading}
          className="commission-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-extrabold transition-all disabled:opacity-50"
        >
          <LockKeyhole className="h-4 w-4" />
          <span>{loading ? 'Processing secure lock…' : `Confirm Escrow Payment ($${commission.finalPrice ?? commission.totalPrice ?? commission.price ?? 0})`}</span>
        </button>

      </div>
    </div>
  );
}
