'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  XCircle,
  Wallet,
} from 'lucide-react';
import {
  addonService,
  addonStage,
  addonMoney,
  addonSchema,
  type CreatorAddon,
  type CommissionAddon,
  type AddonStage,
} from '@/services/addon.service';
import { commissionService } from '@/services/commission.service';
import { extractErrorMessage } from '@/lib/api-client';
import type { Commission } from '@/types/commission.types';
import toast from 'react-hot-toast';

interface WorkroomAddonStoreProps {
  commission: Commission;
  isCreator: boolean;
  onUpdated: (value: Commission) => void;
  onBackToCanvas?: () => void;
}

export function WorkroomAddonStore({
  commission,
  isCreator,
  onUpdated,
  onBackToCanvas,
}: WorkroomAddonStoreProps) {
  const [items, setItems] = useState<CommissionAddon[]>([]);
  const [catalog, setCatalog] = useState<CreatorAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAddonId, setBusyAddonId] = useState<string | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [error, setError] = useState('');

  // Form states cho Creator tự báo giá phát sinh
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDays, setCustomDays] = useState('0');

  const sequence = commission.currentStage ?? 1;
  const stage = addonStage(sequence, commission.milestones?.length ?? 3);
  const canBuy =
    commission.status === 'InProgress' && (commission.escrowHeldAmount ?? 0) > 0;

  const loadData = useCallback(async () => {
    try {
      const [orderAddons, creatorAddons, refreshedCommission] = await Promise.all([
        addonService.list(commission.id),
        addonService.creator(commission.creatorId),
        commissionService.getById(commission.id),
      ]);
      setItems(orderAddons);
      setCatalog(creatorAddons);
      onUpdated(refreshedCommission);
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Không tải được danh mục phụ phí.'));
    } finally {
      setLoading(false);
    }
  }, [commission.id, commission.creatorId, onUpdated]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Phụ phí creator đã cấu hình phù hợp với mốc hiện tại
  const eligibleAddons = catalog.filter((a) => {
    if (!a.isActive) return false;
    if (a.packageId && a.packageId !== commission.packageId) return false;
    const allowed = a.allowedMilestone.split(',').map((s) => s.trim());
    return a.allowedMilestone === 'Any' || allowed.includes(stage) || a.allowedMilestone === stage;
  });

  // Khách hàng bấm "Mua ngay & Nạp Escrow"
  const handleClientBuyNow = async (addon: CreatorAddon) => {
    if (!canBuy) {
      toast.error('Đơn hàng cần đang thực hiện và đã ký quỹ để mua thêm phụ phí.');
      return;
    }
    setBusyAddonId(addon.id);
    setError('');
    try {
      // Bước 1: Tạo đề xuất từ cấu hình có sẵn của Creator
      const proposed = await addonService.propose(commission.id, {
        title: addon.title,
        price: addon.price,
        allowedMilestone: addon.allowedMilestone as AddonStage,
        extendDays: addon.extendDays,
        creatorAddonId: addon.id,
      });

      // Bước 2: Tự động duyệt và nạp Escrow ngay lập tức trong 1 click
      await addonService.respond(commission.id, proposed.id, 'Accept');
      toast.success(`Đã mua thành công: ${addon.title}!`);
      await loadData();
    } catch (cause) {
      const msg = extractErrorMessage(cause, 'Không thể mua phụ phí.');
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyAddonId(null);
    }
  };

  // Creator gửi báo giá phát sinh (Ad-hoc)
  const handleCreatorPropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBuy) {
      toast.error('Đơn hàng cần đang thực hiện để gửi báo giá phát sinh.');
      return;
    }
    setError('');
    const parsed = addonSchema.safeParse({
      title: customTitle,
      price: Number(customPrice),
      extendDays: Number(customDays),
      allowedMilestone: stage,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmittingProposal(true);
    try {
      await addonService.propose(commission.id, {
        ...parsed.data,
      });
      toast.success('Đã gửi đề xuất báo giá sang phòng chat cho khách hàng duyệt!');
      setCustomTitle('');
      setCustomPrice('');
      setCustomDays('0');
      await loadData();
    } catch (cause) {
      const msg = extractErrorMessage(cause, 'Không gửi được báo giá phát sinh.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Khách hàng duyệt / từ chối đề xuất do creator gửi
  const handleRespond = async (addonId: string, action: 'Accept' | 'Reject') => {
    setBusyAddonId(addonId);
    setError('');
    try {
      await addonService.respond(commission.id, addonId, action);
      toast.success(
        action === 'Accept'
          ? 'Đã duyệt và nạp tiền ký quỹ cho phụ phí!'
          : 'Đã từ chối đề xuất phụ phí.'
      );
      await loadData();
    } catch (cause) {
      const msg = extractErrorMessage(cause, 'Không thể xử lý đề xuất.');
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyAddonId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#919099]">
        Đang tải danh mục phụ phí...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-5 pr-1">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 sm:pr-[285px]">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[#A7ACD9]" />
          <div>
            <h3 className="font-h1 text-sm font-bold text-white">
              Phụ Phí Theo Mốc &amp; Báo Giá Phát Sinh (Add-ons)
            </h3>
            <span className="text-[11px] text-[#919099]">
              Áp dụng mốc hiện tại: <strong className="text-[#A7ACD9]">Mốc #{sequence} ({stage})</strong>
            </span>
          </div>
        </div>
        {onBackToCanvas && (
          <button
            type="button"
            onClick={onBackToCanvas}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#919099] hover:text-white transition"
          >
            ← Quay lại Canvas
          </button>
        )}
      </div>

      <div className="space-y-5 overflow-y-auto pr-1 flex-1">
        {/* Status Alert Banner */}
        <div className="rounded-2xl border border-[#A7ACD9]/30 bg-[#A7ACD9]/10 p-3.5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#A7ACD9] shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-white">Bảo Vệ Thanh Toán Escrow Tự Động</p>
            <p className="text-[#C7C5CF] leading-relaxed">
              Mọi phụ phí mua thêm được cộng trực tiếp vào hợp đồng và tiền được bảo vệ an toàn trong Escrow. Họa sĩ sẽ nhận tiền khi bạn đồng ý nghiệm thu mốc tương ứng.
            </p>
          </div>
        </div>

        {/* ================= KHỐI 1: KHÁCH HÀNG MUA ADDON ================= */}
        {!isCreator && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-h1 text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">
                  Phụ phí sẵn sàng mua cho Mốc #{sequence} ({stage})
                </h4>
                <p className="text-[11px] text-[#919099]">
                  Chọn phụ phí bạn muốn thêm vào đơn hàng. Tiền sẽ được khấu trừ từ ví và nạp vào Escrow.
                </p>
              </div>
            </div>

            {eligibleAddons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs text-[#919099]">
                Chưa có phụ phí sẵn nào cho mốc <strong>{stage}</strong>. Bạn có thể trao đổi trong phòng chat để Creator báo giá theo yêu cầu.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {eligibleAddons.map((addon) => {
                  const isBusy = busyAddonId === addon.id;
                  return (
                    <div
                      key={addon.id}
                      className="glass-container rounded-2xl border border-white/10 bg-[#171a2a] p-4 flex flex-col justify-between space-y-3 hover:border-[#A7ACD9]/40 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <strong className="font-h1 text-sm font-bold text-white">
                            {addon.title}
                          </strong>
                          <span className="text-xs font-bold text-emerald-400 shrink-0">
                            +{addonMoney(addon.price)}
                          </span>
                        </div>
                        {addon.description && (
                          <p className="text-[11px] text-[#919099] line-clamp-2">
                            {addon.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-[#919099]">
                          <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10 text-[#A7ACD9]">
                            Mốc: {addon.allowedMilestone}
                          </span>
                          <span>•</span>
                          <span>
                            {addon.extendDays > 0 ? `+${addon.extendDays} ngày deadline` : 'Không đổi hạn'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy || !canBuy}
                        onClick={() => handleClientBuyNow(addon)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A7ACD9] py-2 text-xs font-bold text-[#1F2335] hover:bg-[#b8bdf3] transition disabled:opacity-40"
                      >
                        {isBusy ? (
                          'Đang xử lý ký quỹ…'
                        ) : (
                          <>
                            <Wallet className="h-3.5 w-3.5" /> Mua ngay &amp; Nạp Escrow
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ================= KHỐI 2: CREATOR BÁO GIÁ PHÁT SINH ================= */}
        {isCreator && (
          <section className="glass-container rounded-2xl border border-white/10 bg-[#171a2a] p-4.5 space-y-3">
            <div>
              <h4 className="font-h1 text-xs font-bold uppercase tracking-wider text-[#A7ACD9] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Báo giá phụ phí phát sinh cho khách
              </h4>
              <p className="text-[11px] text-[#919099] mt-0.5">
                Nhập chi phí phát sinh tại mốc hiện tại ({stage}). Đề xuất sẽ xuất hiện trong phòng chat để khách bấm duyệt và nạp tiền.
              </p>
            </div>

            <form onSubmit={handleCreatorPropose} className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#A7ACD9] uppercase mb-1">
                  Tên món phát sinh
                </label>
                <input
                  required
                  maxLength={200}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ví dụ: Vẽ thêm nền hoa văn chi tiết"
                  className="w-full rounded-xl border border-white/10 bg-[#141724] px-3 py-2 text-xs text-white outline-none focus:border-[#A7ACD9]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A7ACD9] uppercase mb-1">
                  Giá bổ sung (VND)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Ví dụ: 200000"
                  className="w-full rounded-xl border border-white/10 bg-[#141724] px-3 py-2 text-xs text-white outline-none focus:border-[#A7ACD9]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A7ACD9] uppercase mb-1">
                  Gia hạn deadline (ngày)
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141724] px-3 py-2 text-xs text-white outline-none focus:border-[#A7ACD9]"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingProposal || !canBuy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#A7ACD9] px-5 py-2 text-xs font-bold text-[#1F2335] hover:bg-[#b8bdf3] transition disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {submittingProposal ? 'Đang gửi…' : 'Gửi báo giá cho khách'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ================= KHỐI 3: DANH SÁCH PHỤ PHÍ CỦA ĐƠN HÀNG ================= */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-h1 text-xs font-bold uppercase tracking-wider text-[#A7ACD9]">
              Lịch sử phụ phí của đơn hàng ({items.length})
            </h4>
            <span className="text-[11px] text-[#919099]">
              Tổng phụ phí đã duyệt: {addonMoney(items.filter((a) => a.status === 'Accepted').reduce((s, a) => s + a.price, 0))}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-[#919099]">
              Chưa có phụ phí nào được đề xuất hoặc thanh toán cho đơn hàng này.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((addon) => {
                const isAccepted = addon.status === 'Accepted';
                const isRejected = addon.status === 'Rejected';
                const isPending = addon.status === 'Proposed';
                const isBusy = busyAddonId === addon.id;

                return (
                  <div
                    key={addon.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#171a2a] p-3.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{addon.title}</strong>
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[#A7ACD9] border border-white/10">
                          Mốc #{addon.milestoneSequence} ({addon.allowedMilestone})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#919099]">
                        <span className="font-semibold text-emerald-400">+{addonMoney(addon.price)}</span>
                        <span>•</span>
                        <span>{addon.extendDays > 0 ? `+${addon.extendDays} ngày gia hạn` : 'Không gia hạn'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã nạp Escrow
                        </span>
                      )}

                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                          <XCircle className="h-3.5 w-3.5" /> Đã từ chối
                        </span>
                      )}

                      {isPending && (
                        <>
                          {!isCreator ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy || !canBuy}
                                onClick={() => handleRespond(addon.id, 'Reject')}
                                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || !canBuy}
                                onClick={() => handleRespond(addon.id, 'Accept')}
                                className="rounded-lg bg-emerald-500 text-[#0B0E17] font-bold px-3.5 py-1.5 text-xs hover:bg-emerald-400 transition"
                              >
                                {isBusy ? 'Đang duyệt…' : 'Duyệt & Nạp tiền'}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                              <Clock className="h-3.5 w-3.5" /> Chờ khách duyệt
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
