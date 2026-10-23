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
        artworkTitle: artworkTitle || 'Tác phẩm đang mở phiên đấu giá',
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
        scopeOfRights: '1-of-1 Exclusive Commercial Exploitation & Derivative Rights',
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
      setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#141724] p-6 md:p-8 shadow-2xl text-on-surface">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full p-2 text-outline hover:bg-white/10 hover:text-white transition"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Tiêu đề văn bản */}
        <div className="text-center border-b border-white/10 pb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-400">
            <ShieldCheck size={15} /> DILLUSTRATION LEGAL FRAMEWORK
          </div>
          <h2 className="mt-3 font-h1 text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
            Văn bản bàn giao quyền khai thác thương mại
          </h2>
          <p className="mt-1 text-xs text-outline font-mono">
            COMMERCIAL RIGHTS &amp; DERIVATIVE EXPLOITATION DEED
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-outline">
            Đang tải dữ liệu thỏa thuận bản quyền...
          </div>
        ) : error || !deed ? (
          <div className="py-8 text-center text-xs text-rose-400">
            {error || 'Không tìm thấy dữ liệu.'}
          </div>
        ) : (
          <div className="mt-6 space-y-6 text-xs md:text-sm">
            {/* Tóm tắt các bên liên quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div>
                <span className="text-[11px] text-outline block">Bên chuyển giao (Original Creator):</span>
                <p className="font-bold text-white text-base">{deed.creatorName}</p>
                <span className="text-[10px] text-outline font-mono">ID: {deed.creatorId}</span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Bên nhận chuyển giao (Winner / Collector):</span>
                <p className="font-bold text-emerald-300 text-base">{deed.ownerName}</p>
                <span className="text-[10px] text-outline font-mono">ID: {deed.ownerId}</span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-white/5 flex flex-wrap justify-between items-center text-xs">
                <span>Tác phẩm: <strong className="text-white">{deed.artworkTitle}</strong></span>
                <span className="text-amber-400 font-mono font-bold">
                  {deed.finalPrice > 0 ? `Giá chốt: ${formatVnd(deed.finalPrice)}` : 'Giá chốt: Xác định khi phiên kết thúc'}
                </span>
              </div>
            </div>

            {/* Các điều khoản quyền lợi */}
            <div className="space-y-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-emerald-300">
                <FileText size={16} /> Các quyền và cam kết được xác lập:
              </h3>

              <div className="space-y-3 text-xs text-on-surface leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Quyền khai thác thương mại 100%:</strong>
                    <p className="text-outline mt-0.5">
                      Bên nhận chuyển giao được toàn quyền sử dụng hình ảnh, thiết kế nhân vật trong các sản phẩm thương mại sinh lời không giới hạn doanh thu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Dự án Game &amp; Nhân vật ảo VTuber:</strong>
                    <p className="text-outline mt-0.5">
                      Toàn quyền rigging mô hình Live2D, dựng model 3D, làm nhân vật chính/phụ trong game indie hoặc game studio thương mại.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Sản xuất Merchandise &amp; Ấn phẩm:</strong>
                    <p className="text-outline mt-0.5">
                      Được quyền in ấn móc khóa, áo thun, figure, artbook thương mại không cần trả thêm phí tác quyền định kỳ.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Quyền niêm yết bán lại (Secondary Market / Resell):</strong>
                    <p className="text-outline mt-0.5">
                      Được công nhận là chủ sở hữu tài sản hợp pháp, có quyền mở phiên đấu giá thứ cấp trên sàn Dillustration khi tác phẩm tăng giá.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Cam kết độc bản (1-of-1 Exclusivity):</strong>
                    <p className="text-outline mt-0.5">
                      Họa sĩ cam kết không sao chép hoặc chuyển giao thiết kế này cho bất kỳ bên thứ ba nào khác.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 mt-2">
                  <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Quyền nhân thân &amp; Quyền tác giả gốc bất khả xâm phạm (Moral Rights Retained):</strong>
                    <p className="text-white/90 mt-1 leading-relaxed">
                      Quyền tác giả và quyền đứng tên tác giả <strong className="text-white underline">vĩnh viễn và tuyệt đối thuộc về Họa sĩ sáng tác gốc ({deed.creatorName})</strong> theo Luật Sở hữu trí tuệ. Họa sĩ được bảo lưu quyền lưu giữ tác phẩm trong hồ sơ năng lực (Portfolio) cá nhân với tư cách là tác giả sáng tạo.
                    </p>
                    <p className="text-outline mt-1 leading-relaxed">
                      Bên nhận chuyển giao nắm giữ 100% quyền tài sản và toàn quyền khai thác thương mại, nhưng <strong className="text-amber-200">tuyệt đối không được mạo danh mình là tác giả sáng tạo</strong> của tác phẩm. Danh tính của tác giả gốc luôn được ghi nhận vĩnh viễn trên Giấy chứng nhận số (Certificate) và Chuỗi lai lịch (Provenance).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin chữ ký điện tử */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-outline">
                <span>Số văn bản:</span>
                <span className="text-white">{deed.certificateNumber}</span>
              </div>
              <div className="flex justify-between text-outline">
                <span>Mã xác thực:</span>
                <span className="text-white">{deed.verificationCode}</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-outline block text-[10px]">Chữ ký số SHA-256 bảo đảm tính pháp lý:</span>
                <span className="text-brand-periwinkle break-all select-all text-[10px]">
                  {deed.digitalSignature}
                </span>
              </div>
            </div>

            {/* Hành động */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                <Printer size={14} /> In / Lưu văn bản
              </button>
              {onAgree ? (
                <button
                  type="button"
                  onClick={() => {
                    onAgree();
                    onClose();
                  }}
                  className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-[#141724] hover:bg-emerald-300 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Tôi đã hiểu và cam kết đồng ý
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-[#141724] hover:bg-emerald-300 transition"
                >
                  Đã hiểu &amp; Đóng
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
