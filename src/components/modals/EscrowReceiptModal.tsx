'use client';

import React, { useState } from 'react';
import { X, Printer, ArrowRight, Copy, Check } from 'lucide-react';
import type { Commission } from '@/types/commission.types';

interface EscrowReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission | null;
  onGoToWorkroom?: () => void;
}

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function EscrowReceiptModal({
  isOpen,
  onClose,
  commission,
  onGoToWorkroom,
}: EscrowReceiptModalProps) {
  const [mailView, setMailView] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !commission) return null;

  const totalAmount = commission.finalPrice ?? commission.totalPrice ?? 0;
  const receiptCode = `REC-${commission.id.slice(0, 8).toUpperCase()}`;
  const orderCode = `CMD-${commission.id.slice(0, 8).toUpperCase()}`;
  const creatorDisplay = commission.creatorName || 'Creator';
  const clientDisplay = commission.clientName || 'Khách hàng';
  const isCommercial = commission.licenseType === 'Commercial';

  const milestones = commission.milestones && commission.milestones.length > 0
    ? [...commission.milestones].sort((a, b) => a.sequence - b.sequence).map(m => ({
        sequence: m.sequence,
        title: m.title || `Mốc #${m.sequence}`,
        price: m.price || 0,
        percentage: totalAmount > 0 ? Math.round(((m.price || 0) / totalAmount) * 100) : 33,
      }))
    : [
        { sequence: 1, title: 'Phác thảo (Sketch)', percentage: 30, price: Math.round(totalAmount * 0.3) },
        { sequence: 2, title: 'Nét viền & Màu cơ bản (Lineart)', percentage: 30, price: Math.round(totalAmount * 0.3) },
        { sequence: 3, title: 'Hoàn thiện & File gốc (Final)', percentage: 40, price: totalAmount - Math.round(totalAmount * 0.6) },
      ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`#${receiptCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-[#0A0D16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Top Control Bar */}
        <div className="shrink-0 px-5 py-3.5 bg-[#121622] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-h1 font-bold text-sm text-white flex items-center gap-2">
              Biên lai Ký quỹ Quỹ Ủy thác Escrow
              <span className="font-mono text-xs text-brand-periwinkle font-normal">#{receiptCode}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch Desktop / Mobile View */}
            <div className="hidden sm:flex items-center gap-1 bg-[#181E2E] border border-white/10 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setMailView('desktop')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  mailView === 'desktop'
                    ? 'bg-brand-periwinkle text-brand-navy font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setMailView('mobile')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  mailView === 'mobile'
                    ? 'bg-brand-periwinkle text-brand-navy font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              title="In hoặc lưu PDF"
            >
              <Printer size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center bg-[#060911]">
          
          <div
            className={`w-full transition-all duration-300 ${
              mailView === 'mobile' ? 'max-w-[390px]' : 'max-w-[640px]'
            } bg-[#101420] border border-white/10 rounded-2xl overflow-hidden shadow-2xl`}
          >
            {/* Mock Gmail Window Header */}
            <div className="bg-[#181E2E] border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-[11px] font-medium text-slate-400 pl-2 border-l border-white/10 hidden sm:inline">
                  Hộp thư đến: <strong className="text-white">client@{clientDisplay.toLowerCase().replace(/\s+/g, '')}.com</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-brand-periwinkle bg-brand-periwinkle/10 px-2 py-0.5 rounded-full border border-brand-periwinkle/20">
                DKIM: PASS • SPF: PASS
              </span>
            </div>

            {/* Email Subject & Sender info */}
            <div className="bg-[#131826] px-5 py-3.5 border-b border-white/5 space-y-1">
              <h2 className="text-sm sm:text-base font-bold font-h1 text-white leading-snug">
                Biên nhận ký quỹ #{receiptCode} — Đơn vẽ cùng @{creatorDisplay}
              </h2>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg overflow-hidden bg-[#181E2E] p-0.5 border border-white/10 flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/weblogo.png" alt="DILLUSTRATION" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">DILLUSTRATION</span>
                    <span className="text-slate-500 text-[10px] ml-1">&lt;billing@dillustration.art&gt;</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* HTML Email Message Content */}
            <div className="p-4 sm:p-6 bg-[#0B0E17] text-xs text-slate-200 space-y-4">
              
              {/* Receipt Logo & Top Tag */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/weblogo.png" alt="DILLUSTRATION" className="h-7 w-auto object-contain" />
                  <span className="font-h1 font-bold text-white tracking-wider text-xs">DILLUSTRATION</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="font-mono text-[11px] text-brand-periwinkle bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 px-2 py-0.5 rounded border border-brand-periwinkle/25 flex items-center gap-1 transition"
                  title="Sao chép mã biên nhận"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>#{receiptCode}</span>
                </button>
              </div>

              {/* Salutation & Notification */}
              <div className="space-y-2 text-xs leading-relaxed">
                <p>
                  Chào <strong className="text-white">@{clientDisplay}</strong>,
                </p>
                <p className="text-slate-300">
                  Khoản ký quỹ <strong className="text-white">{money(totalAmount)}</strong> cho đơn vẽ{' '}
                  <strong className="text-white">&ldquo;{commission.title}&rdquo;</strong> cùng họa sĩ{' '}
                  <strong className="text-brand-periwinkle">@{creatorDisplay}</strong> đã được giữ an toàn tại quỹ ủy thác Escrow. Họa sĩ đã nhận thông báo và bắt đầu thực hiện dự án.
                </p>
              </div>

              {/* Metadata Box */}
              <div className="bg-[#171D2D] rounded-xl border border-white/5 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400">Mã đơn hàng</span>
                  <span className="font-mono font-bold text-white">#{orderCode}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400">Quyền sử dụng</span>
                  <span className={`font-semibold ${isCommercial ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {isCommercial ? 'Thương mại (Commercial)' : 'Cá nhân (Personal)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400">Phương thức thanh toán</span>
                  <span className="text-white font-medium">Ví Dillustration • Escrow 24/7</span>
                </div>
              </div>

              {/* Milestones Progress Table */}
              <div className="space-y-2 pt-1">
                <p className="font-h1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  Tiến độ giải ngân các cột mốc
                </p>
                <div className="rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {milestones.map((m, idx) => (
                        <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="p-2.5 text-slate-200">
                            {m.sequence}. {m.title || `Cột mốc #${m.sequence}`}
                          </td>
                          <td className="p-2.5 text-center font-mono text-[11px] text-brand-periwinkle">
                            {m.percentage}%
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-white">
                            {money(m.price || Math.round((totalAmount * m.percentage) / 100))}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-white/[0.03]">
                        <td colSpan={2} className="p-2.5 font-bold text-white text-xs">
                          Tổng ký quỹ tạm giữ
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-sm text-brand-periwinkle">
                          {money(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Watermark Security Notice */}
              <div className="bg-brand-periwinkle/5 border-l-2 border-brand-periwinkle p-3 rounded-r-lg text-[11px] text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-white">Bản xem trước trong Workroom:</strong> Các bản vẽ phác thảo (WIP) sẽ được bảo vệ bởi dấu mờ mang mã{' '}
                  <span className="font-mono text-brand-periwinkle">#{receiptCode}</span>. Toàn bộ file gốc HD không dấu sẽ tự động mở khóa ngay khi bạn nghiệm thu mốc cuối cùng.
                </p>
              </div>

              {/* CTA Action */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onGoToWorkroom) onGoToWorkroom();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-periwinkle text-brand-navy font-bold text-xs hover:bg-[#B8BCDF] transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Vào phòng Workroom trao đổi</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/5 text-center text-[10px] text-slate-500">
                DILLUSTRATION • Nền tảng Đặt vẽ &amp; Ký quỹ Escrow an tâm • Hỗ trợ: support@dillustration.art
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
