'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Filter,
  Palette,
} from 'lucide-react';
import { artTradeService } from '@/services/art-trade.service';
import { ArtTradeSummaryDto, TradeSlotStatusDto, TradeStatus } from '@/types/art-trade.types';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';
import toast from 'react-hot-toast';

type TradeTab = 'ALL' | 'ACTIVE' | 'PROPOSALS' | 'COMPLETED' | 'DISPUTED';

export default function MyTradesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';

  const isCreator = roles.some((r) => r.toLowerCase() === 'creator');
  const isAdmin = roles.some((r) => ['administrator', 'admin', 'moderator'].includes(r.toLowerCase()));

  const [trades, setTrades] = useState<ArtTradeSummaryDto[]>([]);
  const [slotStatus, setSlotStatus] = useState<TradeSlotStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TradeTab>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load trades and slot quota
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [tradesRes, slotsRes] = await Promise.allSettled([
          artTradeService.getMyTrades(),
          artTradeService.getMySlotStatus(),
        ]);

        if (isMounted) {
          if (tradesRes.status === 'fulfilled') {
            setTrades(tradesRes.value.items || []);
          } else {
            setTrades([]);
          }

          if (slotsRes.status === 'fulfilled') {
            setSlotStatus(slotsRes.value);
          } else {
            setSlotStatus(null);
          }
        }
      } catch (err) {
        console.error('Error loading trades:', err);
        if (isMounted) setTrades([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRespond = async (tradeId: string, accept: boolean) => {
    try {
      setActionLoadingId(tradeId);
      await artTradeService.respond(tradeId, { accept });
      toast.success(
        accept
          ? (isVie ? 'Đã chấp nhận đề nghị! Phòng nộp tranh đã mở.' : 'Trade proposal accepted! Drawing phase started.')
          : (isVie ? 'Đã từ chối lời mời trao đổi.' : 'Trade proposal declined.')
      );
      // Refresh
      const updated = await artTradeService.getMyTrades();
      setTrades(updated.items || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to process response.';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const isProposedStatus = (s: unknown) => s === 'Proposed' || s === 1 || s === '1';
  const isAcceptedStatus = (s: unknown) => s === 'Accepted' || s === 2 || s === '2';
  const isBothSubmittedStatus = (s: unknown) => s === 'BothSubmitted' || s === 3 || s === '3';
  const isCompletedStatus = (s: unknown) => s === 'Completed' || s === 4 || s === '4';
  const isDisputedStatus = (s: unknown) => s === 'Disputed' || s === 7 || s === '7';
  const isCancelledStatus = (s: unknown) => s === 'Cancelled' || s === 6 || s === '6' || s === 'Rejected' || s === 5 || s === '5';

  const getStatusBadge = (status: TradeStatus) => {
    if (isProposedStatus(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3" /> {isVie ? 'Chờ xác nhận' : 'Proposal Pending'}
        </span>
      );
    }
    if (isAcceptedStatus(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Clock className="w-3 h-3" /> {isVie ? 'Đang thực hiện' : 'In Progress'}
        </span>
      );
    }
    if (isBothSubmittedStatus(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3 h-3" /> {isVie ? 'Đã nộp tranh' : 'Both Submitted'}
        </span>
      );
    }
    if (isCompletedStatus(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> {isVie ? 'Hoàn thành' : 'Completed'}
        </span>
      );
    }
    if (isDisputedStatus(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <AlertCircle className="w-3 h-3" /> {isVie ? 'Khiếu nại' : 'Under Dispute'}
        </span>
      );
    }
    if (isCancelledStatus(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/30">
          <XCircle className="w-3 h-3" /> {isVie ? 'Đã hủy' : 'Cancelled'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-300">
        {status}
      </span>
    );
  };

  const filteredTrades = trades.filter((trade) => {
    switch (activeTab) {
      case 'ACTIVE':
        return isAcceptedStatus(trade.status) || isBothSubmittedStatus(trade.status);
      case 'PROPOSALS':
        return isProposedStatus(trade.status);
      case 'COMPLETED':
        return isCompletedStatus(trade.status);
      case 'DISPUTED':
        return isDisputedStatus(trade.status) || isCancelledStatus(trade.status);
      default:
        return true;
    }
  });

  if (!isCreator && !isAdmin) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-container rounded-3xl p-8 md:p-12 border border-white/10 bg-[#14151e]/80 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-5">
            <Palette className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Art Trading is Exclusive to Creators
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Because trading involves exchanging and uploading original artwork, you must be a registered Creator to manage or participate in art trades.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/become-creator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              <Palette className="w-4 h-4" /> Become a Creator
            </Link>
            <Link
              href="/explore"
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition"
            >
              Explore Artworks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner & Propose Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" /> {isVie ? 'Quản lý Trao đổi tác phẩm' : 'Art Trade Management'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-h1">
            {isVie ? 'Trao đổi của tôi' : 'My Art Trades'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isVie
              ? 'Quản lý các lượt trao đổi tranh ngang hàng giữa các họa sĩ, phản hồi đề xuất và theo dõi tiến trình.'
              : 'Manage your peer-to-peer artist exchanges, accept proposals, and track active sessions.'}
          </p>
        </div>

        {/* CTA Button: Link to default create art trade */}
        <Link
          href="/art-trades/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> {isVie ? 'Tạo đề nghị trao đổi' : 'Propose New Trade'}
        </Link>
      </div>

      {/* Slot Quota Status Card */}
      <div className="mb-8 p-5 rounded-2xl bg-[#14151e]/80 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {isVie ? 'Hạn mức lượt trao đổi (Slots):' : 'Trade Slots Quota:'}
              <span className="text-indigo-300 font-mono text-base">
                {slotStatus?.activeTradesCount ?? 0} / {slotStatus?.totalSlots ?? 2} {isVie ? 'Đang chạy' : 'Active'}
              </span>
            </h4>
            <p className="text-xs text-gray-400">
              {isVie
                ? `Họa sĩ có thể tham gia tối đa ${slotStatus?.totalSlots ?? 2} lượt trao đổi cùng lúc. Số slot còn trống: `
                : `Creators can run up to ${slotStatus?.totalSlots ?? 2} simultaneous trades to prevent over-commitment. Available slots: `}
              <strong className="text-white">{slotStatus?.availableSlots ?? 1}</strong>
            </p>
          </div>
        </div>

        {(slotStatus?.frozenSlotsCount ?? 0) > 0 ? (
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>
              {isVie ? 'Slot bị đóng băng:' : 'Slots Frozen:'} {slotStatus?.frozenDetails?.[0]?.reason || (isVie ? 'Khiếu nại' : 'Dispute penalty')} ({slotStatus?.frozenSlotsCount} frozen)
            </span>
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> {isVie ? 'Bảo vệ Escrow & Sẵn sàng' : 'Escrow Protected & Active'}
          </div>
        )}
      </div>

      {/* Tab Filter Navigation */}
      <div className="flex items-center gap-2 pb-6 overflow-x-auto border-b border-white/5 mb-6">
        {[
          { key: 'ALL', label: isVie ? 'Tất cả' : 'All Trades' },
          { key: 'ACTIVE', label: isVie ? 'Đang thực hiện' : 'Active Sessions' },
          { key: 'PROPOSALS', label: isVie ? 'Đề xuất chờ duyệt' : 'Proposals' },
          { key: 'COMPLETED', label: isVie ? 'Đã hoàn tất' : 'Completed' },
          { key: 'DISPUTED', label: isVie ? 'Khiếu nại & Lịch sử' : 'Disputes & History' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TradeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trades List */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
          <p className="text-xs font-medium">Loading your trades...</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-white/10 bg-white/[0.02] max-w-lg mx-auto">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No Art Trades Found</h3>
          <p className="text-xs text-gray-400 mb-6">
            You don&apos;t have any trade sessions matching this category.
          </p>
          <Link
            href="/art-trades/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Propose a Trade
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTrades.map((trade) => {
            const isInitiator = trade.role?.toLowerCase() === 'initiator';
            const isProposed = isProposedStatus(trade.status);
            const isPendingProposalForMe = isProposed && !isInitiator;
            const isMyProposalPending = isProposed && isInitiator;

            return (
              <div
                key={trade.id}
                className="p-5 rounded-2xl bg-[#14151e]/80 border border-white/10 backdrop-blur-xl shadow-md hover:border-indigo-500/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Trade Left Details */}
                <div className="flex items-start gap-4">
                  {/* Partner Avatar */}
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/40 bg-gradient-to-tr from-indigo-950 to-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-sm font-bold text-white shadow-md">
                    {trade.partner.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={trade.partner.avatarUrl}
                        alt={trade.partner.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      trade.partner.fullName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getStatusBadge(trade.status)}
                      <span className="text-[11px] text-gray-400">
                        {isInitiator
                          ? (isVie ? 'Bạn đề xuất' : 'Proposed by You')
                          : (isVie ? `Nhận từ ${trade.partner.fullName}` : `Received from ${trade.partner.fullName}`)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {trade.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>{isVie ? 'Đối tác:' : 'Partner:'} <strong className="text-gray-300">{trade.partner.fullName}</strong></span>
                      {trade.submissionDeadlineAt && (
                        <span>• {isVie ? 'Hạn nộp:' : 'Deadline:'} {new Date(trade.submissionDeadlineAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  {isPendingProposalForMe ? (
                    <>
                      <Link
                        href={`/art-trades/${trade.id}`}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition"
                      >
                        {isVie ? 'Xem đề nghị' : 'View Proposal'}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRespond(trade.id, false)}
                        disabled={actionLoadingId === trade.id}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-gray-300 text-xs font-semibold border border-white/10 transition disabled:opacity-50"
                      >
                        {isVie ? 'Từ chối' : 'Decline'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(trade.id, true)}
                        disabled={actionLoadingId === trade.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                      >
                        {actionLoadingId === trade.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {isVie ? 'Chấp nhận' : 'Accept'}
                      </button>
                    </>
                  ) : isMyProposalPending ? (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-amber-300/80 italic px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        {isVie ? 'Chờ đối tác phản hồi' : 'Waiting for response'}
                      </div>
                      <Link
                        href={`/art-trades/${trade.id}`}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition"
                      >
                        {isVie ? 'Xem đề nghị' : 'View Proposal'}
                      </Link>
                    </div>
                  ) : isAcceptedStatus(trade.status) || isBothSubmittedStatus(trade.status) ? (
                    <Link
                      href={`/art-trades/${trade.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 text-xs font-bold transition shadow-sm"
                    >
                      <span>{isVie ? 'Vào phòng vẽ trao đổi' : 'Enter Trade Room'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : isCompletedStatus(trade.status) ? (
                    <Link
                      href={`/art-trades/${trade.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition shadow-sm"
                    >
                      <span>{isVie ? 'Xem kết quả trao đổi' : 'View Completed Trade'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/art-trades/${trade.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold transition shadow-sm"
                    >
                      <span>{isVie ? 'Xem chi tiết' : 'View Details'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
