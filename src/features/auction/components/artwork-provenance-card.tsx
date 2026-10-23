'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Crown,
  ExternalLink,
  History,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { auctionService } from '../services/auction.service';
import type { ArtworkProvenanceDto } from '../types/auction.types';
import { AuctionCertificateCard } from './auction-certificate-card';
import type { AuctionCertificateDto } from '../types/auction.types';

function formatVnd(value?: number | null) {
  if (!value) return null;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ArtworkProvenanceCard({ artworkId }: { artworkId: string }) {
  const userId = useAuthStore((s) => s.user?.id);
  const [provenance, setProvenance] = useState<ArtworkProvenanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<AuctionCertificateDto | null>(null);

  useEffect(() => {
    let active = true;
    const fetchProvenance = async () => {
      try {
        setLoading(true);
        const data = await auctionService.getProvenance(artworkId);
        if (active) setProvenance(data);
      } catch {
        // Tranh có thể chưa có lịch sử đấu giá
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProvenance();
    return () => {
      active = false;
    };
  }, [artworkId]);

  const viewCertificate = async (auctionId: string | null, ownerId?: string) => {
    if (!auctionId) return;
    const isParty = userId && (userId === ownerId || userId === provenance?.creatorId || userId === provenance?.currentOwnerId);
    if (!isParty) return;
    try {
      const cert = await auctionService.getCertificate(auctionId);
      setSelectedCert(cert);
    } catch {
      alert('Không tải được chứng nhận của phiên đấu giá này.');
    }
  };

  if (loading || !provenance) {
    return null;
  }

  return (
    <section className="glass-container rounded-3xl border border-white/10 p-5 space-y-4">
      {/* Header Provenance */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-h1 text-sm font-bold text-white">
          <History size={16} className="text-amber-400" />
          Lịch sử sở hữu &amp; Lai lịch tác phẩm (Provenance)
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
          <Crown size={12} /> 1-of-1 Verified
        </span>
      </div>

      {/* Dòng tóm tắt định danh hiện tại: Tác giả ➔ Chủ sở hữu */}
      <div className="rounded-2xl border border-amber-400/30 bg-black/40 p-4">
        <span className="text-[10px] text-outline uppercase tracking-wider block mb-1.5 font-mono">
          Chuỗi chuyển nhượng quyền sở hữu
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          <span className="font-semibold text-white flex items-center gap-1">
            <User size={14} className="text-brand-periwinkle" />
            Tác giả: <strong className="text-brand-periwinkle">{provenance.creatorName}</strong>
          </span>

          <ArrowRight size={15} className="text-amber-400 shrink-0" />

          <span className="font-semibold text-white flex items-center gap-1">
            <Crown size={14} className="text-amber-400" />
            Chủ sở hữu hiện tại:{' '}
            <strong className="text-emerald-300">
              {provenance.currentOwnerName || 'Đang bảo lưu'}
            </strong>
          </span>

          {provenance.isCurrentOwnerCollector && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <ShieldCheck size={11} /> Exclusive 1-of-1 Owner
            </span>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-outline">
          <ShieldCheck size={13} className="text-amber-400 shrink-0" />
          <span>
            <strong className="text-white">Quyền tác giả gốc bất biến:</strong> Danh tính Họa sĩ sáng tác vĩnh viễn không thay đổi dù tác phẩm được chuyển nhượng hay bán lại qua nhiều thế hệ chủ sở hữu.
          </span>
        </div>
      </div>

      {/* Chi tiết các mốc chuyển nhượng */}
      {provenance.history.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] text-outline font-medium block">
            Dấu vết các lần đổi chủ ({provenance.history.length}):
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {provenance.history.map((h, index) => (
              <div
                key={`${h.ownerId}-${index}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs"
              >
                <div>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    {h.ownerName}
                    {h.isCurrent && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                        Đang sở hữu
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-outline">
                    {new Date(h.acquiredAt).toLocaleDateString('vi-VN')} • Lý do: {h.transferReason === 'AuctionWin' ? 'Thắng đấu giá' : h.transferReason}
                  </p>
                </div>

                <div className="text-right">
                  {h.price && (
                    <span className="font-mono font-bold text-amber-400 block text-xs">
                      {formatVnd(h.price)}
                    </span>
                  )}
                  {h.auctionId && userId && (userId === h.ownerId || userId === provenance?.creatorId || userId === provenance?.currentOwnerId) && (
                    <button
                      type="button"
                      onClick={() => viewCertificate(h.auctionId, h.ownerId)}
                      className="inline-flex items-center gap-1 text-[10px] text-brand-periwinkle hover:underline mt-0.5 cursor-pointer"
                    >
                      Chứng chỉ <ExternalLink size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Chứng nhận nếu người dùng bấm xem */}
      {selectedCert && (
        <AuctionCertificateCard
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </section>
  );
}
