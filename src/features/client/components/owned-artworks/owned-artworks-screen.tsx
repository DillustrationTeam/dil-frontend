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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/20 px-3 py-1 text-[11px] font-bold text-[#8A6A1F] backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Crown size={12} className="text-[#8A6A1F]" />
            {lang === 'VIE' ? 'Đấu giá' : 'Auction Exclusive'}
          </span>
        );
      case 'Commission':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2C6A86]/40 bg-[#2C6A86]/20 px-3 py-1 text-[11px] font-bold text-[#2C6A86] backdrop-blur-md shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <FolderKanban size={12} className="text-[#2C6A86]" />
            {lang === 'VIE' ? 'Đơn vẽ hoàn tất' : 'Commission Deliverable'}
          </span>
        );
      case 'Trade':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5F3F86]/40 bg-[#5F3F86]/20 px-3 py-1 text-[11px] font-bold text-[#5F3F86] backdrop-blur-md shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <ArrowLeftRight size={12} className="text-[#5F3F86]" />
            {lang === 'VIE' ? 'Trao đổi nghệ thuật' : 'Art Trade Exchange'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="wrap page">
      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header className="page-head">
        <div>
          <p className="eyebrow">{lang === 'VIE' ? 'Kho tác phẩm của bạn' : 'Your art vault'}</p>
          <h1>{lang === 'VIE' ? 'Tác phẩm đã sở hữu' : 'Owned artworks'}</h1>
          <p className="page-head__sub">
            {lang === 'VIE'
              ? 'Tác phẩm số bạn sở hữu hợp pháp: phiên đấu giá đã chốt, đặt vẽ đã bàn giao, và các đợt trao đổi hoàn tất.'
              : 'Digital works you legally own — settled auctions, delivered commissions and finalized trades.'}
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" onClick={fetchArtworks} className="btn btn--outline btn--sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden /> {t('Làm mới')}
          </button>
          <Link href="/explore" className="btn btn--primary btn--sm">
            {lang === 'VIE' ? 'Khám phá sàn tranh' : 'Explore market'}
          </Link>
        </div>
      </header>

      {/* ─── STATS ──────────────────────────────────────────── */}
      <p className="statsline">
        <span>
          <b>{filteredArtworks.length}</b>{lang === 'VIE' ? 'tác phẩm' : 'artworks'}
        </span>
        <span>
          <b>{filteredArtworks.filter((a) => a.sourceType === 'Auction').length}</b>
          {lang === 'VIE' ? 'từ đấu giá' : 'from auctions'}
        </span>
        <span>
          <b>{filteredArtworks.filter((a) => a.exclusiveBadge).length}</b>
          {lang === 'VIE' ? 'độc bản' : 'exclusive'}
        </span>
      </p>

      {/* ─── FILTERBAR ──────────────────────────────────────── */}
      <div className="filterbar mt-6">
        <div className="filterbar__tabs" role="tablist" aria-label={t('Nguồn sở hữu')}>
          {([
            { key: 'ALL', vi: 'Tất cả', en: 'All' },
            { key: 'Auction', vi: 'Đấu giá', en: 'Auctions' },
            { key: 'Commission', vi: 'Commission', en: 'Commissions' },
            { key: 'Trade', vi: 'Trao đổi', en: 'Trades' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={sourceFilter === tab.key}
              onClick={() => setSourceFilter(tab.key)}
              className="fpill"
            >
              {lang === 'VIE' ? tab.vi : tab.en}
            </button>
          ))}
        </div>

        <div className="filterbar__tools">
          <div className="input-wrap">
            <Search aria-hidden />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'VIE' ? 'Tìm tên tác phẩm hoặc họa sĩ…' : 'Search title or artist…'}
              aria-label={t('Tìm tác phẩm')}
              className="input min-h-11 w-60 py-2 pl-9 text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as OwnedArtworkSortType)}
            aria-label={t('Sắp xếp')}
            className="input min-h-11 text-sm"
          >
            <option value="NEWEST">{lang === 'VIE' ? 'Mới nhất' : 'Newest'}</option>
            <option value="OLDEST">{lang === 'VIE' ? 'Cũ nhất' : 'Oldest'}</option>
            <option value="PRICE_HIGH">{lang === 'VIE' ? 'Giá cao → thấp' : 'Price high → low'}</option>
            <option value="PRICE_LOW">{lang === 'VIE' ? 'Giá thấp → cao' : 'Price low → high'}</option>
            <option value="TITLE_AZ">{lang === 'VIE' ? 'Tên A → Z' : 'Title A → Z'}</option>
          </select>
        </div>
      </div>

      {/* ─── GRID ───────────────────────────────────────────── */}
      {loading ? (
        <div className="wall wall--grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="empty">
          <h3>{error}</h3>
          <div className="empty__actions">
            <button type="button" onClick={fetchArtworks} className="btn btn--primary btn--sm">
              {t('Thử lại')}
            </button>
          </div>
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="empty">
          <Layers size={40} className="empty__art" aria-hidden />
          <h3>{lang === 'VIE' ? 'Chưa có tác phẩm nào' : 'No artworks yet'}</h3>
          <p>
            {lang === 'VIE'
              ? 'Thắng một phiên đấu giá, hoàn tất một đặt vẽ hoặc một đợt trao đổi — tác phẩm sẽ xuất hiện ở đây.'
              : 'Win an auction, finish a commission or complete a trade — the work will appear here.'}
          </p>
          <div className="empty__actions">
            <Link href="/auctions" className="btn btn--primary btn--sm">
              <Gavel size={14} aria-hidden /> {lang === 'VIE' ? 'Vào sàn đấu giá' : 'Browse auctions'}
            </Link>
            <Link href="/explore" className="btn btn--outline btn--sm">
              {lang === 'VIE' ? 'Khám phá sàn tranh' : 'Explore market'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="wall wall--grid">
          {filteredArtworks.map((artwork) => (
            <article key={artwork.id} className="art-card">
              <button
                type="button"
                onClick={() => setLightboxArtwork(artwork)}
                className="art-card__frame block w-full text-left"
                aria-label={`Xem ${artwork.title}`}
              >
                <div className="art-card__img">
                  <Image
                    src={artwork.thumbnailUrl || artwork.imageUrl || FALLBACK_IMAGE}
                    alt={artwork.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover object-center"
                  />
                </div>
                <span className="badge badge--info absolute left-3 top-3 z-10">
                  {artwork.sourceType === 'Auction'
                    ? lang === 'VIE' ? 'Đấu giá' : 'Auction'
                    : artwork.sourceType === 'Commission'
                      ? 'Commission'
                      : lang === 'VIE' ? 'Trao đổi' : 'Trade'}
                </span>
                {artwork.exclusiveBadge ? (
                  <span className="badge badge--soon absolute right-3 top-3 z-10">
                    <Crown size={11} aria-hidden /> {artwork.exclusiveBadge}
                  </span>
                ) : null}
                <span className="art-card__zoom" aria-hidden="true">
                  <Maximize2 size={16} />
                </span>
              </button>

              <div className="art-card__meta">
                <span className="art-card__title">{artwork.title}</span>
                <span className="art-card__sub">
                  <span>{artwork.creatorName}</span>
                  <span>·</span>
                  <span>{formatDate(artwork.acquiredAt)}</span>
                </span>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="art-card__reason">
                    {formatVnd(artwork.price) ?? (lang === 'VIE' ? 'Không có giá' : 'No price')}
                  </span>
                  {artwork.downloadUrl ? (
                    <a
                      href={artwork.downloadUrl}
                      className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-[#8C3718] hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={12} aria-hidden /> {lang === 'VIE' ? 'Tải' : 'Download'}
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ─── LIGHTBOX ───────────────────────────────────────── */}
      {lightboxArtwork ? (
        <div
          className="fixed inset-0 z-[300] grid place-items-center bg-[#221E1A]/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxArtwork(null);
          }}
        >
          <div className="relative grid max-h-[92dvh] w-full max-w-[1100px] overflow-hidden rounded-[24px] bg-[#FFFCF6] shadow-[0_44px_90px_-44px_rgba(58,42,26,0.7)] lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="relative min-h-[50vh] bg-[#F0E7D8]">
              <Image
                src={lightboxArtwork.imageUrl || lightboxArtwork.thumbnailUrl || FALLBACK_IMAGE}
                alt={lightboxArtwork.title}
                fill
                unoptimized
                sizes="70vw"
                className="object-contain object-center"
              />
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl leading-snug text-[#241F1A]">
                    {lightboxArtwork.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#6E6459]">{lightboxArtwork.creatorName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxArtwork(null)}
                  aria-label="Đóng"
                  className="icon-btn shrink-0"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>

              <div className="kv">
                <div>
                  <span>{lang === 'VIE' ? 'Nguồn' : 'Source'}</span>
                  <b>{lightboxArtwork.sourceType}</b>
                </div>
                <div>
                  <span>{lang === 'VIE' ? 'Ngày sở hữu' : 'Acquired'}</span>
                  <b>{formatDate(lightboxArtwork.acquiredAt)}</b>
                </div>
                <div>
                  <span>{lang === 'VIE' ? 'Giá' : 'Price'}</span>
                  <b>{formatVnd(lightboxArtwork.price) ?? '—'}</b>
                </div>
                {lightboxArtwork.certificateNumber ? (
                  <div>
                    <span>{lang === 'VIE' ? 'Chứng nhận' : 'Certificate'}</span>
                    <b>{lightboxArtwork.certificateNumber}</b>
                  </div>
                ) : null}
              </div>

              <div className="mt-auto grid gap-2">
                {lightboxArtwork.downloadUrl ? (
                  <a
                    href={lightboxArtwork.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--primary btn--block btn--sm"
                  >
                    <Download size={14} aria-hidden /> {lang === 'VIE' ? 'Tải tác phẩm' : 'Download'}
                  </a>
                ) : null}
                {lightboxArtwork.sourceDetailUrl ? (
                  <Link href={lightboxArtwork.sourceDetailUrl} className="btn btn--outline btn--block btn--sm">
                    {lang === 'VIE' ? 'Xem chi tiết nguồn' : 'View source'} <ExternalLink size={13} aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── CERTIFICATE MODAL ──────────────────────────────── */}
      {selectedCert ? (
        <AuctionCertificateCard certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      ) : null}
    </div>
  );
}
