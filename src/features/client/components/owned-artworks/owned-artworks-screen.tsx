'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Crown,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FolderKanban,
  Gavel,
  Layers,
  Maximize2,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { clientOwnedArtworksService } from '../../services/client-owned-artworks.service';
import type {
  OwnedArtworkDto,
  OwnedArtworkFilterType,
  OwnedArtworkSortType,
  OwnedArtworkSourceType,
} from '../../types/owned-artwork.types';
import { auctionService, auctionError } from '@/features/auction/services/auction.service';
import type { AuctionCertificateDto } from '@/features/auction/types/auction.types';
import { AuctionCertificateCard } from '@/features/auction/components/auction-certificate-card';


/// Ảnh dự phòng khi API trả về chuỗi rỗng ở thumbnailUrl/imageUrl.
/// Next Image ném lỗi console nếu src là "" nên phải chốt về một ảnh có thật.
const FALLBACK_IMAGE = '/weblogo.png';

function formatVnd(value?: number | null) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(isoString?: string) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function OwnedArtworksScreen() {
  const { t, lang } = useLanguage();
  const [artworks, setArtworks] = useState<OwnedArtworkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<OwnedArtworkFilterType>('ALL');
  const [sortBy, setSortBy] = useState<OwnedArtworkSortType>('NEWEST');

  // Lightbox Preview Modal
  const [lightboxArtwork, setLightboxArtwork] = useState<OwnedArtworkDto | null>(null);

  // Auction Certificate Modal
  const [selectedCert, setSelectedCert] = useState<AuctionCertificateDto | null>(null);
  const [loadingCertId, setLoadingCertId] = useState<string | null>(null);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientOwnedArtworksService.getOwnedArtworks();
      setArtworks(data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không tải được danh sách tác phẩm đã sở hữu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = artworks.length;
    const auctions = artworks.filter((a) => a.sourceType === 'Auction').length;
    const commissions = artworks.filter((a) => a.sourceType === 'Commission').length;
    const trades = artworks.filter((a) => a.sourceType === 'Trade').length;
    return { total, auctions, commissions, trades };
  }, [artworks]);

  // Filtering & Sorting
  const filteredArtworks = useMemo(() => {
    return artworks
      .filter((item) => {
        // Source type filter
        if (sourceFilter !== 'ALL' && item.sourceType !== sourceFilter) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchCreator = item.creatorName?.toLowerCase().includes(q);
          const matchCert = item.certificateNumber?.toLowerCase().includes(q);
          return matchTitle || matchCreator || matchCert;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
        }
        if (sortBy === 'PRICE_HIGH') {
          return (b.price || 0) - (a.price || 0);
        }
        if (sortBy === 'PRICE_LOW') {
          return (a.price || 0) - (b.price || 0);
        }
        if (sortBy === 'TITLE_AZ') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [artworks, sourceFilter, searchQuery, sortBy]);

  const handleOpenCertificate = async (item: OwnedArtworkDto) => {
    if (item.sourceType !== 'Auction' || !item.sourceId) return;
    try {
      setLoadingCertId(item.id);
      const cert = await auctionService.getCertificate(item.sourceId);
      setSelectedCert(cert);
    } catch (err) {
      alert(auctionError(err) || 'Không thể tải chứng nhận quyền sở hữu.');
    } finally {
      setLoadingCertId(null);
    }
  };

  const getSourceBadge = (sourceType: OwnedArtworkSourceType) => {
    switch (sourceType) {
      case 'Auction':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Crown size={12} className="text-amber-400" />
            {lang === 'VIE' ? 'Đấu giá' : 'Auction Exclusive'}
          </span>
        );
      case 'Commission':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/60 bg-sky-500/20 px-3 py-1 text-[11px] font-bold text-sky-300 backdrop-blur-md shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <FolderKanban size={12} className="text-sky-400" />
            {lang === 'VIE' ? 'Đơn vẽ hoàn tất' : 'Commission Deliverable'}
          </span>
        );
      case 'Trade':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/60 bg-purple-500/20 px-3 py-1 text-[11px] font-bold text-purple-300 backdrop-blur-md shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <ArrowLeftRight size={12} className="text-purple-400" />
            {lang === 'VIE' ? 'Trao đổi nghệ thuật' : 'Art Trade Exchange'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-brand-navy via-[#1F2335]/90 to-purple-950/40 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-brand-periwinkle/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 size-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300">
              <Sparkles size={14} className="text-amber-400" />
              {lang === 'VIE' ? 'KHO TÁC PHẨM CLIENT' : 'CLIENT ART VAULT'}
            </div>
            <h1 className="mt-3 font-h1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {lang === 'VIE' ? 'Tác phẩm đã sở hữu' : 'Owned Artworks'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'VIE'
                ? 'Tổng hợp tất cả tác phẩm số bạn đã sở hữu hợp pháp từ các phiên đấu giá độc bản, đơn đặt vẽ (Commission) hoàn tất, và các đợt trao đổi nghệ thuật (Art Trade).'
                : 'All digital artworks you legally own across settled auctions, completed commissions, and finalized art trades.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={fetchArtworks}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
              title="Làm mới"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {lang === 'VIE' ? 'Làm mới' : 'Refresh'}
            </button>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition"
            >
              <Crown size={14} />
              {lang === 'VIE' ? 'Kho tranh đấu giá' : 'Auction Vault'}
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block">
              {lang === 'VIE' ? 'Tổng tác phẩm' : 'Total Owned'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              {stats.total}
            </span>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <span className="text-[11px] font-medium text-amber-300/80 block flex items-center gap-1.5">
              <Crown size={12} className="text-amber-400" />
              {lang === 'VIE' ? 'Từ Đấu giá' : 'Auctions'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5 block">
              {stats.auctions}
            </span>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5">
            <span className="text-[11px] font-medium text-sky-300/80 block flex items-center gap-1.5">
              <FolderKanban size={12} className="text-sky-400" />
              {lang === 'VIE' ? 'Từ Commissions' : 'Commissions'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-sky-300 font-mono mt-0.5 block">
              {stats.commissions}
            </span>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3.5">
            <span className="text-[11px] font-medium text-purple-300/80 block flex items-center gap-1.5">
              <ArrowLeftRight size={12} className="text-purple-400" />
              {lang === 'VIE' ? 'Từ Art Trade' : 'Art Trades'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-0.5 block">
              {stats.trades}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#1F2335]/70 backdrop-blur-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'VIE'
                ? 'Tìm theo tên tranh, họa sĩ, số chứng nhận...'
                : 'Search by artwork title, artist, certificate...'
            }
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:border-brand-periwinkle focus:outline-none focus:ring-1 focus:ring-brand-periwinkle transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Source Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'ALL', labelVi: 'Tất cả', labelEn: 'All' },
              { key: 'Auction', labelVi: 'Đấu giá', labelEn: 'Auctions' },
              { key: 'Commission', labelVi: 'Commissions', labelEn: 'Commissions' },
              { key: 'Trade', labelVi: 'Trao đổi', labelEn: 'Trades' },
            ] as const
          ).map((tab) => {
            const active = sourceFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSourceFilter(tab.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-brand-periwinkle text-brand-navy shadow-[0_0_12px_rgba(167,172,217,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {lang === 'VIE' ? tab.labelVi : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown size={14} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as OwnedArtworkSortType)}
            aria-label={lang === 'VIE' ? 'Sắp xếp theo' : 'Sort by'}
            className="rounded-xl border border-white/10 bg-[#171926] px-3 py-2 text-xs text-white focus:border-brand-periwinkle focus:outline-none"
          >
            <option value="NEWEST">{lang === 'VIE' ? 'Mới nhất' : 'Newest'}</option>
            <option value="OLDEST">{lang === 'VIE' ? 'Cũ nhất' : 'Oldest'}</option>
            <option value="PRICE_HIGH">{lang === 'VIE' ? 'Giá cao nhất' : 'Highest Price'}</option>
            <option value="PRICE_LOW">{lang === 'VIE' ? 'Giá thấp nhất' : 'Lowest Price'}</option>
            <option value="TITLE_AZ">{lang === 'VIE' ? 'Tên A - Z' : 'Title A - Z'}</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-24 text-center">
          <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-brand-periwinkle" />
          <p className="text-xs text-slate-400">
            {lang === 'VIE'
              ? 'Đang đồng bộ kho tác phẩm sở hữu...'
              : 'Synchronizing your owned artworks...'}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-xs text-red-300">
          <p>{error}</p>
          <button
            onClick={fetchArtworks}
            className="mt-3 rounded-xl bg-red-500/20 px-4 py-2 font-semibold text-red-200 hover:bg-red-500/30"
          >
            {lang === 'VIE' ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredArtworks.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] py-20 text-center px-4">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400">
            <Layers size={28} />
          </div>
          <h3 className="font-h1 text-base sm:text-lg font-bold text-white">
            {lang === 'VIE' ? 'Chưa tìm thấy tác phẩm sở hữu nào' : 'No owned artworks found'}
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || sourceFilter !== 'ALL'
              ? lang === 'VIE'
                ? 'Không có kết quả phù hợp với bộ lọc hiện tại. Thử xóa tìm kiếm hoặc đổi tiêu chí lọc.'
                : 'No results match your current filter. Try adjusting your search query.'
              : lang === 'VIE'
                ? 'Khi bạn thắng đấu giá, hoàn tất đơn đặt vẽ Commission, hoặc hoàn thành trao đổi Art Trade, tác phẩm sẽ tự động lưu trữ tại đây.'
                : 'Artworks you acquire via auctions, completed commissions, or art trades will appear here.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auctions"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition"
            >
              <Gavel size={14} />
              {lang === 'VIE' ? 'Tham gia Đấu giá' : 'Explore Auctions'}
            </Link>
            <Link
              href="/client/commissions"
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/10 px-5 py-2.5 text-xs font-semibold text-sky-300 hover:bg-sky-400/20 transition"
            >
              <FolderKanban size={14} />
              {lang === 'VIE' ? 'Xem Commissions' : 'My Commissions'}
            </Link>
            <Link
              href="/art-trades"
              className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-400/10 px-5 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-400/20 transition"
            >
              <ArrowLeftRight size={14} />
              {lang === 'VIE' ? 'Khám phá Art Trade' : 'Art Trade Hub'}
            </Link>
          </div>
        </div>
      )}

      {/* Artworks Grid */}
      {!loading && !error && filteredArtworks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtworks.map((item) => (
            <article
              key={`${item.sourceType}-${item.id}`}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-brand-periwinkle/40 hover:shadow-[0_0_25px_rgba(167,172,217,0.12)]"
            >
              <div>
                {/* Artwork Image Container with Lightbox Trigger */}
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden bg-black/40 cursor-pointer"
                  onClick={() => setLightboxArtwork(item)}
                >
                  <Image
                    src={item.thumbnailUrl || item.imageUrl || FALLBACK_IMAGE}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Source Badge (Top-left) */}
                  <div className="absolute top-3 left-3 z-10">{getSourceBadge(item.sourceType)}</div>

                  {/* Lightbox Zoom Icon (Top-right) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxArtwork(item);
                    }}
                    className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition hover:bg-white hover:text-brand-navy shadow-md"
                    title={lang === 'VIE' ? 'Phóng to ảnh' : 'Zoom image'}
                  >
                    <Maximize2 size={13} />
                  </button>

                  {/* Certificate Number Pill (Bottom-right if present) */}
                  {item.certificateNumber && (
                    <div className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/70 border border-white/20 px-2.5 py-1 text-[10px] font-mono text-amber-300 backdrop-blur-md">
                      <FileCheck2 size={11} />
                      {item.certificateNumber}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-h1 text-sm font-bold text-white line-clamp-1 group-hover:text-brand-periwinkle transition">
                      {item.title}
                    </h3>

                    {/* Creator info */}
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-300">
                      {item.creatorAvatarUrl ? (
                        <div className="relative size-5 rounded-full overflow-hidden border border-white/20">
                          <Image
                            src={item.creatorAvatarUrl}
                            alt={item.creatorName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-5 items-center justify-center rounded-full bg-brand-periwinkle/20 text-brand-periwinkle text-[10px] font-bold">
                          {item.creatorName ? item.creatorName.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                      <span className="truncate">{item.creatorName}</span>
                    </div>
                  </div>

                  {/* Financial & Date Metadata box */}
                  <div className="rounded-2xl border border-white/5 bg-black/25 p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {item.sourceType === 'Trade'
                          ? lang === 'VIE'
                            ? 'Hình thức'
                            : 'Type'
                          : lang === 'VIE'
                            ? 'Giá sở hữu'
                            : 'Acquired Value'}
                      </span>
                      <strong className="font-mono text-amber-300 font-bold block truncate">
                        {item.price ? formatVnd(item.price) : lang === 'VIE' ? 'Trao đổi' : 'Exchanged'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {lang === 'VIE' ? 'Ngày sở hữu' : 'Acquired Date'}
                      </span>
                      <strong className="text-white text-[11px] font-mono block">
                        {formatDate(item.acquiredAt)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center gap-2">
                  {/* Download unwatermarked original if available */}
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                      title={lang === 'VIE' ? 'Tải tác phẩm gốc' : 'Download original artwork'}
                    >
                      <Download size={13} />
                      {lang === 'VIE' ? 'Tải tranh gốc' : 'Download'}
                    </a>
                  )}

                  {/* Auction Certificate Modal button */}
                  {item.sourceType === 'Auction' && (
                    <button
                      onClick={() => handleOpenCertificate(item)}
                      disabled={loadingCertId === item.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition disabled:opacity-50"
                      title={lang === 'VIE' ? 'Chứng chỉ' : 'Certificate'}
                    >
                      {loadingCertId === item.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <FileCheck2 size={13} />
                      )}
                      {lang === 'VIE' ? 'Chứng nhận' : 'Certificate'}
                    </button>
                  )}

                  {/* Link to Source Context */}
                  {item.sourceDetailUrl && (
                    <Link
                      href={item.sourceDetailUrl}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white hover:bg-white/10 transition"
                      title={
                        item.sourceType === 'Commission'
                          ? lang === 'VIE'
                            ? 'Vào phòng vẽ'
                            : 'Open Workroom'
                          : item.sourceType === 'Trade'
                            ? lang === 'VIE'
                              ? 'Xem giao dịch trao đổi'
                              : 'Open Trade Details'
                            : lang === 'VIE'
                              ? 'Xem chi tiết tác phẩm'
                              : 'Open Artwork'
                      }
                    >
                      <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {lightboxArtwork && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8 animate-fadeIn"
          onClick={() => setLightboxArtwork(null)}
        >
          <div
            className="relative flex flex-col max-h-[95vh] max-w-5xl w-full rounded-3xl border border-white/15 bg-[#171926]/95 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:px-6">
              <div className="flex items-center gap-3">
                {getSourceBadge(lightboxArtwork.sourceType)}
                <h3 className="font-h1 text-sm sm:text-base font-bold text-white line-clamp-1">
                  {lightboxArtwork.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {lightboxArtwork.downloadUrl && (
                  <a
                    href={lightboxArtwork.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    <Download size={13} />
                    {lang === 'VIE' ? 'Tải ảnh gốc' : 'Download Full'}
                  </a>
                )}
                <button
                  onClick={() => setLightboxArtwork(null)}
                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition"
                  title="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lightbox Image Body */}
            <div className="relative flex-1 min-h-[50vh] sm:min-h-[65vh] w-full bg-black/60 flex items-center justify-center p-4">
              <Image
                src={lightboxArtwork.imageUrl || lightboxArtwork.thumbnailUrl || FALLBACK_IMAGE}
                alt={lightboxArtwork.title}
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            {/* Lightbox Footer Details */}
            <div className="border-t border-white/10 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-brand-periwinkle" />
                  {lang === 'VIE' ? 'Tác giả:' : 'Creator:'}{' '}
                  <strong className="text-white">{lightboxArtwork.creatorName}</strong>
                </span>

                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  {lang === 'VIE' ? 'Sở hữu từ:' : 'Acquired:'}{' '}
                  <strong className="text-white font-mono">
                    {formatDate(lightboxArtwork.acquiredAt)}
                  </strong>
                </span>

                {lightboxArtwork.price ? (
                  <span className="font-mono text-amber-300 font-bold">
                    {formatVnd(lightboxArtwork.price)}
                  </span>
                ) : null}
              </div>

              {lightboxArtwork.sourceDetailUrl && (
                <Link
                  href={lightboxArtwork.sourceDetailUrl}
                  className="inline-flex items-center gap-1 text-brand-periwinkle hover:underline font-semibold"
                >
                  {lightboxArtwork.sourceType === 'Commission'
                    ? lang === 'VIE'
                      ? 'Xem Workroom'
                      : 'Open Workroom'
                    : lightboxArtwork.sourceType === 'Trade'
                      ? lang === 'VIE'
                        ? 'Chi tiết Art Trade'
                        : 'Trade Details'
                      : lang === 'VIE'
                        ? 'Chi tiết đấu giá'
                        : 'Auction Details'}
                  <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auction Certificate Modal Card */}
      {selectedCert && (
        <AuctionCertificateCard
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
