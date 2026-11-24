'use client';

import { Wordmark } from '@/components/brand/wordmark';
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

  // Năm trên chứng thư lấy từ chính đơn hàng, không hardcode.
  const certYear = new Date(commission.createdAt || Date.now()).getFullYear();
  const certCode = `COA-${certYear}-DILL-${commission.id.slice(0, 8).toUpperCase()}`;
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

  // Không có ảnh bàn giao thì để trống: in một bức tranh khác lên CHỨNG THƯ
  // BẢN QUYỀN là nói sai về tác phẩm được chứng nhận.
  const artworkUrl = lastMilestoneWithWip?.wipPreviewUrl || lastMilestoneWithWip?.originalWipUrl || '';

  const handleCopyHash = () => {
    if (!masterSha256) return;
    navigator.clipboard.writeText(masterSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#F0E7D8]/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-[#FFFCF6] border border-[#221E1A]/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Sticky Header */}
        <div className="shrink-0 px-6 py-4 bg-[#FFFCF6] border-b border-[#221E1A]/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2F6B63]/10 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold text-[#2F6B63] uppercase tracking-widest block">
                ĐƠN HÀNG ĐÃ HOÀN TẤT &amp; NGHIỆM THU 100%
              </span>
              <h2 className="font-h1 text-base sm:text-lg font-bold text-[#241F1A]">
                Chứng thư Bản quyền Số &amp; Kho Tệp Gốc
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-brand-periwinkle text-[#FFFCF6] font-bold text-xs hover:bg-[#8C3718] transition flex items-center gap-1.5 shadow"
            >
              <Printer size={14} />
              <span>In chứng nhận PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#FFFCF6] hover:bg-[#F0E7D8] text-[#746A5F] hover:text-[#241F1A] border border-[#221E1A]/10 transition"
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#FFFCF6]">
          
          {/* TẤM CHỨNG THƯ BẢN QUYỀN CAO CẤP (CERTIFICATE FRAME) */}
          <div className="relative rounded-2xl p-6 sm:p-10 text-[#241F1A] overflow-hidden bg-gradient-to-br from-[#FFFCF6]/95 to-[#FFFCF6]/98 border border-brand-periwinkle/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),0_0_30px_rgba(167,172,217,0.1)]">
            
            {/* Dashed Inner Border */}
            <div className="absolute inset-2 sm:inset-3 border border-dashed border-brand-periwinkle/25 rounded-xl pointer-events-none" />

            {/* Certificate Top Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#221E1A]/10 pb-6">
              <div className="flex items-center gap-3.5">
                <Wordmark size="sm" href={null} />
                <div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-brand-periwinkle">
                    DIGITAL CERTIFICATE OF AUTHENTICITY
                  </div>
                  <div className="text-xs font-bold text-[#241F1A] tracking-wide"> CHỨNG NHẬN BẢN QUYỀN SỐ ĐỘC BẢN </div>
                </div>
              </div>

              {/* Gold Seal Badge */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-[#241F1A] font-black text-lg shadow-md shrink-0 bg-gradient-to-tr from-[#E5D8C2] via-[#E5B358] to-[#FFE4A0]">
                  ✦
                </div>
                <div>
                  <div className="text-xs font-bold text-[#E5B358] uppercase tracking-wide">
                    VERIFIED ASSET
                  </div>
                  <div className="text-[10px] font-mono text-[#746A5F]"> CHỨNG THỰC BẢO HỘ 100% </div>
                </div>
              </div>
            </div>

            {/* Certificate Body (Split: Image & Legal Ownership) */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b border-[#221E1A]/10">
              
              {/* Left Column: Final Artwork Clean Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#221E1A]/10 bg-[#E5D8C2] shadow-2xl group">
                  {artworkUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artworkUrl}
                        alt={commission.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#E5D8C2] backdrop-blur-md border border-[#2F6B63]/40 text-[#2F6B63] font-mono text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                        <CheckCircle2 size={12} className="text-[#2F6B63]" />
                        <span>BẢN GỐC ĐÃ GỠ THỦY VÂN</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
                      <CheckCircle2 size={18} className="text-[#746A5F]" />
                      <p className="text-xs font-semibold text-[#241F1A]">Chưa có ảnh bàn giao</p>
                      <p className="text-[11px] text-[#746A5F]">
                        Đơn hàng hoàn tất nhưng họa sĩ chưa gắn ảnh nghiệm thu, nên chứng thư không
                        hiển thị ảnh.
                      </p>
                    </div>
                  )}
                  {/* Bỏ nhãn "4096 × 5464 px • 300 DPI": hệ thống không có dữ liệu kích thước
                      thật của tệp, nên con số đó chỉ là trang trí — không được in lên chứng thư. */}
                </div>
                <p className="text-[11px] text-center text-[#746A5F] italic"> Tác phẩm hoàn thiện chính thức sau nghiệm thu ký quỹ. </p>
              </div>

              {/* Right Column: Ownership & Rights */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-periwinkle bg-brand-periwinkle/10 px-2.5 py-0.5 rounded border border-brand-periwinkle/20">
                    MÃ CHỨNG THƯ: {certCode}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-h1 text-[#241F1A] mt-2">
                    {commission.title}
                  </h3>
                  <p className="text-xs text-[#746A5F] mt-1"> Dự án đơn vẽ theo yêu cầu: <code className="text-[#241F1A] font-mono font-bold">#{orderCode}</code>
                  </p>
                </div>

                {/* Parties Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#FFFCF6] border border-[#221E1A]/10 p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[#746A5F] uppercase block">Tác giả sáng tạo gốc</span>
                    <strong className="text-[#241F1A] text-sm block mt-0.5">{creatorDisplay}</strong>
                    <span className="text-xs text-brand-periwinkle block">@{creatorDisplay.toLowerCase().replace(/\s+/g, '')}</span>
                    <span className="text-[10px] text-[#746A5F] mt-1 block italic"> Giữ vĩnh viễn quyền nhân thân (Đ.19 Luật SHTT) </span>
                  </div>
                  <div className="border-l border-[#221E1A]/10 pl-4">
                    <span className="text-[10px] font-mono text-[#746A5F] uppercase block">Chủ sở hữu khai thác</span>
                    <strong className="text-[#241F1A] text-sm block mt-0.5">{clientDisplay}</strong>
                    <span className="text-xs text-[#2F6B63] block">@{clientDisplay.toLowerCase().replace(/\s+/g, '')}</span>
                    <span className="text-[10px] text-[#2F6B63] mt-1 block">
                      {isCommercial ? 'Toàn quyền thương mại (Đ.20 Luật SHTT)' : 'Quyền sử dụng cá nhân phi thương mại'}
                    </span>
                  </div>
                </div>

                {/* License Terms Scope */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-periwinkle">
                    Phạm vi Quyền Khai thác {isCommercial ? 'Thương mại (Commercial giấy phép Scope)' : 'Cá nhân (Personal giấy phép Scope)'}
                  </h4>
                  <ul className="space-y-1.5 text-[#746A5F] text-xs list-disc list-inside">
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
                        <li>Ghi nguồn tác giả: <strong>{extTerms.requireCredit ? 'Bắt buộc ghi nguồn họa sĩ' : 'Không bắt buộc'}</strong> • Đăng hồ sơ tác phẩm: <strong>{extTerms.allowPortfolioDisplay ? 'Họa sĩ được phép đăng mẫu' : 'Giữ kín riêng tư'}</strong>.</li>
                        {extTerms.prohibitAiTraining && <li><strong>Cấm sử dụng tác phẩm để huấn luyện AI (AI Training) hoặc phát hành NFT.</strong></li>}
                        {extTerms.usageRestrictions && <li>Ghi chú bổ sung: {extTerms.usageRestrictions}</li>}
                      </>
                    )}
                  </ul>
                </div>

                {/* Cryptographic Hash Verification Box */}
                <div className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#746A5F] uppercase flex items-center gap-1.5">
                      🔒 Mã Băm Tệp Gốc (SHA-256 Master tệp Hash)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="text-[11px] text-brand-periwinkle hover:underline font-medium flex items-center gap-1"
                    >
                      {copiedHash ? <Check size={11} className="text-[#2F6B63]" /> : <Copy size={11} />}
                      <span>{copiedHash ? 'Đã sao chép' : 'Sao chép mã'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-brand-periwinkle bg-[#F0E7D8] p-2.5 rounded border border-[#221E1A]/10 break-all select-all">
                    {realHash}
                  </div>
                  <p className="text-[10px] text-[#746A5F]">
                    * Mã băm mật mã độc bản này chứng minh tệp tin tải về là tệp gốc chính xác do tác giả bàn giao, chống mọi hành vi sửa đổi hoặc tráo tệp giả mạo.
                  </p>
                </div>

              </div>

            </div>

            {/* Certificate Footer (QR Verification & Platform Stamp) */}
            <div className="relative z-10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-[#F0E7D8] p-1 rounded-lg shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `${certCode} | ${commission.title} | ${realHash}`,
                    )}`}
                    alt="Mã QR chứa mã chứng thư và mã băm tệp gốc"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#241F1A] block">Quét mã QR để đọc mã chứng thư:</span>
                  {/* Bản cũ in ra `dillustration.art/verify/{code}` — một tên miền và một
                      trang xác thực KHÔNG tồn tại, quét QR ra 404. Giờ mã QR chứa đúng
                      dữ liệu thật của chứng thư: mã, tên tác phẩm, mã băm tệp gốc. */}
                  <span className="font-mono text-[11px] text-brand-periwinkle block">{certCode}</span>
                  <span className="text-[10px] text-[#746A5F] block mt-0.5">Mã QR chứa mã chứng thư, tên tác phẩm và mã băm tệp gốc để đối chiếu.</span>
                </div>
              </div>

              <div className="text-left sm:text-right sm:border-l sm:border-[#221E1A]/10 sm:pl-6 space-y-1">
                <span className="text-[10px] font-mono text-[#746A5F] uppercase block">ĐƠN VỊ CẤP CHỨNG THỰC</span>
                <strong className="text-[#241F1A] text-xs font-h1">DILLUSTRATION Escrow &amp; Trust Authority</strong>
                <span className="text-[10px] text-[#746A5F] block">Ký điện tử bởi Hệ thống SEP490 • FPT University HCM</span>
              </div>
            </div>

          </div>



        </div>

      </div>
    </div>
  );
}
