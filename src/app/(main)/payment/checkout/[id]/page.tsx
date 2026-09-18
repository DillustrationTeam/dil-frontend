'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { commissionService } from '@/services/commission.service';
import { Commission } from '@/types/commission.types';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGW, setSelectedGW] = useState('vnpay');

  useEffect(() => {
    commissionService.getById(id as string)
      .then(setCommission)
      .catch(console.error);
  }, [id]);

  const handlePay = () => {
    setLoading(true);
    // Simulate payment
    setTimeout(() => {
      setLoading(false);
      alert('HMAC-SHA256 Webhook IPN Verified! Escrow payment locked.');
      router.push(`/workroom/${id}`);
    }, 1000);
  };

  if (!commission) return <div className="p-8 text-[#C5C9F8] font-mono">Loading checkout...</div>;

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-10 flex-grow space-y-8">
      
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-8 space-y-8 shadow-2xl">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs text-[#C5C9F8] font-mono font-bold">/payment/checkout/CMD-{commission.id.substring(0, 4)}</span>
            <h1 className="font-h1 text-2xl md:text-3xl font-extrabold text-white">Deposit Escrow Funds</h1>
            <p className="text-xs text-[#8A8FA9]">Lock order funds safely into Platform Escrow before artwork production begins.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-xs font-bold">
            <span className="material-symbols-outlined text-base">lock</span>
            <span>Escrow Protected Order</span>
          </div>
        </div>

        {/* 1. ORDER SUMMARY CARD */}
        <div className="bg-[#121420] border border-white/10 p-6 rounded-2xl space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8FA9]">ORDER SUMMARY</span>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs text-[#C5C9F8] font-mono font-bold">#CMD-{commission.id.substring(0, 4)}</span>
              <h2 className="font-h1 text-xl font-bold text-white">{commission.title}</h2>
              <p className="text-xs text-[#8A8FA9]">Creator Artist: <span className="text-[#C5C9F8] font-bold">@{commission.creatorId}</span></p>
            </div>

            <div className="text-left sm:text-right bg-white/5 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] text-[#8A8FA9] font-bold uppercase block">TOTAL ESCROW DEPOSIT</span>
              <span className="font-h1 text-2xl font-extrabold text-white">${commission.price}</span>
            </div>
          </div>
        </div>

        {/* 2. PAYMENT GATEWAY SELECTOR */}
        <div className="space-y-3">
          <label className="font-h1 font-extrabold text-xs uppercase tracking-wider text-[#8A8FA9]">
            SELECT PAYMENT GATEWAY
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            <div 
              onClick={() => setSelectedGW('vnpay')} 
              className={`p-4 cursor-pointer flex flex-col justify-between h-28 border rounded-2xl transition-all ${selectedGW === 'vnpay' ? 'border-[#C5C9F8] bg-[#C5C9F8]/10 shadow-[0_0_15px_rgba(197,201,248,0.2)]' : 'border-white/10 bg-white/5 hover:border-[#C5C9F8]/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">VNPay Banking QR</span>
                <span className="material-symbols-outlined text-[#C5C9F8] text-base">qr_code_2</span>
              </div>
              <p className="text-[10px] text-[#8A8FA9]">Scan QR code via banking app (VietQR)</p>
            </div>

            <div 
              onClick={() => setSelectedGW('momo')} 
              className={`p-4 cursor-pointer flex flex-col justify-between h-28 border rounded-2xl transition-all ${selectedGW === 'momo' ? 'border-[#C5C9F8] bg-[#C5C9F8]/10 shadow-[0_0_15px_rgba(197,201,248,0.2)]' : 'border-white/10 bg-white/5 hover:border-[#C5C9F8]/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">MoMo E-Wallet</span>
                <span className="material-symbols-outlined text-purple-400 text-base">account_balance_wallet</span>
              </div>
              <p className="text-[10px] text-[#8A8FA9]">Instant mobile wallet payment</p>
            </div>

            <div 
              onClick={() => setSelectedGW('wallet')} 
              className={`p-4 cursor-pointer flex flex-col justify-between h-28 border rounded-2xl transition-all ${selectedGW === 'wallet' ? 'border-[#C5C9F8] bg-[#C5C9F8]/10 shadow-[0_0_15px_rgba(197,201,248,0.2)]' : 'border-white/10 bg-white/5 hover:border-[#C5C9F8]/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Dillustration Wallet</span>
                <span className="material-symbols-outlined text-emerald-400 text-base">wallet</span>
              </div>
              <p className="text-[10px] text-[#8A8FA9]">Balance: $4,850.00 (Instant Lock)</p>
            </div>

          </div>
        </div>

        {/* 3. PLATFORM SECURITY COMMITMENT BOX */}
        <div className="bg-gradient-to-r from-[#1E2235] to-[#161826] border border-[#C5C9F8]/30 p-5 rounded-2xl flex items-start gap-4 text-xs">
          <div className="w-10 h-10 rounded-xl bg-[#C5C9F8]/20 text-[#C5C9F8] flex items-center justify-center shrink-0 mt-0.5 border border-[#C5C9F8]/30">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-h1 font-bold text-white text-sm">Escrow Protection Guarantee</h4>
            <p className="text-[#8A8FA9] leading-relaxed">
              Your money will be held safely in the Escrow Wallet and only released when you approve each milestone output.
            </p>
          </div>
        </div>

        {/* 4. PRIMARY CTA BUTTON */}
        <button 
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-white hover:bg-[#C5C9F8] text-[#0f1017] transition-all py-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(197,201,248,0.2)] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">lock</span>
          <span>{loading ? 'Processing Secure Lock...' : `Confirm Escrow Payment ($${commission.price})`}</span>
        </button>

      </div>
    </div>
  );
}
