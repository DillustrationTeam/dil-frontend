'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  ImagePlus,
  Package,
  Receipt,
  Send,
  Star,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import type { AuctionDetailDto } from '../types/auction.types';
import { auctionError, auctionService } from '../services/auction.service';
import { SellerPenaltyLadder } from './seller-penalty-ladder';

interface PhysicalDeliveryCardProps {
  auction: AuctionDetailDto;
  userId: string | null;
  onReload: () => void;
}

function formatVnd(val?: number | null) {
  if (val === null || val === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
}

export function PhysicalDeliveryCard({ auction, userId, onReload }: PhysicalDeliveryCardProps) {
  const isWinner = Boolean(userId && auction.winnerId && userId === auction.winnerId);
  const isSeller = Boolean(userId && auction.seller && userId === auction.seller.userId);
  const delivery = auction.delivery;
  const receipts = auction.receipts ?? [];

  // Người mua chỉ xác nhận được khi người bán đã gửi hàng (backend cũng chặn y như vậy).
  // Khiếu nại được khi đơn còn "sống" và ký quỹ chưa giải ngân:
  // phiên phải đang AwaitingPhysical / InTransit, đơn chưa Delivered/Disputed/Cancelled.
  // Đơn còn phải giao khi bưu phẩm chưa xong. Phiên Completed KHÔNG chặn giao hàng:
  // người mua có thể đã nhận bản điện tử nhưng vẫn yêu cầu nhận tranh vật lý.
  const isDeliveryActive = Boolean(
    delivery &&
      ['AwaitingShipment', 'InTransit'].includes(delivery.status) &&
      !['Cancelled', 'Disputed', 'Expired'].includes(auction.auctionStatus),
  );

  // Form states
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    recipientName: '',
    recipientPhone: '',
    shippingAddress: '',
    noteToSeller: '',
  });

  const [showShipForm, setShowShipForm] = useState(false);
  const [shipForm, setShipForm] = useState({
    carrierName: 'VNPost',
    trackingCode: '',
    trackingUrl: '',
    shippingReceiptUrl: '',
    packageImageUrl: '',
  });

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState('');
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceName, setEvidenceName] = useState<string | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  // Modal xác nhận "đã nhận hàng" (tránh bấm nhầm làm giải ngân ký quỹ)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Đánh giá người bán sau khi giao dịch khép lại
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);

  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  // Ảnh biên lai / ảnh kiện hàng người bán tải trực tiếp từ máy
  const [uploadingShipEvidence, setUploadingShipEvidence] = useState<'receipt' | 'package' | null>(null);
  const [shipEvidencePreview, setShipEvidencePreview] = useState<{ receipt?: string; package?: string }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Người thắng gửi yêu cầu nhận tranh vật lý
  const handleRequestDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.recipientName || !requestForm.recipientPhone || !requestForm.shippingAddress) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auctionService.requestPhysicalDelivery(auction.auctionId, requestForm);
      setSuccessMsg('Đã gửi yêu cầu nhận tranh vật lý thành công! Người bán sẽ gửi hàng cho bạn.');
      setShowRequestForm(false);
      onReload();
    } catch (err) {
      setError(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Người thắng chọn chỉ nhận file số
  const handleDeclineDelivery = async () => {
    if (!confirm('Bạn có chắc chắn muốn bỏ qua tranh vật lý và chỉ nhận file số chất lượng cao không? Tiền sẽ được quyết toán ngay cho người bán.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auctionService.declinePhysicalDelivery(auction.auctionId);
      setSuccessMsg('Đã chuyển sang hình thức nhận file số. Tiền đã giải ngân cho người bán!');
      onReload();
    } catch (err) {
      setError(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Người bán cập nhật mã vận đơn & biên lai
  const handleUpdateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipForm.carrierName || !shipForm.trackingCode) {
      setError('Vui lòng nhập tên đơn vị vận chuyển và mã vận đơn.');
      return;
    }

    // Bắt buộc ít nhất 1 trong 3 bằng chứng gửi hàng (khớp validate bên backend)
    const hasProof =
      Boolean(shipForm.shippingReceiptUrl?.trim()) ||
      Boolean(shipForm.packageImageUrl?.trim()) ||
      Boolean(shipForm.trackingUrl?.trim());

    if (!hasProof) {
      setError(
        'Vui lòng cung cấp ít nhất một bằng chứng gửi hàng: ảnh biên lai bưu cục, ảnh kiện hàng hoặc link tra cứu hành trình.',
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auctionService.updateShipping(auction.auctionId, shipForm);
      setSuccessMsg('Đã cập nhật thông tin vận chuyển bưu cục thành công!');
      setShowShipForm(false);
      onReload();
    } catch (err) {
      setError(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3b. Người bán chọn ảnh biên lai / ảnh kiện hàng từ máy
  const handleShipEvidencePicked = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'receipt' | 'package',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Ảnh tối đa 8MB.');
      return;
    }

    try {
      setUploadingShipEvidence(kind);
      setError(null);
      const res = await auctionService.uploadShippingEvidence(auction.auctionId, file, kind);
      setShipForm((prev) =>
        kind === 'receipt'
          ? { ...prev, shippingReceiptUrl: res.fileUrl }
          : { ...prev, packageImageUrl: res.fileUrl },
      );
      setShipEvidencePreview((prev) => ({ ...prev, [kind]: URL.createObjectURL(file) }));
    } catch (err) {
      setError(auctionError(err) || 'Không tải được ảnh.');
    } finally {
      setUploadingShipEvidence(null);
    }
  };

  const handleRemoveShipEvidence = (kind: 'receipt' | 'package') => {
    setShipForm((prev) =>
      kind === 'receipt'
        ? { ...prev, shippingReceiptUrl: '' }
        : { ...prev, packageImageUrl: '' },
    );
    setShipEvidencePreview((prev) => ({ ...prev, [kind]: undefined }));
  };

  // 4. Người mua xác nhận nhận tranh & hài lòng
  const handleConfirmDelivery = async () => {
    try {
      setLoading(true);
      setError(null);
      await auctionService.confirmDelivery(auction.auctionId);
      setSuccessMsg('Xác nhận thành công! Giao dịch đã hoàn tất và tiền ký quỹ đã được giải ngân.');
      setShowConfirmModal(false);
      setConfirmChecked(false);
      onReload();
    } catch (err) {
      setError(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  // 5. Người mua tải ảnh bằng chứng trực tiếp từ máy
  const handleEvidencePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Ảnh bằng chứng tối đa 8MB.');
      return;
    }

    try {
      setUploadingEvidence(true);
      setError(null);
      const res = await auctionService.uploadDisputeEvidence(auction.auctionId, file);
      setDisputeEvidenceUrl(res.fileUrl);
      setEvidencePreview(URL.createObjectURL(file));
      setEvidenceName(res.fileName);
    } catch (err) {
      setError(auctionError(err) || 'Không tải được ảnh bằng chứng.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleRemoveEvidence = () => {
    setDisputeEvidenceUrl('');
    setEvidencePreview(null);
    setEvidenceName(null);
    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = '';
    }
  };

  // 5. Người mua gửi khiếu nại
  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setError('Vui lòng cung cấp lý do khiếu nại.');
      return;
    }
    if (!disputeEvidenceUrl) {
      setError('Vui lòng tải lên ít nhất một ảnh bằng chứng (ảnh bưu kiện hư hại / biên bản bưu cục).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auctionService.disputeDelivery(auction.auctionId, {
        reason: disputeReason,
        evidenceUrl: disputeEvidenceUrl,
      });
      setSuccessMsg('Đã gửi khiếu nại. Khoản tiền ký quỹ đã được tạm đóng băng để đối soát cùng bưu cục.');
      setShowDisputeForm(false);
      setDisputeReason('');
      handleRemoveEvidence();
      onReload();
    } catch (err) {
      setError(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  // 6. Người mua đánh giá người bán sau khi giao dịch khép lại
  const handleRateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingValue < 1) {
      setError('Vui lòng chọn số sao trước khi gửi đánh giá.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auctionService.rateAuctionSeller(auction.auctionId, {
        rating: ratingValue,
        comment: ratingComment.trim() || null,
      });
      setRatingDone(true);
      setSuccessMsg(`Đã gửi đánh giá ${ratingValue}/5 sao cho người bán. Cảm ơn bạn!`);
      onReload();
    } catch (err) {
      setError(auctionError(err) || 'Không gửi được đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-5 md:p-6 space-y-4">
      {/* Header card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-h1 text-sm font-bold text-white flex items-center gap-2">
              Bản tranh vật lý & Giao vận an toàn
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                P2P Escrow
              </span>
            </h3>
            <p className="text-xs text-outline">
              Sàn trung gian bảo chứng ký quỹ 100% · Nhả tiền sau khi người mua xác nhận đã nhận tranh
            </p>
          </div>
        </div>

        {receipts.length > 0 && (
          <button
            type="button"
            onClick={() => setShowReceiptsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition"
          >
            <Receipt size={14} /> Xem biên lai minh bạch ({receipts.length})
          </button>
        )}
      </div>

      {/* Thông báo kết quả */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {/* Mô tả tranh vật lý từ Họa sĩ */}
      {auction.physicalDescription && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-on-surface-variant space-y-1">
          <span className="font-semibold text-brand-periwinkle">Chi tiết tranh vật lý từ người bán:</span>
          <p className="text-white/90 whitespace-pre-wrap">{auction.physicalDescription}</p>
        </div>
      )}

      {/* Tùy chọn dành cho Người thắng phiên khi đang ở trạng thái AwaitingPhysical */}
      {isWinner && auction.auctionStatus === 'AwaitingPhysical' && !auction.requiresPhysicalDelivery && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-950/40 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-300">
                Lựa chọn nhận tranh vật lý (Hạn chót trong 48 giờ)
              </h4>
              <p className="text-xs text-outline">
                Bạn có thể yêu cầu Người bán gửi bản gốc vật lý tận nơi (có bưu cục đối soát), hoặc chỉ nhận file số độc quyền để hoàn tất phiên ngay.
              </p>
              <p className="text-xs text-amber-200/70">
                Quá 48 giờ mà bạn chưa chọn, phiên sẽ <span className="font-semibold text-amber-200">tự huỷ và hoàn lại toàn bộ tiền về ví của bạn</span>; tác phẩm trở về quyền sở hữu của Người bán. Bạn cũng sẽ không nhận được file gốc của phiên này.
              </p>
            </div>
          </div>

          {!showRequestForm ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-brand-navy hover:brightness-110 transition"
              >
                <Truck size={15} /> Yêu cầu nhận tranh vật lý
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeclineDelivery}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                Chỉ nhận file số (Bỏ qua tranh thật)
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestDelivery} className="mt-3 space-y-3 border-t border-white/10 pt-3">
              <h5 className="text-xs font-bold text-white">Điền thông tin địa chỉ nhận tranh:</h5>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  placeholder="Họ và tên người nhận *"
                  value={requestForm.recipientName}
                  onChange={(e) => setRequestForm((p) => ({ ...p, recipientName: e.target.value }))}
                  className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại nhận hàng *"
                  value={requestForm.recipientPhone}
                  onChange={(e) => setRequestForm((p) => ({ ...p, recipientPhone: e.target.value }))}
                  className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Địa chỉ giao hàng chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP) *"
                value={requestForm.shippingAddress}
                onChange={(e) => setRequestForm((p) => ({ ...p, shippingAddress: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
              />
              <textarea
                rows={2}
                placeholder="Ghi chú thêm cho người bán (nếu có)..."
                value={requestForm.noteToSeller}
                onChange={(e) => setRequestForm((p) => ({ ...p, noteToSeller: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Gửi địa chỉ nhận tranh'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-outline hover:text-white"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Thông tin đơn vận chuyển khi đã có delivery */}
      {delivery && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-3 text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Truck size={15} className="text-amber-400" />
              Tình trạng bưu kiện:
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-amber-300 font-mono font-bold">
                {delivery.status === 'AwaitingShipment' && 'Chờ người bán gửi hàng'}
                {delivery.status === 'InTransit' && 'Đang vận chuyển qua bưu cục'}
                {delivery.status === 'Delivered' && 'Đã giao thành công'}
                {delivery.status === 'Disputed' && 'Đang khiếu nại (Đóng băng ký quỹ)'}
                {delivery.status === 'Resolved' && 'Khiếu nại đã đóng — không hoàn tiền'}
                {delivery.status === 'Cancelled' && 'Đã hủy'}
                {auction.auctionStatus === 'Completed' && delivery.status !== 'Delivered' && delivery.status !== 'Cancelled' && ' · đã giải ngân trước, không còn bảo vệ bưu phẩm'}
              </span>
            </span>

            {delivery.trackingCode && (
              <span className="font-mono text-outline">
                Hãng: <strong className="text-white">{delivery.carrierName}</strong> · Mã vận đơn: <strong className="text-amber-300">{delivery.trackingCode}</strong>
              </span>
            )}
          </div>

          <div className="grid gap-2 text-xs text-outline sm:grid-cols-2">
            <div>
              <p>• Người nhận: <strong className="text-white">{delivery.recipientName}</strong> ({delivery.recipientPhone})</p>
              <p>• Địa chỉ: <span className="text-white">{delivery.shippingAddress}</span></p>
              {delivery.noteToSeller && <p>• Ghi chú: <span className="text-amber-200/90">{delivery.noteToSeller}</span></p>}
            </div>
            <div className="space-y-1">
              {delivery.shippedAt && <p>• Ngày gửi bưu cục: <span className="font-mono text-white">{new Date(delivery.shippedAt).toLocaleString('vi-VN')}</span></p>}
              {delivery.confirmedAt && <p>• Ngày xác nhận nhận: <span className="font-mono text-emerald-300">{new Date(delivery.confirmedAt).toLocaleString('vi-VN')}</span></p>}
              {delivery.shippingReceiptUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedReceiptImage(delivery.shippingReceiptUrl || null)}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:underline"
                >
                  <FileText size={12} className="shrink-0" /> Xem ảnh biên lai bưu cục
                  <ExternalLink size={11} />
                </button>
              )}
              {delivery.packageImageUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedReceiptImage(delivery.packageImageUrl || null)}
                  className="inline-flex items-center gap-1 text-[11px] text-brand-periwinkle hover:underline"
                >
                  <Package size={12} className="shrink-0" /> Xem ảnh kiện hàng đã đóng gói
                  <ExternalLink size={11} />
                </button>
              )}
              {delivery.trackingUrl && /^https?:\/\//i.test(delivery.trackingUrl) && (
                <a
                  href={delivery.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:underline"
                >
                  <Truck size={12} className="shrink-0" /> Tra cứu hành trình bưu phẩm
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Hành động của Người bán: Cập nhật thông tin gửi hàng */}
          {/* Chỉ hiện khi phiên còn sống — Completed/Disputed thì không gửi hàng được nữa (backend chặn) */}
          {isSeller && delivery.status === 'AwaitingShipment' && isDeliveryActive && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              {!showShipForm ? (
                <button
                  type="button"
                  onClick={() => setShowShipForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110"
                >
                  <Send size={14} /> Nhập mã vận đơn & Biên lai gửi bưu cục
                </button>
              ) : (
                <form onSubmit={handleUpdateShipping} className="space-y-3 bg-black/20 p-3 rounded-xl">
                  <h5 className="text-xs font-bold text-white">Cập nhật vận đơn chuyển phát:</h5>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      placeholder="Tên hãng vận chuyển (VNPost, ViettelPost, GHTK...)"
                      value={shipForm.carrierName}
                      onChange={(e) => setShipForm((p) => ({ ...p, carrierName: e.target.value }))}
                      className="rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Mã vận đơn bưu cục *"
                      value={shipForm.trackingCode}
                      onChange={(e) => setShipForm((p) => ({ ...p, trackingCode: e.target.value }))}
                      className="rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  {/* Bắt buộc ít nhất 1 trong 3: link tra cứu, ảnh biên lai, ảnh kiện hàng */}
                  <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      Bắt buộc điền <strong>ít nhất một</strong> trong ba mục bên dưới: link tra cứu hành trình,
                      ảnh biên lai bưu cục hoặc ảnh kiện hàng — để người mua đối soát được bưu phẩm.
                    </span>
                  </div>

                  <input
                    type="url"
                    placeholder="Link tra cứu hành trình (một trong ba bằng chứng bắt buộc)"
                    value={shipForm.trackingUrl}
                    onChange={(e) => setShipForm((p) => ({ ...p, trackingUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white focus:outline-none"
                  />

                  {/* Ảnh biên lai bưu cục + ảnh kiện hàng: tải trực tiếp từ máy,
                      cả người mua và người bán đều xem lại được trong thẻ này */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        { kind: 'receipt' as const, label: 'Ảnh biên lai bưu cục', Icon: FileText },
                        { kind: 'package' as const, label: 'Ảnh kiện hàng đã đóng gói', Icon: Package },
                      ]
                    ).map((slot) => {
                      const uploadedUrl =
                        slot.kind === 'receipt' ? shipForm.shippingReceiptUrl : shipForm.packageImageUrl;
                      const inputId = `ship-evidence-${slot.kind}`;
                      return (
                        <div
                          key={slot.kind}
                          className="rounded-xl border border-white/15 bg-black/25 p-2.5 space-y-1.5"
                        >
                          <p className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                            <slot.Icon size={13} className="shrink-0 text-amber-300" />
                            {slot.label}
                            <span className="font-normal text-outline">(JPG/PNG/WebP ≤ 8MB)</span>
                          </p>

                          <input
                            id={inputId}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleShipEvidencePicked(e, slot.kind)}
                          />

                          {uploadedUrl ? (
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={shipEvidencePreview[slot.kind] || uploadedUrl}
                                alt={slot.label}
                                className="h-12 w-12 rounded-lg object-cover border border-white/15"
                              />
                              <a
                                href={uploadedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-brand-periwinkle underline"
                              >
                                Xem ảnh
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveShipEvidence(slot.kind)}
                                className="ml-auto rounded-lg border border-rose-500/30 bg-rose-500/10 p-1 text-rose-300 hover:bg-rose-500/20"
                                title="Xoá ảnh"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={uploadingShipEvidence === slot.kind}
                              onClick={() => document.getElementById(inputId)?.click()}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/25 px-2 py-2 text-[11px] font-semibold text-white hover:bg-white/5 disabled:opacity-50"
                            >
                              <ImagePlus size={13} />
                              {uploadingShipEvidence === slot.kind ? 'Đang tải...' : 'Chọn ảnh từ máy'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Thang cảnh báo 5 mức: đặt ngay trên nút gửi để người bán đọc hậu quả
                      trước khi xác nhận gửi hàng, và thấy mình đang đứng ở mức nào. */}
                  <SellerPenaltyLadder level={auction.sellerPenaltyLevel ?? 0} />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? 'Đang gửi...' : 'Xác nhận đã gửi hàng'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShipForm(false)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs text-outline"
                    >
                      Đóng
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Hành động của Người mua: Xác nhận nhận tranh hoặc khiếu nại */}
          {isWinner && isDeliveryActive && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              {delivery.status === 'AwaitingShipment' && (
                <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
                  Người bán chưa cập nhật vận đơn. Nếu bạn đã nhận được tranh, hãy bấm “Đã nhận hàng”. Nếu quá hạn gửi hoặc không liên hệ được với người bán, hãy gửi khiếu nại kèm ảnh bằng chứng.
                </p>
              )}
              {delivery.status === 'InTransit' && delivery.autoConfirmAt && (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200">
                  Nếu bạn không xác nhận, đơn sẽ <strong>tự động hoàn tất sau 48 giờ</strong> kể từ lúc người bán gửi hàng
                  ({new Date(delivery.autoConfirmAt).toLocaleString('vi-VN')}).
                </p>
              )}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setConfirmChecked(false);
                    setShowConfirmModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} /> Đã nhận hàng
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisputeForm((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  <AlertTriangle size={14} /> Khiếu nại bưu phẩm
                </button>
              </div>

              {showDisputeForm && (
                <form onSubmit={handleDispute} className="space-y-2 bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                  <h5 className="text-xs font-bold text-rose-300">Gửi khiếu nại đơn giao tranh:</h5>
                  {auction.auctionStatus === 'Completed' && (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-[11px] text-amber-200">
                      Phiên này đã giải ngân cho người bán nên <strong>không thể hoàn tiền</strong>. Khiếu nại vẫn
                      được ghi nhận để Ban quản trị đối soát bưu cục, và bạn có thể đánh giá người bán sau đó.
                    </p>
                  )}
                  <textarea
                    required
                    rows={2}
                    placeholder="Mô tả lý do (hàng vỡ hỏng, sai kích thước, chưa nhận được hàng...)"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 p-2 text-xs text-white focus:outline-none"
                  />

                  {/* Ảnh bằng chứng: bắt buộc, tải trực tiếp từ máy */}
                  <div className="rounded-xl border border-rose-500/25 bg-black/30 p-2.5 space-y-2">
                    <p className="text-[11px] font-semibold text-rose-200">
                      Ảnh bằng chứng <span className="text-rose-400">*</span>
                      <span className="ml-1 font-normal text-outline">(ảnh bưu kiện hư hại, biên bản bưu cục — JPG/PNG/WebP, tối đa 8MB)</span>
                    </p>

                    <input
                      ref={evidenceInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleEvidencePicked}
                      className="hidden"
                      id="disputeEvidenceInput"
                    />

                    {disputeEvidenceUrl ? (
                      <div className="flex items-center gap-2.5">
                        {evidencePreview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={evidencePreview}
                            alt="Ảnh bằng chứng"
                            className="h-16 w-16 rounded-lg object-cover border border-white/15"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-white">
                            {evidenceName || 'Ảnh bằng chứng'}
                          </p>
                          <a
                            href={disputeEvidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-brand-periwinkle underline"
                          >
                            Xem ảnh đã tải <ExternalLink size={10} />
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveEvidence}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                          title="Xoá ảnh bằng chứng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        disabled={uploadingEvidence}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-rose-400/40 bg-rose-500/5 px-3 py-2.5 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <ImagePlus size={14} />
                        {uploadingEvidence ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy tính'}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || uploadingEvidence || !disputeEvidenceUrl}
                      className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? 'Đang gửi...' : 'Gửi khiếu nại ngay'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm(false)}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-outline"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Khiếu nại đã đóng nhưng tiền không hoàn được: nói rõ cho người mua biết,
              và mở quyền đánh giá người bán — kênh phản ánh duy nhất còn lại. */}
          {isWinner && delivery.disputeResolution === 'paid-out' && (
            <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 space-y-1.5">
              <p className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Khiếu nại đã đóng — tiền đã giải ngân cho người bán
              </p>
              <p className="text-[11px] text-amber-100/90">
                Ký quỹ đã về ví người bán trước khi phát sinh khiếu nại nên sàn không thể hoàn tiền được nữa.
                {delivery.disputeResolvedNote ? ` Ghi chú của Ban quản trị: “${delivery.disputeResolvedNote}”.` : ''}
              </p>
            </div>
          )}

          {/* Đánh giá người bán sau khi giao dịch khép lại */}
          {isWinner && (delivery.canRateSeller || delivery.hasRatedSeller || ratingDone) && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-white">Đánh giá người bán</h4>
                <p className="text-[11px] text-outline">
                  Đánh giá của bạn hiển thị công khai trên hồ sơ nghệ sĩ và giúp người mua sau quyết định.
                </p>
              </div>

              {delivery.hasRatedSeller || ratingDone ? (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Bạn đã đánh giá người bán cho phiên này.
                </p>
              ) : (
                <form onSubmit={handleRateSeller} className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (ratingHover || ratingValue);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingValue(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          aria-label={`${star} sao`}
                          className="p-0.5 transition hover:scale-110"
                        >
                          <Star
                            size={22}
                            className={active ? 'fill-amber-400 text-amber-400' : 'text-outline/50'}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-1.5 text-[11px] font-semibold text-amber-300">
                      {ratingValue > 0 ? `${ratingValue}/5 sao` : 'Chọn số sao'}
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    maxLength={1000}
                    placeholder="Cảm nhận của bạn về người bán (đóng gói, đúng mô tả, thái độ...)"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading || ratingValue === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110 disabled:opacity-50"
                  >
                    <Star size={14} /> Gửi đánh giá
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận người mua đã nhận hàng thành công */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-400/40 bg-[#1F2335] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/15 text-emerald-300">
                <Package size={22} />
              </div>
              <div>
                <h3 className="font-h1 text-base font-bold text-emerald-300">Xác nhận đã nhận hàng?</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Bạn xác nhận đã nhận được bưu phẩm <strong className="text-white">nguyên vẹn, đúng tranh và không có lỗi gì</strong>.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-on-surface-variant">
              <p>Tác phẩm: <strong className="text-white">{auction.artwork?.artworkTitle}</strong></p>
              <p>Người bán: <strong className="text-white">{auction.seller?.fullName || 'Nghệ sĩ'}</strong></p>
              <p>
                Tiền ký quỹ sẽ giải ngân ngay:{' '}
                <strong className="text-emerald-300">{formatVnd(auction.finalPrice ?? auction.currentPrice)}</strong>
              </p>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-on-surface-variant">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-black/40 accent-emerald-500"
              />
              <span>
                Tôi xác nhận bưu phẩm đã được giao đến tay mình, tranh không hư hại và tôi đồng ý để sàn giải ngân
                tiền cho người bán. Sau bước này tôi không mở khiếu nại bồi hoàn được nữa.
              </span>
            </label>

            {delivery?.autoConfirmAt && (
              <p className="mt-3 text-[11px] text-outline">
                Nếu bạn không xác nhận, hệ thống tự động hoàn tất đơn sau 48 giờ kể từ lúc gửi hàng
                ({new Date(delivery.autoConfirmAt).toLocaleString('vi-VN')}).
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmChecked(false);
                }}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-outline hover:text-white transition disabled:opacity-50"
              >
                Chưa nhận được hàng
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={loading || !confirmChecked}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 transition disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> {loading ? 'Đang xử lý...' : 'Tôi chắc chắn đã nhận hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem danh sách biên lai giao dịch */}
      {showReceiptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#141829] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-h1 text-base font-bold text-white flex items-center gap-2">
                <Receipt size={18} className="text-amber-400" />
                Hồ sơ biên lai minh bạch giao dịch
              </h3>
              <button
                type="button"
                onClick={() => setShowReceiptsModal(false)}
                className="rounded-full p-1 text-outline hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="rounded-xl border border-brand-periwinkle/20 bg-brand-periwinkle/5 px-3.5 py-2.5 text-[11px] text-on-surface-variant">
              Khoản <strong className="text-white">tạm giữ</strong> và khoản <strong className="text-white">quyết toán</strong> là
              <strong className="text-white"> cùng một số tiền</strong>: sàn giữ hộ khi bạn thắng phiên, rồi chuyển cho người bán khi
              giao dịch hoàn tất. Mỗi phiên chỉ bị trừ phí nền tảng <strong className="text-white">một lần</strong> ở bước quyết toán.
            </p>

            <div className="space-y-3">
              {receipts.map((rec) => (
                <div
                  key={rec.receiptNumber}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-amber-300">
                        #{rec.receiptNumber}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-0.5">{rec.title}</h4>
                    </div>
                    <span className="font-mono text-[11px] text-outline">
                      {new Date(rec.issuedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-outline text-xs">{rec.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[11px] font-mono">
                    {rec.amount > 0 && (
                      <span className="text-emerald-300 font-bold">
                        {rec.receiptType === 'SettlementPayout' ? (
                          <>
                            Người bán thực nhận: {formatVnd(rec.netAmount ?? rec.amount)}
                            {rec.feeAmount
                              ? ` · Phí sàn: ${formatVnd(rec.feeAmount)} (trên tổng ${formatVnd(rec.amount)})`
                              : ''}
                          </>
                        ) : (
                          <>
                            Tạm giữ: {formatVnd(rec.amount)}
                            {rec.feeAmount ? ` · Phí sàn: ${formatVnd(rec.feeAmount)}` : ' · chưa trừ phí'}
                          </>
                        )}
                      </span>
                    )}
                    {rec.proofImageUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptImage(rec.proofImageUrl || null)}
                        className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                      >
                        <FileText size={12} className="shrink-0" /> Xem ảnh chứng từ gốc
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal phóng to ảnh biên lai / PoD */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedReceiptImage(null)}
              className="absolute -top-10 right-0 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedReceiptImage}
              alt="Biên lai chứng từ"
              className="max-h-[80vh] w-auto rounded-2xl border border-white/20 object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
