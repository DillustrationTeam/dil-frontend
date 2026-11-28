'use client';

import { Wordmark } from '@/components/brand/wordmark';
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
        { sequence: 1, title: 'Phác thảo', percentage: 30, price: Math.round(totalAmount * 0.3) },
        { sequence: 2, title: 'Nét viền & Màu cơ bản', percentage: 30, price: Math.round(totalAmount * 0.3) },
        { sequence: 3, title: 'Hoàn thiện & tệp gốc', percentage: 40, price: totalAmount - Math.round(totalAmount * 0.6) },
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-[#F0E7D8]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-[#FFFCF6] border border-[#221E1A]/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Top Control Bar */}
        <div className="shrink-0 px-5 py-3.5 bg-[#FFFCF6] border-b border-[#221E1A]/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2F6B63]/10 animate-pulse" />
            <h3 className="font-h1 font-bold text-sm text-[#241F1A] flex items-center gap-2"> Biên lai Ký quỹ Quỹ Ủy thác ký quỹ <span className="font-mono text-xs text-brand-periwinkle font-normal">#{receiptCode}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch Desktop / Mobile View */}
            <div className="hidden sm:flex items-center gap-1 bg-[#FFFCF6] border border-[#221E1A]/10 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setMailView('desktop')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  mailView === 'desktop'
                    ? 'bg-brand-periwinkle text-[#FFFCF6] font-bold'
                    : 'text-[#746A5F] hover:text-[#241F1A]'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setMailView('mobile')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  mailView === 'mobile'
                    ? 'bg-brand-periwinkle text-[#FFFCF6] font-bold'
                    : 'text-[#746A5F] hover:text-[#241F1A]'
                }`}
              >
                Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#746A5F] hover:text-[#241F1A] border border-[#221E1A]/10 transition"
              title="In hoặc lưu PDF"
            >
              <Printer size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#746A5F] hover:text-[#241F1A] border border-[#221E1A]/10 transition"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center bg-[#FFFCF6]">
          
          <div
            className={`w-full transition-all duration-300 ${
              mailView === 'mobile' ? 'max-w-[390px]' : 'max-w-[640px]'
            } bg-[#FFFCF6] border border-[#221E1A]/10 rounded-2xl overflow-hidden shadow-2xl`}
          >
            {/* Mock Gmail Window Header */}
            <div className="bg-[#FFFCF6] border-b border-[#221E1A]/10 px-4 py-2.5 flex items-center justify-between text-xs text-[#746A5F]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#A8321C]/20 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8A6A1F]/20 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2F6B63]/20 inline-block" />
                </div>
                <span className="text-[11px] font-medium text-[#746A5F] pl-2 border-l border-[#221E1A]/10 hidden sm:inline"> Hộp thư đến: <strong className="text-[#241F1A]">client@{clientDisplay.toLowerCase().replace(/\s+/g, '')}.com</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-brand-periwinkle bg-brand-periwinkle/10 px-2 py-0.5 rounded-full border border-brand-periwinkle/20">
                DKIM: PASS • SPF: PASS
              </span>
            </div>

            {/* Email Subject & Sender info */}
            <div className="bg-[#FFFCF6] px-5 py-3.5 border-b border-[#221E1A]/10 space-y-1">
              <h2 className="text-sm sm:text-base font-bold font-h1 text-[#241F1A] leading-snug">
                Biên nhận ký quỹ #{receiptCode} — Đơn vẽ cùng @{creatorDisplay}
              </h2>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-[#746A5F] gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg overflow-hidden bg-[#FFFCF6] p-0.5 border border-[#221E1A]/10 flex items-center justify-center shrink-0">
                    <Wordmark size="sm" href={null} />
                  </div>
                  <div>
                    <span className="text-[#241F1A] font-semibold">DILLUSTRATION</span>
                    <span className="text-[#746A5F] text-[10px] ml-1">&lt;billing@dillustration.art&gt;</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#746A5F]">
                  {new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* HTML Email Message Content */}
            <div className="p-4 sm:p-6 bg-[#FFFCF6] text-xs text-[#6E6459] space-y-4">
              
              {/* Receipt Logo & Top Tag */}
              <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-3">
                <div className="flex items-center gap-2">
                  <Wordmark size="sm" href={null} />
                  <span className="font-h1 font-bold text-[#241F1A] tracking-wider text-xs">DILLUSTRATION</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="font-mono text-[11px] text-brand-periwinkle bg-brand-periwinkle/10 hover:bg-brand-periwinkle/20 px-2 py-0.5 rounded border border-brand-periwinkle/25 flex items-center gap-1 transition"
                  title="Sao chép mã biên nhận"
                >
                  {copied ? <Check size={11} className="text-[#2F6B63]" /> : <Copy size={11} />}
                  <span>#{receiptCode}</span>
                </button>
              </div>

              {/* Salutation & Notification */}
              <div className="space-y-2 text-xs leading-relaxed">
                <p> Chào <strong className="text-[#241F1A]">@{clientDisplay}</strong>,
                </p>
                <p className="text-[#746A5F]"> Khoản ký quỹ <strong className="text-[#241F1A]">{money(totalAmount)}</strong> cho đơn vẽ{' '}
                  <strong className="text-[#241F1A]">&ldquo;{commission.title}&rdquo;</strong> cùng họa sĩ{' '}
                  <strong className="text-brand-periwinkle">@{creatorDisplay}</strong> đã được giữ an toàn tại quỹ ủy thác ký quỹ. Họa sĩ đã nhận thông báo và bắt đầu thực hiện dự án. </p>
              </div>

              {/* Metadata Box */}
              <div className="bg-[#FFFCF6] rounded-xl border border-[#221E1A]/10 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#746A5F]">Mã đơn hàng</span>
                  <span className="font-mono font-bold text-[#241F1A]">#{orderCode}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#746A5F]">Quyền sử dụng</span>
                  <span className={`font-semibold ${isCommercial ? 'text-[#2F6B63]' : 'text-[#746A5F]'}`}>
                    {isCommercial ? 'Thương mại' : 'Cá nhân'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#746A5F]">Phương thức thanh toán</span>
                  <span className="text-[#241F1A] font-medium">Ví Dillustration • ký quỹ 24/7</span>
                </div>
              </div>

              {/* Milestones Progress Table */}
              <div className="space-y-2 pt-1">
                <p className="font-h1 font-bold text-[10px] uppercase tracking-wider text-[#746A5F]"> Tiến độ giải ngân các cột mốc </p>
                <div className="rounded-xl border border-[#221E1A]/10 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {milestones.map((m, idx) => (
                        <tr key={idx} className="border-b border-[#221E1A]/10 last:border-0 hover:bg-[#FFFCF6]">
                          <td className="p-2.5 text-[#6E6459]">
                            {m.sequence}. {m.title || `Cột mốc #${m.sequence}`}
                          </td>
                          <td className="p-2.5 text-center font-mono text-[11px] text-brand-periwinkle">
                            {m.percentage}%
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-[#241F1A]">
                            {money(m.price || Math.round((totalAmount * m.percentage) / 100))}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[#FFFCF6]">
                        <td colSpan={2} className="p-2.5 font-bold text-[#241F1A] text-xs"> Tổng ký quỹ tạm giữ </td>
                        <td className="p-2.5 text-right font-mono font-bold text-sm text-brand-periwinkle">
                          {money(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Watermark Security Notice */}
              <div className="bg-brand-periwinkle/5 border-l-2 border-brand-periwinkle p-3 rounded-r-lg text-[11px] text-[#746A5F] leading-relaxed">
                <p>
                  <strong className="text-[#241F1A]">Bản xem trước trong phòng làm việc:</strong> Các bản vẽ phác thảo sẽ được bảo vệ bởi dấu mờ mang mã{' '}
                  <span className="font-mono text-brand-periwinkle">#{receiptCode}</span>. Toàn bộ tệp gốc HD không dấu sẽ tự động mở khóa ngay khi bạn nghiệm thu mốc cuối cùng. </p>
              </div>

              {/* CTA Action */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onGoToWorkroom) onGoToWorkroom();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-periwinkle text-[#FFFCF6] font-bold text-xs hover:bg-[#8C3718] transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Vào phòng phòng làm việc trao đổi</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#221E1A]/10 text-center text-[10px] text-[#746A5F]">
                DILLUSTRATION • Nền tảng Đặt vẽ &amp; Ký quỹ Escrow an tâm • Hỗ trợ: support@dillustration.art
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
