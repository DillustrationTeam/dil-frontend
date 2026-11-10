'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import type { Commission } from '@/types/commission.types';

interface DigitalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission | null;
  masterSha256?: string;
}

export default function DigitalCertificateModal({
  isOpen,
  onClose,
  commission,
  masterSha256,
}: DigitalCertificateModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !commission) return null;

  const certCode = `COA-2026-DILL-${commission.id.slice(0, 8).toUpperCase()}`;
  const orderCode = `CMD-${commission.id.slice(0, 8).toUpperCase()}`;
  const creatorDisplay = commission.creatorName || 'Creator';
  const clientDisplay = commission.clientName || 'Khách hàng';
  const isCommercial = commission.licenseType === 'Commercial';
  const termsSnap = commission.creatorTermsSnapshot;
  const extTerms = termsSnap?.extended;

  const realHash = masterSha256 || 'Chưa có mã băm phiên bản bàn giao';

  // Latest approved / final artwork image
  const lastMilestoneWithWip = commission.milestones
    ?.filter((m) => Boolean(m.wipPreviewUrl || m.originalWipUrl))
    .sort((a, b) => b.sequence - a.sequence)[0];

  const artworkUrl =
    lastMilestoneWithWip?.wipPreviewUrl ||
    lastMilestoneWithWip?.originalWipUrl ||
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80';

  const handleCopyHash = () => {
    if (!masterSha256) return;
    navigator.clipboard.writeText(masterSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-[#070A12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Sticky Header */}
        <div className="shrink-0 px-6 py-4 bg-[#111624] border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                ĐƠN HÀNG ĐÃ HOÀN TẤT &amp; NGHIỆM THU 100%
              </span>
              <h2 className="font-h1 text-base sm:text-lg font-bold text-white">
                Chứng thư Bản quyền Số &amp; Kho Tệp Gốc
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-brand-periwinkle text-brand-navy font-bold text-xs hover:bg-[#B8BCDF] transition flex items-center gap-1.5 shadow"
            >
              <Printer size={14} />
              <span>In chứng nhận PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#060911]">
          
          {/* TẤM CHỨNG THƯ BẢN QUYỀN CAO CẤP (CERTIFICATE FRAME) */}
          <div className="relative rounded-2xl p-6 sm:p-10 text-white overflow-hidden bg-gradient-to-br from-[#171D2D]/95 to-[#0E121C]/98 border border-brand-periwinkle/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),0_0_30px_rgba(167,172,217,0.1)]">
            
            {/* Dashed Inner Border */}
            <div className="absolute inset-2 sm:inset-3 border border-dashed border-brand-periwinkle/25 rounded-xl pointer-events-none" />

            {/* Certificate Top Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/weblogo.png" alt="DILLUSTRATION" className="h-10 w-auto object-contain" />
                <div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-brand-periwinkle">
                    DIGITAL CERTIFICATE OF AUTHENTICITY
                  </div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    CHỨNG NHẬN BẢN QUYỀN SỐ ĐỘC BẢN
                  </div>
                </div>
              </div>

              {/* Gold Seal Badge */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0 bg-gradient-to-tr from-[#9B7023] via-[#E5B358] to-[#FFE4A0]">
                  ✦
                </div>
                <div>
                  <div className="text-xs font-bold text-[#E5B358] uppercase tracking-wide">
                    VERIFIED ASSET
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    CHỨNG THỰC BẢO HỘ 100%
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Body (Split: Image & Legal Ownership) */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b border-white/10">
              
              {/* Left Column: Final Artwork Clean Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artworkUrl}
                    alt={commission.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-emerald-400/30 text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>BẢN GỐC ĐÃ GỠ THỦY VÂN</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] px-2.5 py-1 rounded-md">
                    4096 × 5464 px • 300 DPI
                  </div>
                </div>
                <p className="text-[11px] text-center text-slate-400 italic">
                  Tác phẩm hoàn thiện chính thức sau nghiệm thu ký quỹ Escrow.
                </p>
              </div>

              {/* Right Column: Ownership & Rights */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-periwinkle bg-brand-periwinkle/10 px-2.5 py-0.5 rounded border border-brand-periwinkle/20">
                    MÃ CHỨNG THƯ: {certCode}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-h1 text-white mt-2">
                    {commission.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Dự án đơn vẽ theo yêu cầu: <code className="text-white font-mono font-bold">#{orderCode}</code>
                  </p>
                </div>

                {/* Parties Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/[0.03] border border-white/10 p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Tác giả sáng tạo gốc</span>
                    <strong className="text-white text-sm block mt-0.5">{creatorDisplay}</strong>
                    <span className="text-xs text-brand-periwinkle block">@{creatorDisplay.toLowerCase().replace(/\s+/g, '')}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block italic">
                      Giữ vĩnh viễn quyền nhân thân (Đ.19 Luật SHTT)
                    </span>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Chủ sở hữu khai thác</span>
                    <strong className="text-white text-sm block mt-0.5">{clientDisplay}</strong>
                    <span className="text-xs text-emerald-400 block">@{clientDisplay.toLowerCase().replace(/\s+/g, '')}</span>
                    <span className="text-[10px] text-emerald-300/80 mt-1 block">
                      {isCommercial ? 'Toàn quyền thương mại (Đ.20 Luật SHTT)' : 'Quyền sử dụng cá nhân phi thương mại'}
                    </span>
                  </div>
                </div>

                {/* License Terms Scope */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-periwinkle">
                    Phạm vi Quyền Khai thác {isCommercial ? 'Thương mại (Commercial License Scope)' : 'Cá nhân (Personal License Scope)'}
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 text-xs list-disc list-inside">
                    {isCommercial ? (
                      <>
                        <li>{extTerms?.commercialScope || 'Toàn quyền sử dụng cho mục đích thương mại: livestream, ấn phẩm truyền thông, hoặc merchandise.'}</li>
                        <li>Thời hạn bảo hộ: <strong>Vĩnh viễn (Perpetual)</strong> • Lãnh thổ: <strong>Toàn cầu (Worldwide)</strong>.</li>
                        <li>Người mua không được mạo danh tác giả gốc hoặc đăng ký bảo hộ độc quyền nhãn hiệu trái phép.</li>
                      </>
                    ) : (
                      <>
                        <li>Toàn quyền sử dụng làm hình nền, avatar cá nhân trên mạng xã hội phi thương mại.</li>
                        <li>In ấn lưu niệm cá nhân phi lợi nhuận ({extTerms?.prohibitResale === false ? 'theo thỏa thuận với tác giả' : 'không bán thương mại hoặc chuyển nhượng cho bên thứ ba'}).</li>
                        <li>Thời hạn: <strong>Vĩnh viễn (Perpetual)</strong> • Lãnh thổ: <strong>Toàn cầu (Worldwide)</strong>.</li>
                      </>
                    )}
                    {extTerms && (
                      <>
                        <li>Ghi nguồn tác giả (Credit): <strong>{extTerms.requireCredit ? 'Bắt buộc ghi nguồn Creator' : 'Không bắt buộc'}</strong> • Đăng Portfolio: <strong>{extTerms.allowPortfolioDisplay ? 'Creator được phép đăng mẫu' : 'Giữ kín riêng tư'}</strong>.</li>
                        {extTerms.prohibitAiTraining && <li><strong>Cấm sử dụng tác phẩm để huấn luyện AI (AI Training) hoặc phát hành NFT.</strong></li>}
                        {extTerms.usageRestrictions && <li>Ghi ch? b? sung: {extTerms.usageRestrictions}</li>}
                      </>
                    )}
                  </ul>
                </div>

                {/* Cryptographic Hash Verification Box */}
                <div className="rounded-xl border border-white/10 bg-[#0E121E] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                      🔒 Mã Băm Tệp Gốc (SHA-256 Master File Hash)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="text-[11px] text-brand-periwinkle hover:underline font-medium flex items-center gap-1"
                    >
                      {copiedHash ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedHash ? 'Đã sao chép' : 'Sao chép mã'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-brand-periwinkle bg-black/40 p-2.5 rounded border border-white/5 break-all select-all">
                    {realHash}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * Mã băm mật mã độc bản này chứng minh tệp tin tải về là tệp gốc chính xác do tác giả bàn giao, chống mọi hành vi sửa đổi hoặc tráo file giả mạo.
                  </p>
                </div>

              </div>

            </div>

            {/* Certificate Footer (QR Verification & Platform Stamp) */}
            <div className="relative z-10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://dillustration.art/verify/${certCode}`}
                    alt="QR Verification"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-white block">Quét mã QR để tra cứu công khai:</span>
                  <span className="font-mono text-[11px] text-brand-periwinkle block">dillustration.art/verify/{certCode}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Xác thực chứng chỉ minh bạch cho các đối tác / nhà in ấn.</span>
                </div>
              </div>

              <div className="text-left sm:text-right sm:border-l sm:border-white/10 sm:pl-6 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">ĐƠN VỊ CẤP CHỨNG THỰC</span>
                <strong className="text-white text-xs font-h1">DILLUSTRATION Escrow &amp; Trust Authority</strong>
                <span className="text-[10px] text-slate-400 block">Ký điện tử bởi Hệ thống SEP490 • FPT University HCM</span>
              </div>
            </div>

          </div>



        </div>

      </div>
    </div>
  );
}
