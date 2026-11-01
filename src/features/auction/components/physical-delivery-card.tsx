'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  Receipt,
  Send,
  Truck,
  X,
} from 'lucide-react';
import type { AuctionDetailDto } from '../types/auction.types';
import { auctionError, auctionService } from '../services/auction.service';

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

  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

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

  // 4. Người mua xác nhận nhận tranh & hài lòng
  const handleConfirmDelivery = async () => {
    if (!confirm('Xác nhận bạn đã nhận được bưu phẩm nguyên vẹn và hài lòng với tác phẩm? Tiền ký quỹ sẽ được sàn giải ngân cho người bán.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auctionService.confirmDelivery(auction.auctionId);
      setSuccessMsg('Xác nhận thành công! Giao dịch đã hoàn tất và tiền ký quỹ đã được giải ngân.');
      onReload();
    } catch (err) {
      setError(auctionError(err));
    } finally {
      setLoading(false);
    }
  };

  // 5. Người mua gửi khiếu nại
  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setError('Vui lòng cung cấp lý do khiếu nại.');
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
      onReload();
    } catch (err) {
      setError(auctionError(err));
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
                {delivery.status === 'AwaitingShipment' && 'Chờ người bán gửi hàng (tối đa 72h)'}
                {delivery.status === 'InTransit' && 'Đang vận chuyển qua bưu cục'}
                {delivery.status === 'Delivered' && 'Đã giao thành công & Giải ngân'}
                {delivery.status === 'Disputed' && 'Đang khiếu nại (Đóng băng ký quỹ)'}
                {delivery.status === 'Cancelled' && 'Đã hủy'}
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
                  📄 Xem ảnh biên lai bưu cục <ExternalLink size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Hành động của Người bán: Cập nhật thông tin gửi hàng */}
          {isSeller && delivery.status === 'AwaitingShipment' && (
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
                  <input
                    type="url"
                    placeholder="Link tra cứu hành trình (tùy chọn)"
                    value={shipForm.trackingUrl}
                    onChange={(e) => setShipForm((p) => ({ ...p, trackingUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Link ảnh chụp phiếu gửi bưu cục có đóng dấu (tùy chọn)"
                    value={shipForm.shippingReceiptUrl}
                    onChange={(e) => setShipForm((p) => ({ ...p, shippingReceiptUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white focus:outline-none"
                  />
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
          {isWinner && delivery.status === 'InTransit' && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmDelivery}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-brand-navy hover:brightness-110 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} /> Tôi đã nhận được tranh & Hài lòng (Nhả tiền cho Seller)
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
                  <textarea
                    required
                    rows={2}
                    placeholder="Mô tả lý do (hàng vỡ hỏng, sai kích thước, chưa nhận được hàng...)"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 p-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Link ảnh chụp bưu kiện bị hư hại / bằng chứng (nếu có)"
                    value={disputeEvidenceUrl}
                    onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 p-2 text-xs text-white focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
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
                        Số tiền: {formatVnd(rec.amount)}
                        {rec.feeAmount ? ` (Phí sàn: ${formatVnd(rec.feeAmount)})` : ''}
                      </span>
                    )}
                    {rec.proofImageUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptImage(rec.proofImageUrl || null)}
                        className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                      >
                        📄 Xem ảnh chứng từ gốc <ExternalLink size={11} />
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
