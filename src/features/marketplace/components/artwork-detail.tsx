'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Maximize2, MessageCircle, Send, Share2, ShieldCheck, X } from 'lucide-react';
import { marketplaceService, MarketplaceArtwork } from '../services/marketplace.service';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';
import { ImageLightbox } from '@/components/image-lightbox';
import { ArtworkActions } from './artwork-actions';
import { useArtworkComments } from './use-artwork-comments';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=85';

function SafeArtworkImage({
  src,
  alt,
  className = 'object-cover',
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const isBlob = typeof src === 'string' && src.startsWith('blob:');
  const [imageSrc, setImageSrc] = useState(isBlob || !src ? DEFAULT_FALLBACK_IMAGE : src);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const isInvalid = typeof src === 'string' && src.startsWith('blob:');
      setImageSrc(isInvalid || !src ? DEFAULT_FALLBACK_IMAGE : src);
    });
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized
      onError={() => setImageSrc(DEFAULT_FALLBACK_IMAGE)}
      className={`w-full h-full ${className}`}
      style={{ objectFit: 'cover' }}
    />
  );
}

export function ArtworkDetail({ id }: { id: string }) {
  const [artwork, setArtwork] = useState<MarketplaceArtwork | null>(null);
  const [loading, setLoading] = useState(true);
  const { comment, setComment, comments, submit, submitting } = useArtworkComments(id);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorAcceptingOrders, setCreatorAcceptingOrders] = useState<boolean | null>(null);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const detail = await marketplaceService.getArtworkDetail(id);
        setArtwork(detail.artwork);
        marketplaceService.getCreatorById(detail.artwork.creatorProfileId).then((profile) => {
          setCreatorName(profile.displayName);
          setCreatorAcceptingOrders(profile.isAcceptingOrders);
        }).catch(() => undefined);
      } catch {
        setArtwork(null);
      }

      setLoading(false);
    };

    void load();
  }, [id]);

  if (loading) return <div className="p-16 text-center text-[#C7C5CF]">Đang tải tác phẩm...</div>;
  if (!artwork) return <div className="p-16 text-center text-[#C7C5CF]">Không tìm thấy tác phẩm.</div>;

  return (
    <main className="min-h-screen bg-[#1F2335] px-4 py-8 text-[#E4E1E5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/explore" className="mb-6 inline-block text-sm text-[#A7ACD9] hover:underline">
          ← Quay lại khám phá
        </Link>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_390px]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#131624]">
            <div className="relative aspect-[4/5] w-full max-h-[78vh]">
              <SafeArtworkImage src={artwork.imageUrl} alt={artwork.title} />
              <div className="watermark pointer-events-none absolute inset-0 flex rotate-[-24deg] items-center justify-center text-4xl font-black tracking-[.3em] text-white/15 sm:text-6xl">
                DILLUSTRATION
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#111424]/75 px-3 py-2 text-xs font-medium text-[#E4E1E5] backdrop-blur transition hover:bg-[#111424] hover:text-white"
                aria-label="Xem toàn màn hình"
              >
                <Maximize2 className="h-4 w-4 text-[#A7ACD9]" />
                <span>Xem ảnh gốc</span>
              </button>
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#111424]/75 px-3 py-2 text-xs text-[#E4E1E5] backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-[#A7ACD9]" />
                Ảnh có watermark bảo vệ
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#A7ACD9]">Artwork detail</p>
              <h1 className="mt-2 font-h1 text-3xl font-bold text-white">{artwork.title}</h1>
              <p className="mt-2 text-sm text-[#C7C5CF]">
                bởi{' '}
                <Link
                  href={`/creators/${artwork.creatorProfileId}`}
                  className="font-medium text-[#D6D9FF] hover:underline"
                >
                  {creatorName || artwork.creatorName || 'Nghệ sĩ Dillustration'}
                </Link>
              </p>
            </div>

            <div className="glass-container rounded-3xl p-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#919099]">Phong cách</dt>
                  <dd className="mt-1 text-white">{artwork.tags?.[0] || 'Digital art'}</dd>
                </div>
                <div>
                  <dt className="text-[#919099]">Đăng tải</dt>
                  <dd className="mt-1 text-white">{new Date(artwork.createdAt).toLocaleDateString('vi-VN')}</dd>
                </div>
                <div>
                  <dt className="text-[#919099]">Lượt xem</dt>
                  <dd className="mt-1 text-white">{artwork.viewCount.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[#919099]">Bản quyền</dt>
                  <dd className="mt-1 text-white">Cá nhân</dd>
                </div>
              </dl>
            </div>

            {artwork.description && (
              <p className="rounded-3xl border border-white/10 bg-white/[.035] p-5 text-sm leading-6 text-[#C7C5CF]">
                {artwork.description}
              </p>
            )}

            <button
              type="button"
              disabled={creatorAcceptingOrders === false}
              onClick={() => setIsCommissionOpen(true)}
              className="w-full rounded-2xl bg-[#A7ACD9] px-4 py-3 text-sm font-bold text-[#1F2335] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatorAcceptingOrders === false ? 'Creator đang tạm ngưng nhận đơn' : 'Commission this artist'}
            </button>

            <div className="flex gap-3">
              <ArtworkActions artworkId={artwork.id} />
              <button
                onClick={() => navigator.share?.({ title: artwork.title, url: location.href })}
                className="rounded-2xl border border-white/15 px-4 py-3 text-[#C7C5CF]"
                aria-label="Chia sẻ"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </aside>
        </div>

        <section className="mt-10 max-w-3xl">
          <div className="mb-5 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#A7ACD9]" />
            <h2 className="font-h1 text-xl font-bold text-white">Bình luận ({comments.length})</h2>
          </div>
          <form onSubmit={submit} className="mb-5 flex gap-3">
            <input
              disabled={submitting}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Viết bình luận của bạn..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#A7ACD9]"
            />
            <button disabled={submitting} className="rounded-2xl bg-[#A7ACD9] px-4 text-[#1F2335]" aria-label="Gửi bình luận">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="space-y-3">
            {comments.map((item, index) => (
              <article key={`${item.time}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-white">{item.name}</strong>
                  <span className="text-xs text-[#919099]">{item.time}</span>
                </div>
                <p className="mt-2 text-sm text-[#C7C5CF]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {isCommissionOpen && (
        <CreateCommissionModal
          creatorId={artwork.creatorProfileId}
          creatorName={creatorName || artwork.creatorName || 'Creator'}
          onClose={() => setIsCommissionOpen(false)}
        />
      )}

      {isLightboxOpen && (
        <ImageLightbox
          images={[{ src: artwork.imageUrl || DEFAULT_FALLBACK_IMAGE, alt: artwork.title }]}
          index={0}
          onClose={() => setIsLightboxOpen(false)}
          onNavigate={() => {}}
        />
      )}
    </main>
  );
}

export function ArtworkDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [artwork, setArtwork] = useState<MarketplaceArtwork | null>(null);
  const [loading, setLoading] = useState(true);
  const { comment, setComment, comments, submit, submitting } = useArtworkComments(id);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorAcceptingOrders, setCreatorAcceptingOrders] = useState<boolean | null>(null);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const load = async () => {
      try {
        const detail = await marketplaceService.getArtworkDetail(id);
        setArtwork(detail.artwork);
        marketplaceService
          .getCreatorById(detail.artwork.creatorProfileId)
          .then((profile) => {
            setCreatorName(profile.displayName);
            setCreatorAcceptingOrders(profile.isAcceptingOrders);
          })
          .catch(() => undefined);
      } catch {
        setArtwork(null);
      }

      setLoading(false);
    };

    void load();
  }, [id]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b0d16]/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/15 bg-[#171a2a] p-5 shadow-2xl md:p-8 text-[#E4E1E5]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-2 text-[#C7C5CF] hover:bg-white/20 hover:text-white transition"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="p-16 text-center text-[#C7C5CF]">Đang tải tác phẩm...</div>
        ) : !artwork ? (
          <div className="p-16 text-center text-[#C7C5CF]">Không tìm thấy tác phẩm.</div>
        ) : (
          <div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
              <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#131624]">
                <div className="relative aspect-[4/5] w-full max-h-[70vh]">
                  <SafeArtworkImage src={artwork.imageUrl} alt={artwork.title} />
                  <div className="watermark absolute inset-0 flex rotate-[-24deg] items-center justify-center text-4xl font-black tracking-[.3em] text-white/15 pointer-events-none sm:text-6xl">
                    DILLUSTRATION
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#111424]/75 px-3 py-2 text-xs font-medium text-[#E4E1E5] backdrop-blur transition hover:bg-[#111424] hover:text-white"
                    aria-label="Xem toàn màn hình"
                  >
                    <Maximize2 className="h-4 w-4 text-[#A7ACD9]" />
                    <span>Xem ảnh gốc</span>
                  </button>
                  <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#111424]/85 px-3 py-2 text-xs text-[#E4E1E5] backdrop-blur">
                    <ShieldCheck className="h-4 w-4 text-[#A7ACD9]" />
                    Ảnh có watermark bảo vệ
                  </div>
                </div>
              </section>

              <aside className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#A7ACD9]">Artwork Detail</p>
                  <h1 className="mt-2 font-h1 text-2xl font-bold text-white sm:text-3xl">{artwork.title}</h1>
                  <p className="mt-2 text-sm text-[#C7C5CF]">
                    bởi{' '}
                    <Link
                      href={`/creators/${artwork.creatorProfileId}`}
                      onClick={onClose}
                      className="font-medium text-[#D6D9FF] hover:underline"
                    >
                      {creatorName || artwork.creatorName || 'Nghệ sĩ Dillustration'}
                    </Link>
                  </p>
                </div>

                <div className="glass-container rounded-3xl p-5">
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-[#919099]">Phong cách</dt>
                      <dd className="mt-1 text-white">{artwork.tags?.[0] || 'Digital art'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#919099]">Đăng tải</dt>
                      <dd className="mt-1 text-white">{new Date(artwork.createdAt).toLocaleDateString('vi-VN')}</dd>
                    </div>
                    <div>
                      <dt className="text-[#919099]">Lượt xem</dt>
                      <dd className="mt-1 text-white">{artwork.viewCount.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-[#919099]">Bản quyền</dt>
                      <dd className="mt-1 text-white">Cá nhân</dd>
                    </div>
                  </dl>
                </div>

                {artwork.description && (
                  <p className="rounded-3xl border border-white/10 bg-white/[.035] p-5 text-sm leading-6 text-[#C7C5CF]">
                    {artwork.description}
                  </p>
                )}

                <button
                  type="button"
                  disabled={creatorAcceptingOrders === false}
                  onClick={() => setIsCommissionOpen(true)}
                  className="w-full rounded-2xl bg-[#A7ACD9] px-4 py-3 text-sm font-bold text-[#1F2335] transition hover:bg-[#b5baf3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatorAcceptingOrders === false
                    ? 'Creator đang tạm ngưng nhận đơn'
                    : 'Commission this artist'}
                </button>

                <div className="flex gap-3">
                  <ArtworkActions artworkId={artwork.id} />
                  <button
                    onClick={() => navigator.share?.({ title: artwork.title, url: location.href })}
                    className="rounded-2xl border border-white/15 px-4 py-3 text-[#C7C5CF] hover:border-white/30"
                    aria-label="Chia sẻ"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </aside>
            </div>

            {/* Comments Section */}
            <section className="mt-8 border-t border-white/10 pt-6">
              <div className="mb-5 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#A7ACD9]" />
                <h2 className="font-h1 text-xl font-bold text-white">Bình luận ({comments.length})</h2>
              </div>
              <form onSubmit={submit} className="mb-5 flex gap-3">
                <input
                  disabled={submitting}
                  maxLength={1000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Viết bình luận của bạn..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#A7ACD9]"
                />
                <button disabled={submitting} className="rounded-2xl bg-[#A7ACD9] px-4 text-[#1F2335] font-bold" aria-label="Gửi bình luận">
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {comments.map((item, index) => (
                  <article key={`${item.time}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-white">{item.name}</strong>
                      <span className="text-xs text-[#919099]">{item.time}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#C7C5CF]">{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {isCommissionOpen && artwork && (
        <CreateCommissionModal
          creatorId={artwork.creatorProfileId}
          creatorName={creatorName || artwork.creatorName || 'Creator'}
          onClose={() => setIsCommissionOpen(false)}
        />
      )}

      {isLightboxOpen && artwork && (
        <ImageLightbox
          images={[{ src: artwork.imageUrl || DEFAULT_FALLBACK_IMAGE, alt: artwork.title }]}
          index={0}
          onClose={() => setIsLightboxOpen(false)}
          onNavigate={() => {}}
        />
      )}
    </div>
  );
}
