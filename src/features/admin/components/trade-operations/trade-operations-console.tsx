'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  FolderKanban,
  Gavel,
  HelpCircle,
  Layers,
  Maximize2,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { parseNoteWithAttachments } from '@/features/art-trade/utils/trade-attachment.utils';
import { tradeOperationsService } from '../../services/trade-operations.service';
import {
  AdminTradeListMeta,
  TradeDisputeDto,
  TradeDisputeResolutionType,
} from '../../types/trade-operations.types';
import { ArtTradeDto, TradeStatus } from '@/types/art-trade.types';

const TRADE_STATUS_LABELS: Record<TradeStatus, { labelVi: string; labelEn: string; color: string; border: string }> = {
  Proposed: {
    labelVi: 'Chờ chấp nhận',
    labelEn: 'Proposed',
    color: 'bg-[#8A6A1F]/10 text-[#8A6A1F]',
    border: 'border-[#8A6A1F]/40',
  },
  Accepted: {
    labelVi: 'Đang vẽ (Accepted)',
    labelEn: 'In Progress',
    color: 'bg-[#2C6A86]/10 text-[#2C6A86]',
    border: 'border-[#2C6A86]/40',
  },
  BothSubmitted: {
    labelVi: 'Đã nộp cả 2 bên',
    labelEn: 'Both Submitted',
    color: 'bg-[#5F3F86]/10 text-[#5F3F86]',
    border: 'border-[#5F3F86]/40',
  },
  Completed: {
    labelVi: 'Hoàn tất thành công',
    labelEn: 'Completed',
    color: 'bg-[#2F6B63]/10 text-[#2F6B63]',
    border: 'border-[#2F6B63]/40',
  },
  Rejected: {
    labelVi: 'Từ chối',
    labelEn: 'Rejected',
    color: 'bg-[#E5D8C2] text-[#746A5F]',
    border: 'border-[#221E1A]/12',
  },
  Cancelled: {
    labelVi: 'Đã hủy',
    labelEn: 'Cancelled',
    color: 'bg-[#A8321C]/10 text-[#A8321C]',
    border: 'border-[#A8321C]/40',
  },
  Disputed: {
    labelVi: 'Đang tranh chấp',
    labelEn: 'Disputed',
    color: 'bg-[#A8321C]/20 text-[#A8321C] animate-pulse',
    border: 'border-[#A8321C]/40',
  },
};

function formatDate(iso?: string | null, isEng = false) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(isEng ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const DISPUTE_CATEGORY_CONFIG: Record<
  string,
  { labelVi: string; labelEn: string; color: string; border: string }
> = {
  AiArt: {
    labelVi: 'Tranh tạo bằng AI',
    labelEn: 'AI-Generated Artwork',
    color: 'bg-[#5F3F86]/15 text-[#5F3F86]',
    border: 'border-[#5F3F86]/40',
  },
  Plagiarism: {
    labelVi: 'Đạo nhái / Sao chép',
    labelEn: 'Plagiarism / Art Theft',
    color: 'bg-[#A8321C]/15 text-[#A8321C]',
    border: 'border-[#A8321C]/40',
  },
  AgreementBreach: {
    labelVi: 'Sai lệch yêu cầu / OC',
    labelEn: 'Character / Prompt Mismatch',
    color: 'bg-[#8A6A1F]/15 text-[#8A6A1F]',
    border: 'border-[#8A6A1F]/40',
  },
  DeadlineMissed: {
    labelVi: 'Quá hạn / Không bàn giao',
    labelEn: 'Missed Deadline / Ghosting',
    color: 'bg-[#8A6A1F]/15 text-[#8A6A1F]',
    border: 'border-[#8A6A1F]/40',
  },
  TosViolation: {
    labelVi: 'Vi phạm chính sách nền tảng',
    labelEn: 'TOS / Policy Violation',
    color: 'bg-[#A8321C]/20 text-[#A8321C]',
    border: 'border-[#A8321C]/40',
  },
  Other: {
    labelVi: 'Lý do vi phạm khác',
    labelEn: 'Other Trade Violation',
    color: 'bg-[#E5D8C2] text-[#746A5F]',
    border: 'border-[#221E1A]/12',
  },
};

function getCategoryInfo(category?: string | null, reason?: string | null, isEng = false) {
  const normalize = (val?: string | null): string | undefined => {
    if (!val) return undefined;
    const clean = val.trim().replace(/[\s_-]+/g, '').toLowerCase();
    const map: Record<string, string> = {
      aiart: 'AiArt',
      plagiarism: 'Plagiarism',
      agreementbreach: 'AgreementBreach',
      deadlinemissed: 'DeadlineMissed',
      tosviolation: 'TosViolation',
      other: 'Other',
    };
    return map[clean];
  };

  let catKey = normalize(category);

  if (!catKey) {
    if (category) {
      const upper = category.trim().toUpperCase();
      const found = Object.entries(DISPUTE_CATEGORY_CONFIG).find(
        ([k, v]) =>
          k.toUpperCase() === upper ||
          v.labelEn.toUpperCase().includes(upper) ||
          v.labelVi.toUpperCase().includes(upper)
      );
      if (found) catKey = found[0];
    } else if (reason && reason.startsWith('[')) {
      const inside = reason.substring(1, reason.indexOf(']'));
      catKey = normalize(inside);
      if (!catKey) {
        const upperInside = inside.toUpperCase();
        const found = Object.entries(DISPUTE_CATEGORY_CONFIG).find(
          ([k, v]) =>
            k.toUpperCase() === upperInside ||
            v.labelEn.toUpperCase().includes(upperInside) ||
            v.labelVi.toUpperCase().includes(upperInside)
        );
        if (found) catKey = found[0];
      }
    }
  }

  const conf = (catKey && DISPUTE_CATEGORY_CONFIG[catKey]) || {
    labelVi: category || (isEng ? 'Uncategorized' : 'Chưa phân loại'),
    labelEn: category || (isEng ? 'Uncategorized' : 'Chưa phân loại'),
    color: 'bg-[#E5D8C2] text-[#746A5F]',
    border: 'border-[#221E1A]/12',
  };

  return {
    key: catKey || 'Other',
    label: isEng ? conf.labelEn : conf.labelVi,
    color: conf.color,
    border: conf.border,
  };
}

export function TradeOperationsConsole() {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';

  const [activeTab, setActiveTab] = useState<'trades' | 'disputes'>('trades');

  // Trade management state
  const [trades, setTrades] = useState<ArtTradeDto[]>([]);
  const [tradeMeta, setTradeMeta] = useState<AdminTradeListMeta>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    activeCount: 0,
    completedCount: 0,
    disputedCount: 0,
    cancelledCount: 0,
  });
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [tradeSearch, setTradeSearch] = useState('');
  const [tradeLoading, setTradeLoading] = useState(true);

  // Dispute resolution state
  const [disputes, setDisputes] = useState<TradeDisputeDto[]>([]);
  const [disputeMeta, setDisputeMeta] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [disputeFilter, setDisputeFilter] = useState<string>('ALL');
  const [disputeCategoryFilter, setDisputeCategoryFilter] = useState<string>('ALL');
  const [disputeSearch, setDisputeSearch] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Modals state
  const [inspectingTrade, setInspectingTrade] = useState<ArtTradeDto | null>(null);
  const [cancellingTrade, setCancellingTrade] = useState<ArtTradeDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isViolation, setIsViolation] = useState(false);
  const [violatorSide, setViolatorSide] = useState<'initiator' | 'receiver' | 'none'>('none');
  const [cancellingSubmitting, setCancellingSubmitting] = useState(false);

  // Arbitration Modal state
  const [arbitratingDispute, setArbitratingDispute] = useState<TradeDisputeDto | null>(null);
  const [resolutionChoice, setResolutionChoice] = useState<TradeDisputeResolutionType>('MutualCancel');
  const [adminNote, setAdminNote] = useState('');
  const [arbitratingSubmitting, setArbitratingSubmitting] = useState(false);

  // Image Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Fetch Trades
  const fetchTrades = async (page = 1) => {
    try {
      setTradeLoading(true);
      const res = await tradeOperationsService.getTrades({
        status: tradeFilter,
        search: tradeSearch,
        page,
        pageSize: 10,
      });
      setTrades(res.items);
      setTradeMeta(res.meta);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : isEng ? 'Failed to load trades.' : 'Không tải được danh sách giao dịch.');
    } finally {
      setTradeLoading(false);
    }
  };

  // Fetch Disputes
  const fetchDisputes = async (page = 1) => {
    try {
      setDisputeLoading(true);
      const res = await tradeOperationsService.getDisputes({
        status: disputeFilter,
        category: disputeCategoryFilter,
        page,
        pageSize: 10,
      });
      setDisputes(res.items);
      setDisputeMeta(res.meta);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : isEng ? 'Failed to load disputes.' : 'Không tải được danh sách khiếu nại.');
    } finally {
      setDisputeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trades') {
      fetchTrades(1);
    } else {
      fetchDisputes(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tradeFilter, disputeFilter, disputeCategoryFilter]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isEng ? 'Copied to clipboard!' : 'Đã sao chép mã!');
  };

  // Force cancel trade submit
  const handleForceCancelSubmit = async () => {
    if (!cancellingTrade) return;
    if (!cancelReason.trim()) {
      toast.error(isEng ? 'Please enter the cancellation reason.' : 'Vui lòng nhập lý do hủy giao dịch.');
      return;
    }

    try {
      setCancellingSubmitting(true);
      const violatorUserId =
        isViolation && violatorSide !== 'none'
          ? violatorSide === 'initiator'
            ? cancellingTrade.initiator.id
            : cancellingTrade.receiver.id
          : undefined;

      await tradeOperationsService.forceCancelTrade(cancellingTrade.id, {
        reason: cancelReason.trim(),
        isViolation,
        violatorUserId,
      });

      toast.success(isEng ? 'Force cancelled trade successfully.' : 'Đã can thiệp hủy giao dịch thành công.');
      setCancellingTrade(null);
      setCancelReason('');
      setIsViolation(false);
      setViolatorSide('none');
      fetchTrades(tradeMeta.page);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : isEng ? 'Error cancelling trade.' : 'Lỗi khi hủy giao dịch.');
    } finally {
      setCancellingSubmitting(false);
    }
  };

  // Resolve dispute submit
  const handleResolveDisputeSubmit = async () => {
    if (!arbitratingDispute) return;
    if (!adminNote.trim()) {
      toast.error(isEng ? 'Please enter the administrator verdict note.' : 'Vui lòng nhập ghi chú phán quyết của Quản trị viên.');
      return;
    }

    try {
      setArbitratingSubmitting(true);
      await tradeOperationsService.resolveDispute(arbitratingDispute.id, {
        resolution: resolutionChoice,
        adminNote: adminNote.trim(),
      });

      toast.success(isEng ? 'Dispute resolution verdict issued successfully.' : 'Đã ban hành phán quyết tranh chấp thành công.');
      setArbitratingDispute(null);
      setAdminNote('');
      fetchDisputes(disputeMeta.page);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : isEng ? 'Error arbitrating dispute.' : 'Lỗi khi phân xử tranh chấp.');
    } finally {
      setArbitratingSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 text-[#241F1A] space-y-6">
      {/* 1. Header Title Section */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#221E1A]/10 pb-6">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-3.5 py-1 text-xs font-semibold text-brand-periwinkle">
            <ArrowLeftRight size={13} className="text-[#8A6A1F]" />
            <span>{isEng ? 'Admin Center · Trade Operations' : 'Trung tâm Quản trị · Vận hành trao đổi'}</span>
          </div>

          <h1 className="font-h1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#241F1A] leading-tight">
            {isEng ? 'Art Trade Operations & Disputes' : 'Vận hành Trao đổi tranh & Khiếu nại'}
          </h1>

          <p className="mt-2 text-sm text-[#B24A26] leading-relaxed max-w-3xl">
            {isEng
              ? 'Operational management for Art Trades: Monitor bilateral artwork delivery progress, enforce compliance sanctions, and issue arbitration verdicts on dispute claims.'
              : 'Quản lý điều hành các cuộc trao đổi tranh nghệ thuật: Giám sát tiến độ bàn giao tác phẩm hai chiều, cưỡng chế xử lý vi phạm thỏa thuận, và ban hành phán quyết giải quyết khiếu nại tranh chấp.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void (activeTab === 'trades' ? fetchTrades(tradeMeta.page) : fetchDisputes(disputeMeta.page));
            }}
            disabled={tradeLoading || disputeLoading}
            className="flex items-center gap-2 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-3.5 py-2 text-xs font-semibold text-[#241F1A] transition hover:border-[#221E1A]/20 hover:bg-[#F0E7D8] active:scale-95 cursor-pointer"
            title={isEng ? 'Refresh data' : 'Làm mới dữ liệu'}
          >
            <RefreshCw
              size={14}
              className={tradeLoading || disputeLoading ? 'animate-spin text-brand-periwinkle' : 'text-brand-periwinkle'}
            />
            <span className="hidden sm:inline">{isEng ? 'Refresh' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Overview KPI Cards (Consistent with System Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
        {/* Card 1: Total Trades */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isEng ? 'TOTAL SESSIONS' : 'TỔNG SỐ PHIÊN'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#8C3718]/10 text-[#8C3718]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#8C3718] tracking-tight">
            {tradeMeta.totalCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            {isEng ? 'Total art trade sessions on platform' : 'Tổng số phiên giao dịch trên toàn sàn'}
          </p>
        </div>

        {/* Card 2: In Progress / Active */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isEng ? 'IN PROGRESS SESSIONS' : 'PHIÊN ĐANG THỰC HIỆN'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#2C6A86]/10 text-[#2C6A86]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#2C6A86] tracking-tight">
            {tradeMeta.activeCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            <span className="font-h1 font-bold text-[#241F1A]/90">{tradeMeta.activeCount}</span> {isEng ? 'In drawing & submission phase' : 'Đang vẽ & chờ nộp tranh'}
          </p>
        </div>

        {/* Card 3: Completed */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isEng ? 'COMPLETED TRADES' : 'GIAO DỊCH HOÀN TẤT'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#2F6B63]/10 text-[#2F6B63]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#2F6B63] tracking-tight">
            {tradeMeta.completedCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            {isEng ? 'Mutual delivery & verified' : 'Hai bên đã trao đổi thành công'}
          </p>
        </div>

        {/* Card 4: Disputed */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isEng ? 'DISPUTES & CLAIMS' : 'TRANH CHẤP & KHIẾU NẠI'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#A8321C]/10 text-[#A8321C]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#A8321C] tracking-tight">
            {disputeMeta.totalCount || tradeMeta.disputedCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            {(disputeMeta.totalCount || tradeMeta.disputedCount) > 0 ? (
              <span className="text-[#A8321C] font-medium">{isEng ? 'Claims pending arbitration' : 'Khiếu nại cần quản trị viên phân xử'}</span>
            ) : (
              <span className="text-[#2F6B63] font-medium">{isEng ? 'No pending trade disputes' : 'Không có khiếu nại tồn đọng'}</span>
            )}
          </p>
        </div>

        {/* Card 5: Cancelled / Rejected */}
        <div className="glass-container rounded-[24px] p-5 space-y-2 shadow-lg border border-[#221E1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6E6459] font-bold uppercase tracking-wider font-h1">
              {isEng ? 'CANCELLED / REJECTED' : 'ĐÃ HỦY / TỪ CHỐI'}
            </span>
            <div className="p-1.5 rounded-lg bg-[#E5D8C2] text-[#746A5F]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-h1 text-2xl font-extrabold text-[#746A5F] tracking-tight">
            {tradeMeta.cancelledCount}
          </h3>
          <p className="text-[11px] text-[#6E6459]">
            {isEng ? 'Cancelled or declined by artists' : 'Kèo đã bị hủy hoặc đối tác từ chối'}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar (Directly under Header Title like in Admin Event page) */}
      <nav className="glass-container rounded-2xl p-1.5 backdrop-blur-xl bg-[#FFFCF6]/90 flex gap-1.5 overflow-x-auto mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'trades'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
            }`}
        >
          <Layers size={14} />
          <span>{isEng ? 'Trade Management' : 'Quản lý Giao dịch'}</span>
          {tradeMeta.totalCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${activeTab === 'trades'
                  ? 'bg-brand-navy/20 text-[#241F1A]'
                  : 'bg-[#F0E7D8] text-[#746A5F]'
                }`}
            >
              {tradeMeta.totalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'disputes'
              ? 'bg-brand-periwinkle text-[#FFFCF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_20px_rgba(167,172,217,0.25)]'
              : 'text-[#746A5F] hover:text-[#241F1A] hover:bg-[#FFFCF6]'
            }`}
        >
          <ShieldAlert
            size={14}
            className={disputeMeta.totalCount > 0 && activeTab !== 'disputes' ? 'text-[#A8321C] animate-pulse' : ''}
          />
          <span>{isEng ? 'Dispute Resolution' : 'Giải quyết Tranh chấp'}</span>
          {disputeMeta.totalCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${activeTab === 'disputes'
                  ? 'bg-brand-navy/20 text-[#241F1A]'
                  : 'bg-[#A8321C]/20 text-[#A8321C]'
                }`}
            >
              {disputeMeta.totalCount}
            </span>
          )}
        </button>
      </nav>

      {/* ========================================================= */}
      {/* TAB 1: TRADE MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'trades' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9]/70 backdrop-blur-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746A5F] pointer-events-none" />
              <input
                type="text"
                value={tradeSearch}
                onChange={(e) => setTradeSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTrades(1)}
                placeholder={isEng ? 'Search by title, artist, email or Trade ID...' : 'Tìm theo tiêu đề, nghệ sĩ, email hoặc mã trao đổi ID...'}
                className="w-full h-10 rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-9 pr-9 text-xs text-[#241F1A] text-[#746A5F] transition hover:border-[#221E1A]/20 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle"
              />
              {tradeSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setTradeSearch('');
                    setTimeout(() => fetchTrades(1), 0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#746A5F] hover:text-[#241F1A] p-0.5 cursor-pointer"
                  title={isEng ? 'Clear search' : 'Xóa tìm kiếm'}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative shrink-0 min-w-[170px] sm:min-w-[190px]">
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="w-full h-10 appearance-none rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-3.5 pr-9 text-xs font-semibold text-[#241F1A] transition hover:border-[#221E1A]/20 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle cursor-pointer"
              >
                <option value="ALL" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'All Statuses' : 'Tất cả trạng thái'}
                </option>
                <option value="Proposed" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'Proposed' : 'Chờ duyệt'}
                </option>
                <option value="Accepted" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'In Progress' : 'Đang vẽ'}
                </option>
                <option value="BothSubmitted" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'Both Submitted' : 'Đã nộp bài'}
                </option>
                <option value="Completed" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'Completed' : 'Hoàn tất'}
                </option>
                <option value="Disputed" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'Disputed' : 'Tranh chấp'}
                </option>
                <option value="Cancelled" className="bg-[#F7F2E9] text-[#241F1A]">
                  {isEng ? 'Cancelled' : 'Đã hủy'}
                </option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#746A5F]" />
            </div>
          </div>

          {/* Trade Table */}
          <div className="overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#F7F2E9]/40 backdrop-blur-md">
            {tradeLoading ? (
              <div className="py-24 text-center">
                <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-brand-periwinkle" />
                <p className="text-xs text-[#746A5F]">
                  {isEng ? 'Loading Art Trades...' : 'Đang tải danh sách giao dịch trao đổi tranh...'}
                </p>
              </div>
            ) : trades.length === 0 ? (
              <div className="py-20 text-center text-[#746A5F] text-xs">
                {isEng ? 'No matching art trades found.' : 'Không tìm thấy lượt trao đổi tranh nào phù hợp.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#746A5F]">
                  <thead className="bg-[#FFFCF6] text-[11px] font-bold uppercase tracking-wider text-[#746A5F] border-b border-[#221E1A]/10">
                    <tr>
                      <th className="py-3.5 px-4">{isEng ? 'Trade Info' : 'Thông tin trao đổi'}</th>
                      <th className="py-3.5 px-4">{isEng ? 'Side A (Initiator)' : 'Side A (Khởi tạo)'}</th>
                      <th className="py-3.5 px-4">{isEng ? 'Side B (Partner)' : 'Side B (Đối tác)'}</th>
                      <th className="py-3.5 px-4">{isEng ? 'Status' : 'Trạng thái'}</th>
                      <th className="py-3.5 px-4">{isEng ? 'Deadlines & Timeline' : 'Hạn nộp & Thời gian'}</th>
                      <th className="py-3.5 px-4 text-right">{isEng ? 'Actions' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#221E1A]/10">
                    {trades.map((item) => {
                      const st = TRADE_STATUS_LABELS[item.status] || {
                        labelVi: item.status,
                        labelEn: item.status,
                        color: 'bg-[#F0E7D8] text-[#241F1A]',
                        border: 'border-[#221E1A]/20',
                      };

                      return (
                        <tr key={item.id} className="hover:bg-[#FFFCF6] transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#241F1A] max-w-[200px] truncate" title={item.title}>
                              {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-[#746A5F]">
                              <span>#{item.id.substring(0, 8)}</span>
                              <button
                                onClick={() => handleCopy(item.id)}
                                className="hover:text-brand-periwinkle"
                                title={isEng ? 'Copy ID' : 'Sao chép ID'}
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </td>

                          {/* Side A */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {item.initiatorPreviewUrl ? (
                                <div
                                  className="relative size-10 rounded-lg overflow-hidden border border-[#221E1A]/10 cursor-pointer shrink-0"
                                  onClick={() => setLightboxUrl(item.initiatorPreviewUrl || null)}
                                >
                                  <Image
                                    src={item.initiatorPreviewUrl}
                                    alt="Side A Art"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="size-10 rounded-lg bg-[#FFFCF6] border border-[#221E1A]/10 flex items-center justify-center text-[10px] text-[#746A5F] shrink-0">
                                  {isEng ? 'Not submitted' : 'Chưa nộp'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-[#241F1A] block truncate max-w-[130px]">
                                  {item.initiator?.fullName || (isEng ? 'Artist A' : 'Nghệ sĩ A')}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {item.initiatorSubmittedAt ? (
                                    <span className="text-[10px] text-[#2F6B63] font-mono">
                                      {isEng ? 'Submitted' : 'Đã nộp'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#746A5F] font-mono">
                                      {isEng ? 'Pending' : 'Chờ nộp'}
                                    </span>
                                  )}
                                  {item.isInitiatorConfirmed && (
                                    <span className="text-[10px] text-[#8A6A1F] font-mono">
                                      {isEng ? ' · Confirmed' : ' · Đã duyệt'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Side B */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {item.receiverPreviewUrl ? (
                                <div
                                  className="relative size-10 rounded-lg overflow-hidden border border-[#221E1A]/10 cursor-pointer shrink-0"
                                  onClick={() => setLightboxUrl(item.receiverPreviewUrl || null)}
                                >
                                  <Image
                                    src={item.receiverPreviewUrl}
                                    alt="Side B Art"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="size-10 rounded-lg bg-[#FFFCF6] border border-[#221E1A]/10 flex items-center justify-center text-[10px] text-[#746A5F] shrink-0">
                                  {isEng ? 'Not submitted' : 'Chưa nộp'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-[#241F1A] block truncate max-w-[130px]">
                                  {item.receiver?.fullName || (isEng ? 'Artist B' : 'Nghệ sĩ B')}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {item.receiverSubmittedAt ? (
                                    <span className="text-[10px] text-[#2F6B63] font-mono">
                                      {isEng ? 'Submitted' : 'Đã nộp'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#746A5F] font-mono">
                                      {isEng ? 'Pending' : 'Chờ nộp'}
                                    </span>
                                  )}
                                  {item.isReceiverConfirmed && (
                                    <span className="text-[10px] text-[#8A6A1F] font-mono">
                                      {isEng ? ' · Confirmed' : ' · Đã duyệt'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.color} ${st.border}`}
                            >
                              {isEng ? st.labelEn : st.labelVi}
                            </span>
                          </td>

                          {/* Deadlines */}
                          <td className="py-3.5 px-4 text-[11px]">
                            <div className="text-[#746A5F]">
                              {isEng ? 'Created: ' : 'Tạo: '}
                              <span className="text-[#241F1A] font-mono">{formatDate(item.createdAt, isEng)}</span>
                            </div>
                            {item.submissionDeadlineAt && (
                              <div className="text-[#746A5F] mt-0.5">
                                {isEng ? 'Deadline: ' : 'Hạn nộp: '}
                                <span className="text-[#8A6A1F] font-mono">
                                  {formatDate(item.submissionDeadlineAt, isEng)}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setInspectingTrade(item)}
                                className="rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1.5 text-[11px] font-semibold text-[#746A5F] hover:text-[#241F1A] hover:bg-[#F0E7D8] transition"
                                title={isEng ? 'View details & artwork inspection' : 'Xem chi tiết & thanh tra tranh'}
                              >
                                <Eye size={13} className="inline mr-1" />
                                {isEng ? 'Inspect' : 'Chi tiết'}
                              </button>

                              {item.status !== 'Completed' && item.status !== 'Cancelled' && (
                                <button
                                  onClick={() => setCancellingTrade(item)}
                                  className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#A8321C] hover:bg-[#A8321C]/20 transition"
                                  title={isEng ? 'Intervene to cancel trade' : 'Can thiệp dừng giao dịch'}
                                >
                                  {isEng ? 'Force Cancel' : 'Cưỡng chế hủy'}
                                </button>
                              )}

                              {item.status === 'Disputed' && (
                                <button
                                  onClick={() => setActiveTab('disputes')}
                                  className="rounded-xl border border-[#A8321C]/40 bg-[#A8321C]/20 px-2.5 py-1.5 text-[11px] font-semibold text-[#A8321C] hover:bg-[#A8321C]/20 transition animate-pulse"
                                >
                                  {isEng ? 'Arbitrate' : 'Xử khiếu nại'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {tradeMeta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#221E1A]/10 p-4 text-xs text-[#746A5F]">
                <span>
                  {isEng
                    ? `Page ${tradeMeta.page} of ${tradeMeta.totalPages} (${tradeMeta.totalCount} trades)`
                    : `Trang ${tradeMeta.page} / ${tradeMeta.totalPages} (${tradeMeta.totalCount} giao dịch)`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={tradeMeta.page <= 1}
                    onClick={() => fetchTrades(tradeMeta.page - 1)}
                    className="rounded-xl border border-[#221E1A]/10 px-3 py-1.5 text-xs font-semibold text-[#241F1A] hover:bg-[#FFFCF6] disabled:opacity-40"
                  >
                    {isEng ? 'Previous' : 'Trang trước'}
                  </button>
                  <button
                    disabled={tradeMeta.page >= tradeMeta.totalPages}
                    onClick={() => fetchTrades(tradeMeta.page + 1)}
                    className="rounded-xl border border-[#221E1A]/10 px-3 py-1.5 text-xs font-semibold text-[#241F1A] hover:bg-[#FFFCF6] disabled:opacity-40"
                  >
                    {isEng ? 'Next' : 'Trang sau'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DISPUTE RESOLUTION */}
      {/* ========================================================= */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-[#221E1A]/10 bg-[#F7F2E9]/70 backdrop-blur-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="relative shrink-0 min-w-[170px]">
                <select
                  value={disputeFilter}
                  onChange={(e) => setDisputeFilter(e.target.value)}
                  className="w-full h-10 appearance-none rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-3.5 pr-9 text-xs font-semibold text-[#241F1A] transition hover:border-[#221E1A]/20 focus:border-[#A8321C]/30 focus:outline-none focus:ring-1 focus:ring-[#A8321C]/30 cursor-pointer"
                >
                  <option value="ALL" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'All Statuses' : 'Tất cả trạng thái'}
                  </option>
                  <option value="Pending" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Pending Resolution' : 'Chờ giải quyết'}
                  </option>
                  <option value="Resolved" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Resolved' : 'Đã giải quyết'}
                  </option>
                  <option value="Dismissed" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Dismissed' : 'Đã bác bỏ'}
                  </option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#746A5F]" />
              </div>

              {/* Category Filter */}
              <div className="relative shrink-0 min-w-[190px]">
                <select
                  value={disputeCategoryFilter}
                  onChange={(e) => setDisputeCategoryFilter(e.target.value)}
                  className="w-full h-10 appearance-none rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] py-2 pl-3.5 pr-9 text-xs font-semibold text-[#241F1A] transition hover:border-[#221E1A]/20 focus:border-[#A8321C]/30 focus:outline-none focus:ring-1 focus:ring-[#A8321C]/30 cursor-pointer"
                >
                  <option value="ALL" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'All Violation Categories' : 'Tất cả phân loại vi phạm'}
                  </option>
                  <option value="AiArt" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'AI-Generated Artwork' : 'Tranh tạo bằng AI'}
                  </option>
                  <option value="Plagiarism" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Plagiarism / Art Theft' : 'Đạo nhái / Sao chép'}
                  </option>
                  <option value="AgreementBreach" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Character / Prompt Mismatch' : 'Sai lệch yêu cầu / OC'}
                  </option>
                  <option value="DeadlineMissed" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Missed Deadline / Ghosting' : 'Quá hạn / Không bàn giao'}
                  </option>
                  <option value="TosViolation" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'TOS / Policy Violation' : 'Vi phạm chính sách nền tảng'}
                  </option>
                  <option value="Other" className="bg-[#F7F2E9] text-[#241F1A]">
                    {isEng ? 'Other Trade Violation' : 'Lý do vi phạm khác'}
                  </option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#746A5F]" />
              </div>
            </div>

            <div className="text-xs text-[#746A5F]">
              {isEng
                ? 'Policy: At-fault verdicts automatically freeze 1 Art Trade slot for 30 days (TradeSlotFreeze).'
                : 'Chế tài: Phán quyết có lỗi sẽ tự động đóng băng 1 lượt trao đổi tranh trong 30 ngày (TradeSlotFreeze).'}
            </div>
          </div>

          {/* Disputes List */}
          <div className="space-y-4">
            {disputeLoading ? (
              <div className="py-24 text-center">
                <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-[#A8321C]" />
                <p className="text-xs text-[#746A5F]">
                  {isEng ? 'Loading dispute claims...' : 'Đang tải danh sách khiếu nại tranh chấp...'}
                </p>
              </div>
            ) : disputes.length === 0 ? (
              <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] py-20 text-center text-xs text-[#746A5F]">
                {isEng ? 'No dispute claims require resolution.' : 'Không có hồ sơ tranh chấp nào cần xử lý.'}
              </div>
            ) : (
              disputes.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[#221E1A]/10 bg-[#F7F2E9]/40 backdrop-blur-md p-5 sm:p-6 transition hover:border-[#221E1A]/20 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#221E1A]/10 pb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.status === 'Pending'
                            ? 'bg-[#A8321C]/20 text-[#A8321C] border-[#A8321C]/40 animate-pulse'
                            : 'bg-[#2F6B63]/20 text-[#2F6B63] border-[#2F6B63]/40'
                          }`}
                      >
                        {item.status === 'Pending'
                          ? isEng
                            ? 'Pending Arbitration'
                            : 'Chờ phân xử'
                          : isEng
                            ? 'Resolved'
                            : 'Đã phân xử'}
                      </span>

                      {/* Violation Category Pill */}
                      {(() => {
                        const cat = getCategoryInfo(item.category, item.reason, isEng);
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cat.color} ${cat.border}`}
                          >
                            <ShieldAlert size={12} className="shrink-0" />
                            <span>{cat.label}</span>
                          </span>
                        );
                      })()}

                      <h3 className="font-bold text-[#241F1A] text-sm">
                        {item.tradeTitle
                          ? isEng
                            ? `Trade: "${item.tradeTitle}"`
                            : `Giao dịch: "${item.tradeTitle}"`
                          : isEng
                            ? `Trade Code #${item.artTradeId.substring(0, 8)}`
                            : `Mã trao đổi #${item.artTradeId.substring(0, 8)}`}
                      </h3>
                      <button
                        onClick={() => handleCopy(item.artTradeId)}
                        className="text-[#746A5F] hover:text-[#241F1A]"
                        title={isEng ? 'Copy Art Trade ID' : 'Sao chép trao đổi tranh ID'}
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    <div className="text-[11px] text-[#746A5F] font-mono">
                      {isEng ? 'Claimed at: ' : 'Khiếu nại lúc: '}
                      {formatDate(item.createdAt, isEng)}
                    </div>
                  </div>

                  {/* Litigant details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3.5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#746A5F] block">
                        {isEng ? 'Complainant (Claimant)' : 'Bên khiếu nại (Complainant)'}
                      </span>
                      <div className="font-semibold text-[#241F1A] flex items-center gap-2">
                        <User size={14} className="text-brand-periwinkle" />
                        {item.raisedByName || (isEng ? 'Complainant Artist' : 'Nghệ sĩ khiếu nại')}
                        <span className="text-[10px] font-mono text-[#746A5F]">({item.raisedById.substring(0, 8)})</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#221E1A]/10 bg-[#F0E7D8] p-3.5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#746A5F] block">
                        {isEng ? 'Accused Partner (Respondent)' : 'Bên bị khiếu nại (Accused Partner)'}
                      </span>
                      <div className="font-semibold text-[#241F1A] flex items-center gap-2">
                        <User size={14} className="text-[#A8321C]" />
                        {item.partnerName || (isEng ? 'Accused Artist' : 'Đối tác bị khiếu nại')}
                        <span className="text-[10px] font-mono text-[#746A5F]">({item.partnerId.substring(0, 8)})</span>
                      </div>
                    </div>
                  </div>

                  {/* Reason description */}
                  <div className="rounded-2xl border border-[#A8321C]/20 bg-[#A8321C]/12/[0.03] p-4 text-xs text-[#6E6459]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#A8321C]/20">
                      <span className="font-bold text-[#A8321C] flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-[#A8321C]" />
                        {isEng ? 'Dispute Reason & Violation Category:' : 'Lý do khiếu nại & Phân loại vi phạm:'}
                      </span>
                      {(() => {
                        const cat = getCategoryInfo(item.category, item.reason, isEng);
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold ${cat.color} ${cat.border}`}
                          >
                            <ShieldAlert size={12} className="shrink-0" />
                            <span>{cat.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{item.reason}</p>
                  </div>

                  {/* Evidence Thumbnails */}
                  {item.evidenceUrlList && item.evidenceUrlList.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#746A5F] block">
                        {isEng ? 'Attached Evidence Images:' : 'Ảnh bằng chứng đính kèm:'}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.evidenceUrlList.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxUrl(url)}
                            className="relative size-16 rounded-xl overflow-hidden border border-[#221E1A]/20 bg-[#F0E7D8] cursor-pointer hover:border-[#A8321C]/30 transition"
                          >
                            <Image src={url} alt={`Evidence ${idx + 1}`} fill unoptimized className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution info if already resolved */}
                  {item.resolution && (
                    <div className="rounded-2xl border border-[#2F6B63]/30 bg-[#2F6B63]/10 p-4 text-xs text-[#2F6B63]">
                      <span className="font-bold block text-[#2F6B63]">
                        {isEng
                          ? `Verdict: ${item.resolution} (Resolved at: ${formatDate(item.resolvedAt, isEng)})`
                          : `Phán quyết: ${item.resolution} (Giải quyết lúc: ${formatDate(item.resolvedAt)})`}
                      </span>
                      {item.adminNote && (
                        <p className="mt-1 text-[#746A5F]">
                          {isEng ? `Admin Verdict Note: ${item.adminNote}` : `Ghi chú phán quyết: ${item.adminNote}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  {item.status === 'Pending' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setArbitratingDispute(item);
                          setResolutionChoice('MutualCancel');
                          setAdminNote('');
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#A8321C] to-[#A8321C] px-5 py-2.5 text-xs font-bold text-[#241F1A] shadow-lg hover:brightness-110 transition"
                      >
                        <Gavel size={14} />
                        {isEng ? 'Issue Arbitration Verdict' : 'Ban hành Phán quyết (Arbitrate)'}
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INSPECT TRADE DETAILS */}
      {/* ========================================================= */}
      {inspectingTrade && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] backdrop-blur-md p-4 sm:p-6"
          onClick={() => setInspectingTrade(null)}
        >
          <div
            className="relative flex flex-col max-h-[90vh] max-w-4xl w-full rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#221E1A]/10 p-5">
              <div>
                <h3 className="font-h1 text-base font-bold text-[#241F1A]">
                  {isEng ? 'Inspect Art Trade Details' : 'Thanh tra Giao dịch Trao đổi tranh'}
                </h3>
                <span className="text-xs font-mono text-[#746A5F]">ID: {inspectingTrade.id}</span>
              </div>
              <button
                onClick={() => setInspectingTrade(null)}
                className="flex size-8 items-center justify-center rounded-full bg-[#F0E7D8] text-[#746A5F] hover:text-[#241F1A]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Trade Title & Notes */}
              <div>
                <h4 className="text-lg font-bold text-[#241F1A]">{inspectingTrade.title}</h4>
                {inspectingTrade.description && (
                  <p className="mt-1 text-xs text-[#746A5F]">{inspectingTrade.description}</p>
                )}
              </div>

              {/* Side A vs Side B Visual Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Side A */}
                <div className="min-w-0 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-periwinkle uppercase tracking-wider">
                      {isEng ? 'Side A (Initiator)' : 'Side A (Khởi tạo)'}
                    </span>
                    <span className="text-xs font-semibold text-[#241F1A]">
                      {inspectingTrade.initiator?.fullName}
                    </span>
                  </div>

                  <div
                    className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F0E7D8] border border-[#221E1A]/10 cursor-pointer"
                    onClick={() => setLightboxUrl(inspectingTrade.initiatorPreviewUrl || null)}
                  >
                    {inspectingTrade.initiatorPreviewUrl ? (
                      <Image
                        src={inspectingTrade.initiatorPreviewUrl}
                        alt="Side A Preview"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#746A5F]">
                        {isEng ? 'No artwork submitted yet' : 'Chưa nộp tác phẩm'}
                      </div>
                    )}
                  </div>

                  <div className="text-xs space-y-1 text-[#746A5F] min-w-0">
                    {(() => {
                      const parsed = parseNoteWithAttachments(inspectingTrade.initiatorRequestNote);
                      return (
                        <div className="space-y-1.5">
                          <div className="break-words">
                            {isEng ? 'Drawing Request: ' : 'Yêu cầu vẽ: '}
                            <strong className="text-[#241F1A] break-words">
                              {parsed.text || (isEng ? 'None' : 'Không có')}
                            </strong>
                          </div>
                          {parsed.images.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {parsed.images.map((imgUrl, idx) => (
                                <button
                                  key={`${imgUrl}-${idx}`}
                                  type="button"
                                  onClick={() => setLightboxUrl(imgUrl)}
                                  className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#221E1A]/15 bg-[#F0E7D8] hover:border-brand-periwinkle transition cursor-pointer"
                                  title={isEng ? 'View reference image' : 'Xem ảnh tham khảo'}
                                >
                                  <Image src={imgUrl} alt={`Ref ${idx + 1}`} fill unoptimized className="object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div>
                      {isEng ? 'Submitted At: ' : 'Thời điểm nộp: '}
                      <span className="font-mono text-[#8A6A1F]">
                        {formatDate(inspectingTrade.initiatorSubmittedAt, isEng)}
                      </span>
                    </div>
                    <div>
                      {isEng ? 'Satisfaction Confirmed: ' : 'Xác nhận hài lòng: '}
                      <span className="font-mono">
                        {inspectingTrade.isInitiatorConfirmed
                          ? isEng
                            ? 'Confirmed'
                            : 'Đã xác nhận'
                          : isEng
                            ? 'Pending'
                            : 'Chưa'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side B */}
                <div className="min-w-0 rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5F3F86] uppercase tracking-wider">
                      {isEng ? 'Side B (Partner)' : 'Side B (Đối tác)'}
                    </span>
                    <span className="text-xs font-semibold text-[#241F1A]">
                      {inspectingTrade.receiver?.fullName}
                    </span>
                  </div>

                  <div
                    className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F0E7D8] border border-[#221E1A]/10 cursor-pointer"
                    onClick={() => setLightboxUrl(inspectingTrade.receiverPreviewUrl || null)}
                  >
                    {inspectingTrade.receiverPreviewUrl ? (
                      <Image
                        src={inspectingTrade.receiverPreviewUrl}
                        alt="Side B Preview"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#746A5F]">
                        {isEng ? 'No artwork submitted yet' : 'Chưa nộp tác phẩm'}
                      </div>
                    )}
                  </div>

                  <div className="text-xs space-y-1 text-[#746A5F] min-w-0">
                    {(() => {
                      const parsed = parseNoteWithAttachments(inspectingTrade.receiverRequestNote);
                      return (
                        <div className="space-y-1.5">
                          <div className="break-words">
                            {isEng ? 'Drawing Request: ' : 'Yêu cầu vẽ: '}
                            <strong className="text-[#241F1A] break-words">
                              {parsed.text || (isEng ? 'None' : 'Không có')}
                            </strong>
                          </div>
                          {parsed.images.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {parsed.images.map((imgUrl, idx) => (
                                <button
                                  key={`${imgUrl}-${idx}`}
                                  type="button"
                                  onClick={() => setLightboxUrl(imgUrl)}
                                  className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#221E1A]/15 bg-[#F0E7D8] hover:border-brand-periwinkle transition cursor-pointer"
                                  title={isEng ? 'View reference image' : 'Xem ảnh tham khảo'}
                                >
                                  <Image src={imgUrl} alt={`Ref ${idx + 1}`} fill unoptimized className="object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div>
                      {isEng ? 'Submitted At: ' : 'Thời điểm nộp: '}
                      <span className="font-mono text-[#8A6A1F]">
                        {formatDate(inspectingTrade.receiverSubmittedAt, isEng)}
                      </span>
                    </div>
                    <div>
                      {isEng ? 'Satisfaction Confirmed: ' : 'Xác nhận hài lòng: '}
                      <span className="font-mono">
                        {inspectingTrade.isReceiverConfirmed
                          ? isEng
                            ? 'Confirmed'
                            : 'Đã xác nhận'
                          : isEng
                            ? 'Pending'
                            : 'Chưa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#221E1A]/10 p-4 flex justify-end">
              <button
                onClick={() => setInspectingTrade(null)}
                className="rounded-xl bg-[#F0E7D8] px-5 py-2 text-xs font-semibold text-[#241F1A] hover:bg-[#F0E7D8]"
              >
                {isEng ? 'Close' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORCE CANCEL TRADE */}
      {/* ========================================================= */}
      {cancellingTrade && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] backdrop-blur-md p-4"
          onClick={() => setCancellingTrade(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-3">
              <h3 className="font-h1 text-base font-bold text-[#A8321C] flex items-center gap-2">
                <AlertTriangle size={18} /> {isEng ? 'Force Cancel Trade' : 'Cưỡng chế Hủy Giao Dịch'}
              </h3>
              <button onClick={() => setCancellingTrade(null)} className="text-[#746A5F] hover:text-[#241F1A]">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#746A5F]">
              {isEng ? (
                <>
                  You are intervening as Administrator to cancel trade: &quot;
                  <strong className="text-[#241F1A]">{cancellingTrade.title}</strong>&quot;.
                </>
              ) : (
                <>
                  Bạn đang can thiệp với tư cách Quản trị viên để hủy bỏ giao dịch: &quot;
                  <strong className="text-[#241F1A]">{cancellingTrade.title}</strong>&quot;.
                </>
              )}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#746A5F] mb-1 font-semibold">
                  {isEng ? 'Cancellation reason (required):' : 'Lý do hủy (bắt buộc):'}
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={
                    isEng
                      ? 'Enter administrator cancellation reason (copyright violation, deadline failure, etc.)...'
                      : 'Nhập lý do quản trị viên hủy (vi phạm bản quyền, không hoàn thành đúng hạn...)'
                  }
                  className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-xs text-[#241F1A] focus:border-[#A8321C]/30 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkViolation"
                  checked={isViolation}
                  onChange={(e) => setIsViolation(e.target.checked)}
                  className="rounded border-[#221E1A]/20 bg-[#FFFCF6]"
                />
                <label htmlFor="chkViolation" className="text-[#746A5F] cursor-pointer">
                  {isEng
                    ? 'Mark as platform rule violation (will apply trade slot freeze sanction)'
                    : 'Xác định là vi phạm quy định nền tảng (sẽ áp dụng chế tài đóng băng lượt)'}
                </label>
              </div>

              {isViolation && (
                <div>
                  <label className="block text-[#746A5F] mb-1 font-semibold">
                    {isEng ? 'Select violating party to sanction:' : 'Bên vi phạm cần xử phạt:'}
                  </label>
                  <select
                    value={violatorSide}
                    onChange={(e) => setViolatorSide(e.target.value as 'initiator' | 'receiver' | 'none')}
                    className="w-full rounded-xl border border-[#221E1A]/10 bg-[#F7F2E9] p-2.5 text-xs text-[#241F1A] focus:border-[#A8321C]/30 focus:outline-none"
                  >
                    <option value="none">{isEng ? '-- Select violating party --' : '-- Chọn bên vi phạm --'}</option>
                    <option value="initiator">Side A: {cancellingTrade.initiator.fullName}</option>
                    <option value="receiver">Side B: {cancellingTrade.receiver.fullName}</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221E1A]/10">
              <button
                onClick={() => setCancellingTrade(null)}
                className="rounded-xl bg-[#F0E7D8] px-4 py-2 text-xs font-semibold text-[#746A5F] hover:bg-[#F0E7D8]"
              >
                {isEng ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                onClick={handleForceCancelSubmit}
                disabled={cancellingSubmitting}
                className="rounded-xl bg-[#A8321C]/12 px-5 py-2 text-xs font-bold text-[#241F1A] hover:bg-[#A8321C]/12 disabled:opacity-50"
              >
                {cancellingSubmitting
                  ? isEng
                    ? 'Processing...'
                    : 'Đang xử lý...'
                  : isEng
                    ? 'Confirm Cancellation'
                    : 'Xác nhận Hủy giao dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ARBITRATE DISPUTE */}
      {/* ========================================================= */}
      {arbitratingDispute && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#E5D8C2] backdrop-blur-md p-4"
          onClick={() => setArbitratingDispute(null)}
        >
          <div
            className="relative max-w-xl w-full rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#221E1A]/10 pb-3">
              <h3 className="font-h1 text-base font-bold text-[#A8321C] flex items-center gap-2">
                <Gavel size={18} /> {isEng ? 'Arbitrate Art Trade Dispute' : 'Phán quyết Tranh chấp trao đổi tranh'}
              </h3>
              <button onClick={() => setArbitratingDispute(null)} className="text-[#746A5F] hover:text-[#241F1A]">
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-xs space-y-2">
              <div>
                {isEng ? 'Claim: ' : 'Khiếu nại: '}
                <strong className="text-[#241F1A]">
                  {arbitratingDispute.tradeTitle || (isEng ? 'Trade' : 'Giao dịch')}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#746A5F]">{isEng ? 'Violation Category: ' : 'Phân loại vi phạm: '}</span>
                {(() => {
                  const cat = getCategoryInfo(arbitratingDispute.category, arbitratingDispute.reason, isEng);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cat.color} ${cat.border}`}
                    >
                      <ShieldAlert size={11} className="shrink-0" />
                      <span>{cat.label}</span>
                    </span>
                  );
                })()}
              </div>
              <div>
                {isEng ? 'Complainant: ' : 'Người khiếu nại: '}
                <span className="text-brand-periwinkle font-semibold">{arbitratingDispute.raisedByName}</span>
              </div>
              <div>
                {isEng ? 'Accused Partner: ' : 'Đối tác bị khiếu nại: '}
                <span className="text-[#A8321C] font-semibold">{arbitratingDispute.partnerName}</span>
              </div>
            </div>

            {/* Decision options */}
            <div className="space-y-2 text-xs">
              <label className="block text-[#746A5F] font-bold mb-1">
                {isEng ? 'Select official arbitration verdict:' : 'Chọn phán quyết chính thức:'}
              </label>
              {[
                {
                  id: 'FaultReceiver',
                  title: isEng
                    ? '🛑 Partner at Fault (FaultReceiver)'
                    : '🛑 Lỗi thuộc về bên bị khiếu nại (Partner Fault)',
                  desc: isEng
                    ? 'Cancel trade, freeze 1 Art Trade slot of the accused partner for 30 days.'
                    : 'Hủy giao dịch, đóng băng 1 lượt trao đổi tranh của bên bị khiếu nại trong 30 ngày.',
                },
                {
                  id: 'FaultInitiator',
                  title: isEng
                    ? '🛑 Complainant at Fault (FaultInitiator)'
                    : '🛑 Lỗi thuộc về bên khiếu nại (Complainant Fault)',
                  desc: isEng
                    ? 'Cancel trade, freeze 1 Art Trade slot of the complainant for 30 days (due to false claim/violation).'
                    : 'Hủy giao dịch, đóng băng 1 lượt trao đổi tranh của bên khởi kiện trong 30 ngày (do báo cáo sai/vi phạm).',
                },
                {
                  id: 'MutualCancel',
                  title: isEng
                    ? '🤝 Mutual Cancellation (MutualCancel)'
                    : '🤝 Hòa giải hai bên (Mutual Cancellation)',
                  desc: isEng
                    ? 'Cancel trade without penalty. Unlock trade slots for both artists.'
                    : 'Hủy giao dịch không phạt. Mở khóa lượt cho cả hai bên nghệ sĩ.',
                },
                {
                  id: 'Dismissed',
                  title: isEng
                    ? '❌ Dismiss Dispute Claim (Dismissed)'
                    : '❌ Bác bỏ đơn khiếu nại (Dismissed)',
                  desc: isEng
                    ? 'No copyright infringement or bad faith found. Close the dispute claim.'
                    : 'Không phát hiện vi phạm bản quyền hay gian lận. Đóng đơn khiếu nại.',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`block rounded-2xl border p-3 cursor-pointer transition ${resolutionChoice === opt.id
                      ? 'border-[#A8321C]/30 bg-[#A8321C]/10 text-[#241F1A]'
                      : 'border-[#221E1A]/10 bg-[#FFFCF6] text-[#746A5F] hover:bg-[#FFFCF6]'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="resolution"
                      checked={resolutionChoice === opt.id}
                      onChange={() => setResolutionChoice(opt.id as TradeDisputeResolutionType)}
                    />
                    <span className="font-bold">{opt.title}</span>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-[#746A5F]">{opt.desc}</p>
                </label>
              ))}
            </div>

            {/* Admin Note */}
            <div>
              <label className="block text-[#746A5F] mb-1 text-xs font-semibold">
                {isEng
                  ? 'Administrator arbitration verdict note (required):'
                  : 'Ghi chú phán quyết của Quản trị viên (bắt buộc):'}
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  isEng
                    ? 'State the violation basis, AI artwork evidence, or initial agreed terms...'
                    : 'Nêu rõ căn cứ vi phạm, bằng chứng tranh AI hoặc thỏa thuận ban đầu...'
                }
                className="w-full rounded-xl border border-[#221E1A]/10 bg-[#FFFCF6] p-3 text-xs text-[#241F1A] focus:border-[#A8321C]/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221E1A]/10">
              <button
                onClick={() => setArbitratingDispute(null)}
                className="rounded-xl bg-[#F0E7D8] px-4 py-2 text-xs font-semibold text-[#746A5F] hover:bg-[#F0E7D8]"
              >
                {isEng ? 'Cancel' : 'Hủy'}
              </button>
              <button
                onClick={handleResolveDisputeSubmit}
                disabled={arbitratingSubmitting}
                className="rounded-xl bg-gradient-to-r from-[#A8321C] to-[#A8321C] px-5 py-2 text-xs font-bold text-[#241F1A] hover:brightness-110 disabled:opacity-50"
              >
                {arbitratingSubmitting
                  ? isEng
                    ? 'Arbitrating...'
                    : 'Đang phân xử...'
                  : isEng
                    ? 'Issue Verdict'
                    : 'Ban hành Phán quyết'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIGHTBOX MODAL */}
      {/* ========================================================= */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0E7D8]/90 backdrop-blur-xl p-4 sm:p-8"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative flex flex-col max-h-[90vh] max-w-4xl w-full rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4 border-b border-[#221E1A]/10">
              <button
                onClick={() => setLightboxUrl(null)}
                className="flex size-8 items-center justify-center rounded-full bg-[#F0E7D8] text-[#746A5F] hover:text-[#241F1A]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative flex-1 min-h-[60vh] w-full bg-[#E5D8C2] p-4">
              <Image src={lightboxUrl} alt="Enlarged Artwork" fill unoptimized className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
