'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { auctionService } from '../services/auction.service';
import type { CommercialRightsDeedDto } from '../types/auction.types';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

interface CommercialRightsModalProps {
  auctionId?: string | null;
  artworkTitle?: string | null;
  creatorName?: string | null;
  onAgree?: () => void;
  onClose: () => void;
}

export function CommercialRightsModal({
  auctionId,
  artworkTitle,
  creatorName,
  onAgree,
  onClose,
}: CommercialRightsModalProps) {
  const [deed, setDeed] = useState<CommercialRightsDeedDto | null>(() => {
    if (!auctionId) {
      return {
        auctionId: 'DRAFT',
        artworkId: 'DRAFT',
        artworkTitle: artworkTitle || 'Bức tranh đang mở phiên đấu giá',
        artworkImageUrl: null,
        certificateNumber: 'DIL-DEED-DRAFT-STANDARD',
        verificationCode: 'VERIFY-DRAFT-SPEC',
        digitalSignature: 'Chữ ký số mật mã học SHA-256 sẽ tự động sinh và niêm phong khi phiên chốt thành công.',
        creatorId: 'CREATOR_CURRENT',
        creatorName: creatorName || 'Bạn (Tác giả / Người mở phiên)',
        ownerId: 'AUCTION_WINNER',
        ownerName: 'Người thắng cuộc đấu giá (Collector / Winner)',
        finalPrice: 0,
        settledAt: new Date().toISOString(),
        scopeOfRights: 'Exclusive Commercial Exploitation & Derivative Rights',
        commercialExploitationAllowed: true,
        vtuberAndGameDevAllowed: true,
        resellAllowed: true,
        moralRightsRetainedByArtist: true,
        termsAndConditions: '',
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(Boolean(auctionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) {
      return;
    }
    let active = true;
    const fetchDeed = async () => {
      try {
        setLoading(true);
        const data = await auctionService.getCommercialRights(auctionId);
        if (active) setDeed(data);
      } catch {
        if (active) setError('Không tải được văn bản quyền thương mại.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDeed();
    return () => {
      active = false;
    };
  }, [auctionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0E7D8]/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#2F6B63]/40 bg-[#F0E7D8] p-6 md:p-8 shadow-2xl text-on-surface">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full p-2 text-outline hover:bg-[#F0E7D8] hover:text-[#241F1A] transition"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Tiêu đề văn bản */}
        <div className="text-center border-b border-[#221E1A]/10 pb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2F6B63]/15 px-3.5 py-1 text-xs font-bold text-[#2F6B63]">
            <ShieldCheck size={15} /> DILLUSTRATION LEGAL FRAMEWORK
          </div>
          <h2 className="mt-3 font-h1 text-xl md:text-2xl font-bold tracking-tight text-[#241F1A] uppercase"> Văn bản bàn giao quyền khai thác thương mại </h2>
          <p className="mt-1 text-xs text-outline font-mono">
            COMMERCIAL RIGHTS &amp; DERIVATIVE EXPLOITATION DEED
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-outline"> Đang tải dữ liệu thỏa thuận bản quyền... </div>
        ) : error || !deed ? (
          <div className="py-8 text-center text-xs text-[#A8321C]">
            {error || 'Không tìm thấy dữ liệu.'}
          </div>
        ) : (
          <div className="mt-6 space-y-6 text-xs md:text-sm">
            {/* Tóm tắt các bên liên quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] p-4">
              <div>
                <span className="text-[11px] text-outline block">Bên chuyển giao (Original họa sĩ):</span>
                <p className="font-bold text-[#241F1A] text-base">{deed.creatorName}</p>
                <span className="text-[10px] text-outline font-mono">ID: {deed.creatorId}</span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Bên nhận chuyển giao (Winner / Collector):</span>
                <p className="font-bold text-[#2F6B63] text-base">{deed.ownerName}</p>
                <span className="text-[10px] text-outline font-mono">ID: {deed.ownerId}</span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#221E1A]/10 flex flex-wrap justify-between items-center text-xs">
                <span>Tranh: <strong className="text-[#241F1A]">{deed.artworkTitle}</strong></span>
                <span className="text-[#8A6A1F] font-mono font-bold">
                  {deed.finalPrice > 0 ? `Giá chốt: ${formatVnd(deed.finalPrice)}` : 'Giá chốt: Xác định khi phiên kết thúc'}
                </span>
              </div>
            </div>

            {/* Các điều khoản quyền lợi */}
            <div className="space-y-3.5 rounded-2xl border border-[#2F6B63]/30 bg-[#2F6B63]/15 p-5">
              <h3 className="font-bold text-[#241F1A] text-sm flex items-center gap-2 text-[#2F6B63]">
                <FileText size={16} /> Các quyền và cam kết được xác lập: </h3>

              <div className="space-y-3 text-xs text-on-surface leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241F1A]">Quyền sở hữu bức tranh (quyền tài sản 100%):</strong>
                    <p className="text-outline mt-0.5"> Bên nhận chuyển giao trở thành chủ sở hữu duy nhất của bức tranh: toàn quyền đối với bản số độc bản,
 và đối với bản tranh gốc vật lý nếu phiên đấu giá có kèm bản vật lý. </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241F1A]">Quyền khai thác thương mại hình ảnh bức tranh:</strong>
                    <p className="text-outline mt-0.5"> Được toàn quyền sử dụng hình ảnh bức tranh cho mục đích sinh lời: in ấn tranh để bán, đưa vào ấn phẩm
 quảng cáo, bao bì, nội dung truyền thông — không giới hạn doanh thu và không phải trả thêm phí tác quyền định kỳ. </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241F1A]">Quyền trưng bày &amp; cho mượn tranh:</strong>
                    <p className="text-outline mt-0.5"> Được trưng bày bức tranh tại không gian riêng, phòng tranh hoặc triển lãm, và được cho mượn tranh để
 giới thiệu với công chúng, miễn ghi rõ tên hoạ sĩ sáng tác. </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241F1A]">Quyền niêm yết bán lại bức tranh:</strong>
                    <p className="text-outline mt-0.5"> Được công nhận là chủ sở hữu hợp pháp của bức tranh, có quyền mở phiên đấu giá thứ cấp trên sàn
 Dillustration khi tranh tăng giá. </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#2F6B63] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241F1A]">Cam kết độc bản (Exclusivity):</strong>
                    <p className="text-outline mt-0.5"> Hoạ sĩ cam kết không vẽ lại, sao chép hoặc chuyển giao bức tranh này cho bất kỳ bên thứ ba nào khác. </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 p-3 mt-2">
                  <ShieldCheck size={18} className="text-[#8A6A1F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#8A6A1F]">Quyền nhân thân &amp; Quyền tác giả gốc bất khả xâm phạm (Moral Rights Retained):</strong>
                    <p className="text-[#241F1A]/90 mt-1 leading-relaxed"> Quyền tác giả và quyền đứng tên tác giả <strong className="text-[#241F1A] underline">vĩnh viễn và tuyệt đối thuộc về Hoạ sĩ sáng tác gốc ({deed.creatorName})</strong> theo Luật Sở hữu trí tuệ. Hoạ sĩ được bảo lưu quyền lưu giữ hình ảnh bức tranh trong hồ sơ năng lực (hồ sơ tác phẩm) cá nhân với tư cách là tác giả sáng tạo. </p>
                    <p className="text-outline mt-1 leading-relaxed"> Bên nhận chuyển giao nắm giữ 100% quyền tài sản đối với bức tranh, nhưng <strong className="text-[#8A6A1F]">tuyệt đối không được mạo danh mình là tác giả sáng tạo</strong> của bức tranh. Danh tính của tác giả gốc luôn được ghi nhận vĩnh viễn trên Giấy chứng nhận số (Certificate) và Chuỗi lai lịch. </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin chữ ký điện tử */}
            <div className="rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8] p-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-outline">
                <span>Số văn bản:</span>
                <span className="text-[#241F1A]">{deed.certificateNumber}</span>
              </div>
              <div className="flex justify-between text-outline">
                <span>Mã xác thực:</span>
                <span className="text-[#241F1A]">{deed.verificationCode}</span>
              </div>
              <div className="pt-2 border-t border-[#221E1A]/10">
                <span className="text-outline block text-[10px]">Chữ ký số SHA-256 bảo đảm tính pháp lý:</span>
                <span className="text-brand-periwinkle break-all select-all text-[10px]">
                  {deed.digitalSignature}
                </span>
              </div>
            </div>

            {/* Hành động */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221E1A]/10">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/20 bg-[#FFFCF6] px-4 py-2 text-xs font-semibold text-[#241F1A] hover:bg-[#F0E7D8] transition"
              >
                <Printer size={14} /> In / Lưu văn bản </button>
              {onAgree ? (
                <button
                  type="button"
                  onClick={() => {
                    onAgree();
                    onClose();
                  }}
                  className="rounded-full bg-[#2F6B63]/10 px-5 py-2 text-xs font-bold text-[#F0E7D8] hover:bg-[#2F6B63]/10 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Tôi đã hiểu và cam kết đồng ý </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-[#2F6B63]/10 px-5 py-2 text-xs font-bold text-[#F0E7D8] hover:bg-[#2F6B63]/10 transition"
                >
                  Đã hiểu &amp; Đóng   </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
