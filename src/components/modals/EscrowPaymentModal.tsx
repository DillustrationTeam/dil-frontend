'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
  const [paymentMethod, setPaymentMethod] = useState<'sepay' | 'wallet'>('sepay');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#E5D8C2] backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FFFCF6]/95 border border-[#221E1A]/10 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#221E1A]/10 flex items-center justify-between bg-[#FFFCF6]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-space-grotesk font-bold text-[#241F1A]">Escrow Vault Payment</h3>
              <p className="text-[11px] text-[#746A5F]">{milestoneName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFCF6] border border-[#221E1A]/10 text-[#746A5F] hover:text-[#241F1A] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!paidSuccess ? (
            <>
              {/* Amount Breakdown Banner */}
              <div className="p-4 bg-gradient-to-r from-[#3B4C86] via-[#5F3F86] to-[#E5D8C2] border border-[#3B4C86]/40 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#746A5F] font-medium">Deposit Amount</p>
                  <p className="text-xl font-bold font-space-grotesk text-[#2F6B63]">${amountUSD}.00 USD</p>
                  <p className="text-[10px] text-[#746A5F]">≈ {amountVND.toLocaleString()} VND</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#2F6B63]/10 border border-[#2F6B63]/30 text-[#2F6B63] text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 100% Escrow Secured
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-space-grotesk font-bold text-[#746A5F] uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sepay')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                      paymentMethod === 'sepay'
                        ? 'bg-[#3B4C86]/20 border-[#3B4C86]/30 text-[#241F1A] shadow-md'
                        : 'bg-[#FFFCF6] border-[#221E1A]/10 text-[#746A5F] hover:bg-[#F0E7D8]'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#3B4C86]" />
                    <span>VietQR / SePay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                      paymentMethod === 'wallet'
                        ? 'bg-[#2F6B63]/20 border-[#2F6B63]/30 text-[#241F1A] shadow-md'
                        : 'bg-[#FFFCF6] border-[#221E1A]/10 text-[#746A5F] hover:bg-[#F0E7D8]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-[#2F6B63]" />
                    <span>DIL Wallet ($1,250)</span>
                  </button>
                </div>
              </div>

              {/* SePay QR preview */}
              {paymentMethod === 'sepay' && (
                <div className="p-4 bg-[#FFFCF6] border border-[#221E1A]/10 rounded-2xl space-y-3 text-center">
                  <p className="text-xs text-[#746A5F] font-medium">Scan VietQR via Banking App:</p>
                  <div className="w-44 h-44 mx-auto p-2 bg-[#F0E7D8] rounded-xl shadow-lg flex items-center justify-center">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SEPAY_DEPOSIT_${amountVND}`}
                      alt="VietQR SePay"
                      width={180}
                      height={180}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#746A5F] bg-[#F0E7D8] p-2 rounded-xl border border-[#221E1A]/10">
                    <span>Transfer Content: <strong className="text-[#241F1A]">DIL-ESCROW-884291</strong></span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 text-[#3B4C86] hover:text-[#3B4C86] transition-colors"
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#2F6B63]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet View */}
              {paymentMethod === 'wallet' && (
                <div className="p-4 bg-[#2F6B63]/10 border border-[#2F6B63]/30 rounded-2xl space-y-2 text-xs text-[#746A5F]">
                  <div className="flex justify-between font-bold">
                    <span>Available DIL Balance:</span>
                    <span className="text-[#2F6B63]">$1,250.00 USD</span>
                  </div>
                  <div className="flex justify-between text-[#746A5F]">
                    <span>After Escrow Lock:</span>
                    <span className="text-[#241F1A]">${1250 - amountUSD}.00 USD</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2F6B63]/20 text-[#2F6B63] flex items-center justify-center border border-[#2F6B63]/40 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#241F1A]">Escrow Deposit Confirmed!</h4>
              <p className="text-xs text-[#746A5F]">Funds locked in DIL Vault. Creator can now begin work on this stage.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#221E1A]/10 bg-[#FFFCF6]/80 flex justify-end gap-2">
          {!paidSuccess && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#221E1A]/10 text-[#746A5F] hover:bg-[#FFFCF6]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#2F6B63] to-[#2F6B63] text-[#241F1A] shadow-lg shadow-[#2F6B63] hover:scale-[1.02] transition-all flex items-center gap-2"
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
