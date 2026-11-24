'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, ShieldCheck, Star, Users } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useLanguage } from '@/context/language-context';
import { clientProfileService } from '../services/client-profile.service';
import { CollectionDto } from '../services/marketplace.service';
import { ArtworkDto } from '@/features/creator-studio/types/creator-profile.types';
import {
  ClientProfileDto,
  ClientReviewDto,
  ClientStatisticsDto,
  FollowedCreatorDto,
} from '../types/client-profile.types';
import { ImageLightbox, LightboxImage } from '@/components/image-lightbox';

type ProfileTab = 'reputation' | 'collection' | 'favorites';

export function ClientProfile({ id }: { id: string }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { lang } = useLanguage();
  const dateLocale = lang === 'ENG' ? 'en-US' : 'vi-VN';
  const isOwnProfile = !!currentUserId && currentUserId === id;
  const [profile, setProfile] = useState<ClientProfileDto | null>(null);
  const [statistics, setStatistics] = useState<ClientStatisticsDto | null>(null);
  const [reviews, setReviews] = useState<ClientReviewDto[]>([]);
  const [following, setFollowing] = useState<FollowedCreatorDto[]>([]);
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [favorites, setFavorites] = useState<ArtworkDto[]>([]);
  const [tab, setTab] = useState<ProfileTab>('reputation');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await clientProfileService.getClientById(id);
        setProfile(data);
      } catch {
        setNotFound(true);
        return;
      }

      try {
        setStatistics(await clientProfileService.getClientStatistics(id));
      } catch {
        setStatistics(null);
      }

      try {
        setReviews(await clientProfileService.getClientReviews(id));
      } catch {
        setReviews([]);
      }

      try {
        setFollowing(await clientProfileService.getClientFollowing(id));
      } catch {
        setFollowing([]);
      }

      try {
        setCollections(await clientProfileService.getClientCollections(id));
      } catch {
        setCollections([]);
      }

      try {
        setFavorites(await clientProfileService.getClientFavorites(id));
      } catch {
        setFavorites([]);
      }
    };

    void load();
  }, [id]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F2E9] p-16 text-center text-[#6E6459]"> Không tìm thấy hồ sơ người dùng này. </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F2E9] p-16 text-center text-[#6E6459]"> Đang tải hồ sơ... </div>
    );
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  const favoriteGallery: LightboxImage[] = favorites.map((artwork) => ({
    src: artwork.thumbnailUrl || artwork.imageUrl,
    alt: artwork.title,
  }));

  return (
    <div className="min-h-screen bg-[#F7F2E9] pb-16 text-[#241F1A]">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          {/* Sidebar trái: avatar, tên, following, thông tin cơ bản */}
          <aside className="space-y-6 md:sticky md:top-6 md:self-start">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="relative h-24 w-24 overflow-hidden rounded-3xl border-2 border-[#221E1A]/10 bg-[#B24A26]">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.fullName} fill unoptimized className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-h1 text-3xl font-bold text-[#F7F2E9]">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-h1 text-xl font-bold text-[#241F1A]">{profile.fullName}</h1>
              {profile.username && <p className="text-sm text-[#B24A26]">@{profile.username}</p>}

              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#221E1A]/10 px-3 py-1.5 text-xs font-medium text-[#6E6459] transition hover:border-[#B24A26] hover:text-[#241F1A]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa hồ sơ </Link>
              )}

              {profile.isVerified && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#B24A26]/10 px-2.5 py-1 text-[11px] text-[#B24A26]">
                  <ShieldCheck className="h-3 w-3" /> Email đã xác thực </span>
              )}

              <div className="mt-3 flex items-center gap-1.5 text-sm text-[#6E6459]">
                <Users className="h-4 w-4" />
                <span>{following.length} Following</span>
              </div>
            </div>

            <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
              <p className="text-xs uppercase tracking-wider text-[#746A5F]">Thông tin cơ bản</p>
              <ul className="mt-3 space-y-2.5 text-sm text-[#6E6459]">
                {profile.bio && <li className="whitespace-pre-line break-words">{profile.bio}</li>}
                {profile.interestTags.length > 0 && (
                  <li className="flex flex-wrap gap-1.5">
                    {profile.interestTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#B24A26]/10 px-2.5 py-1 text-xs text-[#B24A26]">
                        {tag}
                      </span>
                    ))}
                  </li>
                )}
                <li>
                  Tham gia từ{' '}
                  {new Date(profile.joinedAt).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
                </li>
                {profile.country && (
                  <li>
                    {profile.country}
                    {profile.timezone ? ` · ${profile.timezone}` : ''}
                  </li>
                )}
                {profile.preferredLanguages.length > 0 && <li>Ngôn ngữ: {profile.preferredLanguages.join(', ')}</li>}
              </ul>
            </div>
          </aside>

          {/* Panel phải: banner, tab Độ uy tín/Bộ sưu tập/Yêu thích */}
          <div>
            <div className="relative h-40 overflow-hidden rounded-3xl bg-gradient-to-br from-[#E5D8C2] via-[#FFFCF6] to-[#FFFCF6] sm:h-52">
              {profile.coverUrl && (
                <Image src={profile.coverUrl} alt="Banner" fill unoptimized className="object-cover opacity-70" />
              )}
            </div>

            <div className="mb-6 mt-8 flex gap-2 border-b border-[#221E1A]/10">
              {([
                ['reputation', 'Độ uy tín'],
                ['collection', 'Bộ sưu tập'],
                ['favorites', 'Yêu thích'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`border-b-2 px-4 py-3 text-sm transition ${
                    tab === value ? 'border-[#B24A26] text-[#241F1A]' : 'border-transparent text-[#746A5F] hover:text-[#6E6459]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'reputation' && (
              <div className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-h1 text-xl font-bold text-[#241F1A]">{statistics?.completedCommissionCount ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#746A5F]">Đơn hoàn thành</p>
                  </div>
                  <div>
                    <p className="font-h1 text-xl font-bold text-[#241F1A]">{statistics?.disputeCount ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#746A5F]">Tranh chấp</p>
                  </div>
                  <div>
                    <p className="font-h1 text-xl font-bold text-[#241F1A]">
                      {averageRating !== null ? averageRating.toFixed(1) : '—'}
                      {averageRating !== null && (
                        <Star className="ml-1 inline h-3.5 w-3.5 fill-[#B24A26] text-[#B24A26]" />
                      )}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[#746A5F]">{reviews.length} đánh giá từ họa sĩ</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-[#221E1A]/10 pt-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-[#6E6459]">Chưa có đánh giá nào.</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl bg-[#FFFCF6] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[#B24A26]">
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </span>
                          <span className="text-xs text-[#746A5F]">
                            {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                          </span>
                        </div>
                        {review.comment && <p className="mt-2 text-sm text-[#6E6459]">{review.comment}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === 'collection' && (
              <div className="space-y-4">
                {collections.length === 0 && (
                  <p className="rounded-3xl bg-[#FFFCF6] p-10 text-center text-sm text-[#6E6459]"> Chưa có album công khai nào. </p>
                )}
                {collections.map((collection) => (
                  <div key={collection.id} className="rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] p-5">
                    <p className="text-sm font-semibold text-[#241F1A]">{collection.name}</p>
                    <p className="text-xs text-[#746A5F]">{collection.artworkCount} tranh</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'favorites' && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {favorites.map((artwork, index) => (
                  <button
                    key={artwork.id}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="group overflow-hidden rounded-3xl border border-[#221E1A]/10 bg-[#FFFCF6] text-left"
                  >
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={artwork.thumbnailUrl || artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        unoptimized
                        className="object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <p className="p-3 text-sm text-[#241F1A]">{artwork.title}</p>
                  </button>
                ))}
                {favorites.length === 0 && (
                  <p className="col-span-full rounded-3xl bg-[#FFFCF6] p-10 text-center text-sm text-[#6E6459]"> Chưa thích tranh nào. </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={favoriteGallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
