'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Wallet, QrCode, CheckCircle2, Lock, Copy, Check } from 'lucide-react';

interface EscrowPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountUSD?: number;
  milestoneName?: string;
  onPaymentSuccess?: () => void;
}

export default function EscrowPaymentModal({
  isOpen,
  onClose,
  amountUSD = 135,
  milestoneName = 'Stage 1 Escrow Deposit',
  onPaymentSuccess,
}: EscrowPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'wallet'>('payos');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  if (!isOpen) return null;

  const amountVND = amountUSD * 25000;

  const handleCopyCode = () => {
    navigator.clipboard.writeText('DIL-ESCROW-884291');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaidSuccess(true);
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#131522]/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161926]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-white">Escrow Vault Payment</h3>
              <p className="text-[11px] text-slate-400">{milestoneName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!paidSuccess ? (
            <>
              {/* Amount Breakdown Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Deposit Amount</p>
                  <p className="text-xl font-bold font-space-grotesk text-emerald-400">${amountUSD}.00 USD</p>
                  <p className="text-[10px] text-slate-400">≈ {amountVND.toLocaleString()} VND</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 100% Escrow Secured
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('payos')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                      paymentMethod === 'payos'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <span>VietQR / PayOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                      paymentMethod === 'wallet'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>DIL Wallet ($1,250)</span>
                  </button>
                </div>
              </div>

              {/* PayOS QR View */}
              {paymentMethod === 'payos' && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-center">
                  <p className="text-xs text-slate-300 font-medium">Scan VietQR via Banking App:</p>
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-xl shadow-lg flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=PAYOS_DEPOSIT_${amountVND}`}
                      alt="VietQR PayOS"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-black/20 p-2 rounded-xl border border-white/5">
                    <span>Transfer Content: <strong className="text-white">DIL-ESCROW-884291</strong></span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet View */}
              {paymentMethod === 'wallet' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between font-bold">
                    <span>Available DIL Balance:</span>
                    <span className="text-emerald-400">$1,250.00 USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>After Escrow Lock:</span>
                    <span className="text-white">${1250 - amountUSD}.00 USD</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Escrow Deposit Confirmed!</h4>
              <p className="text-xs text-slate-400">Funds locked in DIL Vault. Creator can now begin work on this stage.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161926]/80 flex justify-end gap-2">
          {!paidSuccess && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                {isProcessing ? 'Verifying Deposit...' : 'Lock Funds in Escrow'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
