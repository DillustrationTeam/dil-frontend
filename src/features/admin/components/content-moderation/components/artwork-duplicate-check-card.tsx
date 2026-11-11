'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { adminModerationService } from '@/features/admin/services/moderation.service';
import { ArtworkDuplicateCheckResultDto } from '@/features/admin/types/moderation.types';

const MATCH_TYPE_LABELS: Record<string, string> = {
  ExactFile: 'Trùng file gốc',
  ReuploadedWatermark: 'Dính thuỷ vân cũ trên sàn',
  VisualSimilar: 'Hình ảnh tương đồng',
};

const STATUS_LABELS: Record<string, string> = {
  Approved: 'Đã duyệt',
  Pending: 'Chờ duyệt',
  Flagged: 'Bị gắn cờ',
  Rejected: 'Đã từ chối',
  Hidden: 'Đang ẩn',
};

export function ArtworkDuplicateCheckCard({ artworkId }: { artworkId: string }) {
  const [data, setData] = useState<ArtworkDuplicateCheckResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminModerationService.checkArtworkDuplicates(artworkId);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không kiểm tra được trùng lặp.');
    } finally {
      setLoading(false);
    }
  }, [artworkId]);

  useEffect(() => {
    let active = true;
    adminModerationService
      .checkArtworkDuplicates(artworkId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Không kiểm tra được trùng lặp.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [artworkId]);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d101b]/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-h1 text-sm font-semibold text-white">
            Kiểm tra trùng lặp tác phẩm
          </h3>
          {data && !loading && (
            <span className="text-[11px] text-[#8A8FA9]">
              ({data.comparedArtworksCount} tranh đã đối chiếu)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] text-[#C7C5CF] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Quét lại</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-[#8A8FA9] py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A7ACD9]" />
          <span>Đang đối chiếu file gốc, thuỷ vân và hình ảnh...</span>
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-rose-300">{error}</p>
      )}

      {!loading && !error && data && !data.hasDuplicates && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Không phát hiện tranh trùng lặp trên hệ thống.</span>
        </div>
      )}

      {!loading && !error && data && data.hasDuplicates && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
            <span>
              Tìm thấy {data.matches.length} tác phẩm có dấu hiệu trùng khớp. Kiểm tra kỹ trước khi duyệt.
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.matches.map((m) => (
              <div
                key={m.artworkId}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#131624] p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.thumbnailUrl || m.imageUrl}
                  alt={m.title}
                  className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover bg-[#0b0e18]"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/artworks/${m.artworkId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 truncate text-xs font-semibold text-white hover:text-[#DDE0FF] hover:underline"
                    >
                      <span className="truncate max-w-[160px]">{m.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-[#A7ACD9]" />
                    </Link>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        m.sameCreator
                          ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
                          : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {m.sameCreator ? 'Cùng tác giả' : 'Khác tác giả'}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/[.05] px-2 py-0.5 text-[10px] font-medium text-[#DDE0FF]">
                      Giống {m.similarityPercent}% · {MATCH_TYPE_LABELS[m.matchType] || m.matchType}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#8A8FA9]">
                    <span>Tác giả: <strong className="font-medium text-[#C7C5CF]">{m.creatorName}</strong></span>
                    <span>Trạng thái: {STATUS_LABELS[m.moderationStatus] || m.moderationStatus}</span>
                    <span>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
