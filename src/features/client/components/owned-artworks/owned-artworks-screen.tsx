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
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/language-context';
import { clientOwnedArtworksService } from '../../services/client-owned-artworks.service';
import { auctionService } from '@/features/auction/services/auction.service';
import type { AuctionCertificateDto } from '@/features/auction/types/auction.types';
import { AuctionCertificateCard } from '@/features/auction/components/auction-certificate-card';
import { OwnedArtworkCertificate } from './owned-artwork-certificate';
import type {
  OwnedArtworkDto,
  OwnedArtworkFilterType,
  OwnedArtworkSortType,
  OwnedArtworkSourceType,
} from '../../types/owned-artwork.types';
/**
 * KHÔNG gọi `GET /auctions/{id}/certificate` từ đây nữa.
 * Bản ghi owned-artwork trả `sourceId` TRÙNG `id` của tác phẩm, nên endpoint
 * auction luôn 404 (đã đo: /auctions/dafd4258-…/certificate → 404). Chứng nhận
 * hiển thị từ chính dữ liệu bản ghi (`certificateNumber`), không cần mạng.
 */


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

/** Chữ cái đầu của tên họa sĩ, dùng khi hồ sơ chưa có ảnh đại diện. */
function initialsOf(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * `exclusiveBadge` là chuỗi tiếng Anh do server trả (`Exclusive Owner`).
 * Việt hoá ở tầng hiển thị, không sửa dữ liệu — cùng cách với `style-labels.ts`.
 */
const EXCLUSIVE_LABELS: Record<string, { vi: string; en: string }> = {
  'Exclusive Owner': { vi: 'Chủ sở hữu độc bản', en: 'Exclusive owner' },
  '1/1': { vi: 'Độc bản 1/1', en: 'One of one' },
};

function exclusiveLabel(raw: string, lang: string) {
  const entry = EXCLUSIVE_LABELS[raw.trim()];
  if (!entry) return raw;
  return lang === 'VIE' ? entry.vi : entry.en;
}

/** `sourceType` từ server là tiếng Anh (`Auction` / `Commission` / `Trade`). */
function sourceLabel(type: OwnedArtworkSourceType, lang: string) {
  if (lang !== 'VIE') return type;
  switch (type) {
    case 'Auction':
      return 'Đấu giá';
    case 'Commission':
      return 'Đơn đặt vẽ';
    case 'Trade':
      return 'Trao đổi';
    default:
      return type;
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
  const [certArtwork, setCertArtwork] = useState<OwnedArtworkDto | null>(null);
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

  /**
   * Mở chứng nhận.
   *
   * 1. Tác phẩm mua qua phiên đấu giá → gọi `/auctions/{auctionId}/certificate` để lấy
   *    tờ chứng nhận đầy đủ (QR tra cứu, chữ ký SHA-256, phạm vi giấy phép). Đây là
   *    bản đầy đủ duy nhất hệ thống thực sự phát hành.
   * 2. Không có phiên đấu giá (chuyển nhượng nội bộ / đơn đặt vẽ) → hiện tờ chứng nhận
   *    mỏng dựng từ chính bản ghi, thay vì báo lỗi 404.
   */
  const handleOpenCertificate = async (item: OwnedArtworkDto) => {
    if (!item.certificateNumber) {
      toast.error('Tác phẩm này chưa có số chứng nhận.');
      return;
    }
    const auctionId = item.sourceType === 'Auction' ? item.sourceId : null;
    const hasAuction = Boolean(auctionId) && auctionId !== item.id;
    if (!hasAuction) {
      setCertArtwork(item);
      return;
    }
    try {
      setLoadingCertId(item.id);
      const cert = await auctionService.getCertificate(auctionId as string);
      setSelectedCert(cert);
    } catch {
      // Không lấy được bản đầy đủ (không phải chủ sở hữu / chưa phát hành) → bản mỏng.
      setCertArtwork(item);
    } finally {
      setLoadingCertId(null);
    }
  };

  const getSourceBadge = (sourceType: OwnedArtworkSourceType) => {
    switch (sourceType) {
      case 'Auction':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6A1F]/45 bg-[#FFFCF6] px-2.5 py-1 text-[11px] font-semibold text-[#8A6A1F] shadow-sm">
            <Crown size={12} aria-hidden />
            {lang === 'VIE' ? 'Đấu giá' : 'Auction Exclusive'}
          </span>
        );
      case 'Commission':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2C6A86]/45 bg-[#FFFCF6] px-2.5 py-1 text-[11px] font-semibold text-[#2C6A86] shadow-sm">
            <FolderKanban size={12} aria-hidden />
            {lang === 'VIE' ? 'Đơn vẽ hoàn tất' : 'Commission Deliverable'}
          </span>
        );
      case 'Trade':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5F3F86]/45 bg-[#FFFCF6] px-2.5 py-1 text-[11px] font-semibold text-[#5F3F86] shadow-sm">
            <ArrowLeftRight size={12} aria-hidden />
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
          {filteredArtworks.map((artwork) => {
            const price = formatVnd(artwork.price);
            return (
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
                  <span className="absolute left-3 top-3 z-10">{getSourceBadge(artwork.sourceType)}</span>
                  <span className="art-card__zoom" aria-hidden="true">
                    <Maximize2 size={16} />
                  </span>
                </button>

                <div className="art-card__meta">
                  <span className="art-card__title">{artwork.title}</span>

                  {/* Họa sĩ */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full border border-[#221E1A]/10 bg-[#F0E7D8] text-[10px] font-semibold text-[#8C3718]">
                      {artwork.creatorAvatarUrl ? (
                        <Image
                          src={artwork.creatorAvatarUrl}
                          alt=""
                          width={24}
                          height={24}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initialsOf(artwork.creatorName)
                      )}
                    </span>
                    <span className="truncate text-[0.8125rem] text-[#6E6459]">
                      {artwork.creatorName || '—'}
                    </span>
                  </div>

                  {/* Hai dữ kiện của quyền sở hữu */}
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#221E1A]/10 bg-[#F0E7D8]/60 px-3 py-2">
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide text-[#746A5F]">
                        {lang === 'VIE' ? 'Giá sở hữu' : 'Price paid'}
                      </span>
                      <b className="block truncate text-[0.8125rem] font-bold tabular-nums text-[#241F1A]">
                        {price ?? '—'}
                      </b>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide text-[#746A5F]">
                        {lang === 'VIE' ? 'Ngày sở hữu' : 'Acquired'}
                      </span>
                      <b className="block truncate text-[0.8125rem] font-bold tabular-nums text-[#241F1A]">
                        {formatDate(artwork.acquiredAt)}
                      </b>
                    </div>
                  </div>

                  {/* Quyền độc bản: để dưới hộp dữ kiện, không phủ lên nhãn nguồn */}
                  {artwork.exclusiveBadge ? (
                    <span className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[#8A6A1F]/40 bg-[#8A6A1F]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8A6A1F]">
                      <Crown size={10} aria-hidden /> {exclusiveLabel(artwork.exclusiveBadge, lang)}
                    </span>
                  ) : null}

                  {/* Hành động: tải bản gốc · chứng nhận · nguồn */}
                  <div className="mt-2 flex items-center gap-2">
                    {artwork.downloadUrl ? (
                      <a
                        href={artwork.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#2F6B63]/45 bg-[#2F6B63]/10 px-3 py-2 text-[0.75rem] font-semibold text-[#2F6B63] transition hover:bg-[#2F6B63]/20"
                      >
                        <Download size={13} aria-hidden />
                        <span className="whitespace-nowrap">{lang === 'VIE' ? 'Tải gốc' : 'Download'}</span>
                      </a>
                    ) : (
                      <span className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#221E1A]/10 px-3 py-2 text-[0.75rem] text-[#746A5F]">
                        <span className="whitespace-nowrap">{lang === 'VIE' ? 'Chưa có tệp' : 'No file yet'}</span>
                      </span>
                    )}

                    {artwork.certificateNumber ? (
                      <button
                        type="button"
                        onClick={() => void handleOpenCertificate(artwork)}
                        disabled={loadingCertId === artwork.id}
                        title={`Chứng nhận ${artwork.certificateNumber}`}
                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#8A6A1F]/45 bg-[#8A6A1F]/10 px-3 py-2 text-[0.75rem] font-semibold text-[#8A6A1F] transition hover:bg-[#8A6A1F]/20"
                      >
                        {loadingCertId === artwork.id ? (
                          <RefreshCw size={13} className="animate-spin" aria-hidden />
                        ) : (
                          <FileCheck2 size={13} aria-hidden />
                        )}
                        <span className="whitespace-nowrap">{lang === 'VIE' ? 'Chứng nhận' : 'Certificate'}</span>
                      </button>
                    ) : null}

                    {artwork.sourceDetailUrl ? (
                      <a
                        href={artwork.sourceDetailUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Xem chi tiết nguồn của ${artwork.title}`}
                        title={lang === 'VIE' ? 'Xem chi tiết nguồn' : 'View source'}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#221E1A]/15 bg-[#FFFCF6] text-[#6E6459] transition hover:border-[#B24A26]/40 hover:text-[#241F1A]"
                      >
                        <ExternalLink size={14} aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

            {selectedCert ? (
        <AuctionCertificateCard certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      ) : null}

      {certArtwork ? (
        <OwnedArtworkCertificate
          artwork={certArtwork}
          sourceLabel={sourceLabel(certArtwork.sourceType, lang)}
          lang={lang}
          onClose={() => setCertArtwork(null)}
        />
      ) : null}

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
          <div className="relative grid max-h-[92dvh] w-full max-w-[1100px] overflow-hidden rounded-[24px] bg-[#FFFCF6] shadow-[0_44px_90px_-44px_rgba(58,42,26,0.7)] lg:grid-cols-[minmax(0,auto)_20rem]">
            <div className="grid place-items-center bg-[#F0E7D8] p-2">
              {/* Ảnh tự quyết chiều rộng khung: không còn mảng nền trống khi tranh dọc */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxArtwork.imageUrl || lightboxArtwork.thumbnailUrl || FALLBACK_IMAGE}
                alt={lightboxArtwork.title}
                className="max-h-[86dvh] w-auto max-w-full object-contain"
                draggable={false}
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
                  <b>{sourceLabel(lightboxArtwork.sourceType, lang)}</b>
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
                {lightboxArtwork.certificateNumber ? (
                  <button
                    type="button"
                    onClick={() => {
                      const item = lightboxArtwork;
                      setLightboxArtwork(null);
                      void handleOpenCertificate(item);
                    }}
                    className="btn btn--outline btn--block btn--sm"
                  >
                    <FileCheck2 size={14} aria-hidden /> {lang === 'VIE' ? 'Xem chứng nhận' : 'View certificate'}
                  </button>
                ) : null}
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
    </div>
  );
}
