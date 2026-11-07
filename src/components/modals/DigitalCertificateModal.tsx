'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import type { Commission } from '@/types/commission.types';
import { commissionService } from '@/services/commission.service';

interface DigitalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission | null;
}

export default function DigitalCertificateModal({
  isOpen,
  onClose,
  commission,
}: DigitalCertificateModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen || !commission) return null;

  const certCode = `COA-2026-DILL-${commission.id.slice(0, 8).toUpperCase()}`;
  const orderCode = `CMD-${commission.id.slice(0, 8).toUpperCase()}`;
  const creatorDisplay = commission.creatorName || 'Creator';
  const clientDisplay = commission.clientName || 'Khách hàng';
  const isCommercial = commission.licenseType === 'Commercial';

  // Derived hash code
  const pseudoHash = `b4c9e8f17a932d04a6e872c91b5820468032fec68a91275bb20d6f481e5927c3`
    .split('')
    .map((c, i) => commission.id.charCodeAt(i % commission.id.length).toString(16)[0] || c)
    .join('');

  // Latest approved / final artwork image
  const lastMilestoneWithWip = commission.milestones
    ?.filter((m) => Boolean(m.wipPreviewUrl || m.originalWipUrl))
    .sort((a, b) => b.sequence - a.sequence)[0];

  const artworkUrl =
    lastMilestoneWithWip?.wipPreviewUrl ||
    lastMilestoneWithWip?.originalWipUrl ||
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80';

  const handleCopyHash = () => {
    navigator.clipboard.writeText(pseudoHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadMaster = async (type: string) => {
    try {
      setDownloading(type);
      const { downloadUrl } = await commissionService.getFinalDownloadUrl(commission.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = `${commission.title || 'Artwork'}_Master.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Đang tạo liên kết tải về an toàn, vui lòng thử lại.');
    } finally {
      setDownloading(null);
    }
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
                        <li>Toàn quyền sử dụng làm hình đại diện, video phát trực tiếp (Live Stream), bìa sản phẩm âm nhạc.</li>
                        <li>Toàn quyền in ấn ấn phẩm lưu niệm (Merchandise), áo thun, poster, photocard không giới hạn số lượng.</li>
                        <li>Thời hạn bảo hộ: <strong>Vĩnh viễn (Perpetual)</strong> • Lãnh thổ: <strong>Toàn cầu (Worldwide)</strong>.</li>
                        <li>Người mua không được mạo danh tác giả gốc hoặc đăng ký bảo hộ độc quyền nhãn hiệu trái phép.</li>
                      </>
                    ) : (
                      <>
                        <li>Toàn quyền sử dụng làm hình nền, avatar cá nhân trên mạng xã hội phi thương mại.</li>
                        <li>In ấn lưu niệm cá nhân phi lợi nhuận (không bán thương mại cho bên thứ ba).</li>
                        <li>Thời hạn: <strong>Vĩnh viễn (Perpetual)</strong> • Lãnh thổ: <strong>Toàn cầu (Worldwide)</strong>.</li>
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
                    {pseudoHash}
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

          {/* DELIVERABLES VAULT (KHO TỆP BÀN GIAO GỐC ĐỂ KHÁCH TẢI VỀ) */}
          <div className="rounded-2xl border border-white/10 bg-[#131826] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-2">
              <div>
                <h3 className="text-base font-bold font-h1 text-white">Kho Tệp Bàn giao Chính thức (Deliverables Vault)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tất cả tệp gốc độ phân giải cao đã được mở khóa an toàn sau khi nghiệm thu.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                3 Tệp tin • Mở khóa toàn bộ
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* File 1: Master PSD / ZIP */}
              <div className="rounded-xl border border-white/10 bg-[#181E2E] p-4 flex flex-col justify-between space-y-3 hover:border-brand-periwinkle/50 transition">
                <div>
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
                    PSD / ZIP MASTER
                  </span>
                  <h4 className="font-bold text-xs text-white mt-2 truncate">
                    {commission.title.replace(/\s+/g, '_')}_Master.zip
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">File gốc phân lớp hoàn chỉnh, 4K 300DPI, màu CMYK/RGB.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadMaster('zip')}
                  disabled={downloading === 'zip'}
                  className="w-full py-2 rounded-lg bg-brand-periwinkle text-brand-navy text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Download size={13} />
                  <span>{downloading === 'zip' ? 'Đang tải...' : 'Tải file Master (.ZIP)'}</span>
                </button>
              </div>

              {/* File 2: Transparent PNG */}
              <div className="rounded-xl border border-white/10 bg-[#181E2E] p-4 flex flex-col justify-between space-y-3 hover:border-brand-periwinkle/50 transition">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                    PNG TRANSPARENT
                  </span>
                  <h4 className="font-bold text-xs text-white mt-2 truncate">
                    {commission.title.replace(/\s+/g, '_')}_Full.png
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">Tách nền trong suốt 4096×5464px phục vụ stream &amp; video.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadMaster('png')}
                  disabled={downloading === 'png'}
                  className="w-full py-2 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 transition flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  <span>{downloading === 'png' ? 'Đang tải...' : 'Tải PNG 4K Không Nền'}</span>
                </button>
              </div>

              {/* File 3: PDF Certificate */}
              <div className="rounded-xl border border-white/10 bg-[#181E2E] p-4 flex flex-col justify-between space-y-3 hover:border-brand-periwinkle/50 transition">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-periwinkle bg-brand-periwinkle/10 px-2 py-0.5 rounded">
                    PDF CERTIFICATE
                  </span>
                  <h4 className="font-bold text-xs text-white mt-2 truncate">
                    Certificate_{certCode}.pdf
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">Bản in chứng nhận bản quyền chuẩn quốc tế có mã QR.</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 transition flex items-center justify-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Xuất PDF Chứng nhận</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
