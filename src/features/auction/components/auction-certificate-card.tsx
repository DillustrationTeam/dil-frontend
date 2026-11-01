'use client';

import { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCheck2,
  Printer,
  QrCode,
  Scroll,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { AuctionCertificateDto } from '../types/auction.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

// SVG Official Stamp / Dấu mộc Dillustration
function DillustrationOfficialSeal() {
  return (
    <div className="relative flex size-24 items-center justify-center rounded-full border-2 border-dashed border-amber-400/80 bg-amber-400/10 p-1 shadow-[0_0_15px_rgba(245,158,11,0.25)] select-none">
      <div className="flex size-full flex-col items-center justify-center rounded-full border border-amber-400/60 bg-black/40 text-center text-amber-400">
        <Sparkles size={14} className="text-amber-300 animate-pulse" />
        <span className="text-[7px] font-black tracking-widest uppercase">DILLUSTRATION</span>
        <span className="text-[6px] font-bold tracking-tighter text-amber-200">OFFICIAL SEAL</span>
        <span className="text-[5.5px] font-mono text-amber-400/80">★ 1-OF-1 ★</span>
      </div>
    </div>
  );
}

export function AuctionCertificateCard({
  certificate,
  onClose,
  onOpenCommercialRights,
}: {
  certificate: AuctionCertificateDto;
  onClose: () => void;
  onOpenCommercialRights?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auctions/${certificate.auctionId}`
    : `https://dillustration.com/auctions/${certificate.auctionId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    verifyUrl,
  )}&color=A7ACD9&bgcolor=171926`;

  const copySignature = () => {
    navigator.clipboard.writeText(certificate.digitalSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsPng = async () => {
    setExportingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Nền gradient VIP
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 760);
      bgGrad.addColorStop(0, '#0d101d');
      bgGrad.addColorStop(0.5, '#15192d');
      bgGrad.addColorStop(1, '#090a12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 760);

      // Viền ngoài ánh kim vàng / periwinkle
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1160, 720);

      ctx.strokeStyle = '#A7ACD9';
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 26, 1148, 708);

      // Tiêu đề
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 15px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DILLUSTRATION OFFICIAL CERTIFIED VAULT • 1-OF-1 EXCLUSIVE', 600, 70);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px "Sora", sans-serif';
      ctx.fillText('CHỨNG NHẬN QUYỀN SỞ HỮU ĐỘC BẢN 1-OF-1', 600, 115);

      ctx.fillStyle = '#A7ACD9';
      ctx.font = '14px monospace';
      ctx.fillText(`MÃ CHỨNG CHỈ: ${certificate.certificateNumber}`, 600, 145);

      // Đường kẻ ngăn
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(80, 170);
      ctx.lineTo(1120, 170);
      ctx.stroke();

      // Cột trái: Thông tin tác phẩm & chủ sở hữu
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px sans-serif';
      ctx.fillText('TÁC PHẨM (ARTWORK):', 80, 220);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Sora", sans-serif';
      ctx.fillText(certificate.artworkTitle || 'Untitled Artwork', 80, 255);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px sans-serif';
      ctx.fillText('HỌA SĨ SÁNG TÁC (ORIGINAL CREATOR):', 80, 315);
      ctx.fillStyle = '#A7ACD9';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(certificate.creatorName || 'Dillustration Artist', 80, 345);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px sans-serif';
      ctx.fillText('CHỦ SỞ HỮU HIỆN TẠI (EXCLUSIVE OWNER):', 80, 405);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(certificate.ownerName || 'Exclusive Collector', 80, 435);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px sans-serif';
      ctx.fillText('GIÁ CHỐT PHIÊN (WINNING FINAL PRICE):', 80, 495);
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(formatVnd(certificate.finalPrice), 80, 525);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px sans-serif';
      ctx.fillText('NGÀY BÀN GIAO QUYỀN SỞ HỮU:', 80, 580);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '15px monospace';
      ctx.fillText(new Date(certificate.issuedAt).toLocaleString('vi-VN'), 80, 605);

      // Cột phải: Dấu mộc & QR Code
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(780, 200, 340, 420);
      ctx.strokeStyle = 'rgba(245,158,11,0.3)';
      ctx.strokeRect(780, 200, 340, 420);

      // Dấu mộc Dillustration
      ctx.beginPath();
      ctx.arc(950, 280, 50, 0, Math.PI * 2);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('DILLUSTRATION VERIFIED', 950, 275);
      ctx.fillText('★ 1-OF-1 OFFICIAL ★', 950, 292);

      // Mã xác thực
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px sans-serif';
      ctx.fillText('MÃ XÁC MINH SỞ HỮU:', 950, 360);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(certificate.verificationCode, 950, 380);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('QUYỀN THƯƠNG MẠI TOÀN PHẦN (COMMERCIAL DEED)', 950, 420);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.fillText('Toàn quyền làm Game, VTuber & Chuyển nhượng', 950, 440);

      // Chữ ký số SHA-256 dưới đáy
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px monospace';
      ctx.fillText('SHA-256 DIGITAL SIGNATURE:', 80, 680);
      ctx.fillStyle = '#A7ACD9';
      ctx.fillText(certificate.digitalSignature, 80, 700);

      // Tải ảnh về máy
      const dataUrl = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = dataUrl;
      downloadAnchor.download = `Dillustration-VIP-Card-${certificate.certificateNumber}.png`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch {
      window.print();
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        ref={cardRef}
        className="relative w-full max-w-3xl rounded-3xl border-2 border-amber-400/40 bg-gradient-to-br from-[#181c2e] via-[#121524] to-[#0a0c16] p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-on-surface"
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full p-2 text-outline hover:bg-white/10 hover:text-white transition"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Header Thẻ VIP */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300">
              <Sparkles size={14} className="text-amber-400" />
              DILLUSTRATION VIP CERTIFIED • 1-OF-1 EXCLUSIVE
            </div>
            <h2 className="mt-2.5 font-h1 text-xl md:text-2xl font-bold tracking-tight text-white">
              CHỨNG NHẬN QUYỀN SỞ HỮU ĐỘC BẢN 1-OF-1
            </h2>
            <p className="font-mono text-xs text-brand-periwinkle mt-0.5">
              Mã chứng chỉ: <span className="text-white font-bold">{certificate.certificateNumber}</span>
            </p>
          </div>

          <div className="hidden sm:block">
            <DillustrationOfficialSeal />
          </div>
        </div>

        {/* Nội dung chính thẻ VIP */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs md:text-sm">
          {/* Cột 1 & 2: Dữ liệu sở hữu */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-outline block">Tác phẩm độc bản (Artwork)</span>
                  <p className="font-bold text-base md:text-lg text-white">{certificate.artworkTitle}</p>
                  {certificate.style && (
                    <span className="inline-block mt-1 text-[11px] text-brand-periwinkle bg-brand-periwinkle/10 px-2 py-0.5 rounded-md">
                      Phong cách: {certificate.style}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-outline block">Giá chốt phiên (Final Price)</span>
                  <p className="font-mono font-bold text-base md:text-lg text-amber-400">
                    {formatVnd(certificate.finalPrice)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div>
                  <span className="text-[11px] text-outline block">Họa sĩ sáng tác (Creator)</span>
                  <p className="font-semibold text-white">{certificate.creatorName || 'Dillustration Artist'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-outline block">Chủ sở hữu hiện tại (Owner)</span>
                  <p className="font-semibold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck size={14} />
                    {certificate.ownerName || 'Exclusive Collector'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quyền thương mại & Giấy phép */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <FileCheck2 size={15} /> Phạm vi giấy phép:
                </span>
                <span className="font-bold text-white">{certificate.licenseType}</span>
              </div>
              <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                Toàn quyền khai thác thương mại, làm dự án Game, thiết kế nhân vật VTuber, phát hành ấn phẩm và niêm yết bán lại trên thị trường thứ cấp.
              </p>
            </div>

            {/* Cam kết bảo hộ quyền nhân thân */}
            <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-outline">
              <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Bảo hộ Quyền nhân thân vĩnh viễn:</strong> Họa sĩ{' '}
                <span className="text-brand-periwinkle font-semibold">{certificate.creatorName || 'Dillustration Artist'}</span>{' '}
                là tác giả gốc bất khả xâm phạm. Chủ sở hữu nắm giữ quyền sở hữu &amp; quyền thương mại độc bản, không được mạo danh tác giả sáng tác.
              </div>
            </div>

            {/* Chữ ký số SHA-256 */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-center justify-between text-[11px] text-outline">
                <span>Chữ ký số SHA-256 (Digital Signature):</span>
                <button
                  type="button"
                  onClick={copySignature}
                  className="inline-flex items-center gap-1 text-[10px] text-brand-periwinkle hover:text-white"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
              <p className="mt-1 font-mono text-[10px] text-brand-periwinkle/90 break-all select-all">
                {certificate.digitalSignature}
              </p>
            </div>
          </div>

          {/* Cột 3: Mã QR & Tra cứu */}
          <div className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-brand-periwinkle">
                <QrCode size={15} /> Quét mã tra cứu
              </div>
              <div className="relative mx-auto size-32 rounded-xl overflow-hidden border border-brand-periwinkle/30 bg-[#171926] p-1.5 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR Code verification for ${certificate.certificateNumber}`}
                  className="size-full object-contain rounded-lg"
                />
              </div>
              <span className="text-[10px] font-mono text-outline block">
                Mã: {certificate.verificationCode}
              </span>
            </div>

            <div className="w-full pt-3 border-t border-white/10 space-y-1">
              <span className="text-[10px] text-outline block">Ngày chốt chứng chỉ</span>
              <span className="text-xs font-mono text-white">
                {new Date(certificate.issuedAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Hành động dưới Modal */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            {onOpenCommercialRights && (
              <button
                type="button"
                onClick={onOpenCommercialRights}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <Scroll size={14} /> Giấy bàn giao quyền thương mại
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportAsPng}
              disabled={exportingPng}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/25 transition disabled:opacity-50"
            >
              <Download size={14} /> {exportingPng ? 'Đang xuất ảnh...' : 'Xuất ảnh thẻ VIP (PNG)'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-white/10 transition"
            >
              <Printer size={14} /> In / Xuất PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
