'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Crown,
  Download,
  FileCheck2,
  Gavel,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { auctionService, auctionError } from '../services/auction.service';
import type { AuctionCertificateDto, DeliverableDownloadDto, MyCollectionItemDto } from '../types/auction.types';
import { AuctionCertificateCard } from './auction-certificate-card';
import { CommercialRightsModal } from './commercial-rights-modal';
import { DeliverablesDownloadModal } from './deliverables-download-modal';

function formatVnd(value?: number | null) {
  if (value === null || value === undefined) return 'Độc bản';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function MyCollectionScreen() {
  const [items, setItems] = useState<MyCollectionItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedCert, setSelectedCert] = useState<AuctionCertificateDto | null>(null);
  const [loadingCertId, setLoadingCertId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadDeliverable, setDownloadDeliverable] = useState<DeliverableDownloadDto | null>(null);
  const [selectedDeedAuctionId, setSelectedDeedAuctionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await auctionService.getMyCollection();
        if (active) setItems(data);
      } catch (err) {
        if (active) setError(auctionError(err) || 'Không tải được bộ sưu tập độc bản.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCollection();
    return () => {
      active = false;
    };
  }, []);

  const handleViewCert = async (auctionId: string | null) => {
    if (!auctionId) return;
    try {
      setLoadingCertId(auctionId);
      const cert = await auctionService.getCertificate(auctionId);
      setSelectedCert(cert);
    } catch (err) {
      alert(auctionError(err) || 'Không tải được chứng nhận sở hữu.');
    } finally {
      setLoadingCertId(null);
    }
  };

  const handleDownloadMaster = async (auctionId: string | null) => {
    if (!auctionId) return;
    try {
      setDownloadingId(auctionId);
      const res = await auctionService.download(auctionId);
      if (res) {
        setDownloadDeliverable(res);
      }
    } catch (err) {
      alert(auctionError(err) || 'Chưa thể tải file gốc hoặc chưa xác nhận giải ngân.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-outline">
        <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-brand-periwinkle" />
        Đang mở kho lưu trữ tác phẩm 1-of-1...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-xs text-red-300">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-brand-periwinkle/10 to-transparent p-6 text-on-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              <Crown size={14} className="text-amber-400" /> KHO TRANH ĐẤU GIÁ
            </div>
            <h1 className="mt-2 font-h1 text-xl sm:text-2xl font-bold text-white">
              Bộ sưu tập tranh đấu giá ({items.length})
            </h1>
            <p className="mt-1 text-xs text-outline max-w-xl">
              Nơi lưu trữ các tác phẩm bạn đã đấu giá thành công và sở hữu độc quyền 1-of-1 trên sàn Dillustration, bao gồm chứng chỉ số, quyền thương mại và quyền niêm yết bán lại.
            </p>
          </div>

          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 rounded-full bg-brand-periwinkle px-5 py-2.5 font-h1 text-xs font-bold text-brand-navy shadow-md hover:brightness-110 shrink-0 self-start sm:self-center"
          >
            <Gavel size={15} /> Săn thêm tranh mới
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 py-16 text-center">
          <Sparkles size={36} className="mx-auto mb-3 text-amber-300/60" />
          <h3 className="font-h1 text-base font-bold text-white">Bạn chưa sở hữu tác phẩm độc bản nào</h3>
          <p className="mt-1 text-xs text-outline max-w-md mx-auto">
            Hãy tham gia các phiên đấu giá trên Dillustration để trở thành chủ sở hữu độc quyền 1-of-1 và nhận quyền khai thác thương mại đầy đủ.
          </p>
          <Link
            href="/auctions"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-periwinkle/30 bg-brand-periwinkle/10 px-6 py-2.5 text-xs font-semibold text-brand-periwinkle hover:bg-brand-periwinkle/20"
          >
            Khám phá sàn đấu giá
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.artworkId}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col justify-between"
            >
              <div>
                {/* Ảnh tranh */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
                  <Image
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  {/* Badge Exclusive 1-of-1 Owner */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-black/75 px-3 py-1 text-[11px] font-bold text-amber-300 shadow backdrop-blur-md">
                    <Crown size={13} className="text-amber-400" />
                    Exclusive 1-of-1 Owner
                  </div>

                  {item.hasMasterFile && (
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      <Download size={11} /> Có Master Pack (.zip)
                    </div>
                  )}
                </div>

                {/* Thông tin chi tiết */}
                <div className="p-5 space-y-3">
                  <div>
                    <Link
                      href={`/artworks/${item.artworkId}`}
                      className="font-h1 text-base font-bold text-white hover:text-brand-periwinkle transition line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-outline">
                      Tác giả: <strong className="text-white">{item.creatorName}</strong>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/25 p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-outline block">Giá chốt phiên</span>
                      <strong className="font-mono text-amber-300 font-bold">
                        {formatVnd(item.finalPrice)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">Ngày sở hữu</span>
                      <strong className="text-white text-[11px]">
                        {new Date(item.acquiredAt).toLocaleDateString('vi-VN')}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Các nút hành động đặc quyền */}
              <div className="p-5 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!item.auctionId || loadingCertId === item.auctionId}
                    onClick={() => handleViewCert(item.auctionId)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/20 disabled:opacity-40 transition"
                  >
                    <ShieldCheck size={14} />
                    {loadingCertId === item.auctionId ? 'Đang mở...' : 'Chứng chỉ VIP'}
                  </button>

                  <button
                    type="button"
                    disabled={!item.auctionId}
                    onClick={() => setSelectedDeedAuctionId(item.auctionId)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-400/10 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-400/20 disabled:opacity-40 transition"
                  >
                    <FileCheck2 size={14} />
                    Hợp đồng
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!item.auctionId || downloadingId === item.auctionId}
                    onClick={() => handleDownloadMaster(item.auctionId)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 transition"
                  >
                    <Download size={14} />
                    {downloadingId === item.auctionId ? 'Đang lấy link...' : 'Tải file gốc'}
                  </button>

                  <Link
                    href={`/auctions/create?artworkId=${item.artworkId}&resell=true`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-periwinkle/30 bg-brand-periwinkle/15 py-2 text-xs font-bold text-brand-periwinkle hover:bg-brand-periwinkle hover:text-brand-navy transition"
                  >
                    <RefreshCw size={13} /> Bán lại
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Chứng chỉ số */}
      {selectedCert && (
        <AuctionCertificateCard
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onOpenCommercialRights={() => {
            const auctionId = selectedCert.auctionId;
            setSelectedCert(null);
            setSelectedDeedAuctionId(auctionId);
          }}
        />
      )}

      {/* Modal Hợp đồng quyền thương mại */}
      {selectedDeedAuctionId && (
        <CommercialRightsModal
          auctionId={selectedDeedAuctionId}
          onClose={() => setSelectedDeedAuctionId(null)}
        />
      )}

      {/* Modal Tải bàn giao: Cả Tranh gốc HD + Master Pack .zip */}
      {downloadDeliverable && (
        <DeliverablesDownloadModal
          deliverable={downloadDeliverable}
          onClose={() => setDownloadDeliverable(null)}
        />
      )}
    </div>
  );
}
