export type OwnedArtworkSourceType = 'Auction' | 'Commission' | 'Trade';

export interface OwnedArtworkDto {
  id: string;
  title: string;
  thumbnailUrl: string;
  imageUrl: string;
  sourceType: OwnedArtworkSourceType;
  sourceId?: string | null;
  sourceDetailUrl?: string | null;
  creatorId?: string | null;
  creatorName: string;
  creatorAvatarUrl?: string | null;
  acquiredAt: string;
  price?: number | null;
  certificateNumber?: string | null;
  hasMasterFile: boolean;
  downloadUrl?: string | null;
  exclusiveBadge?: string | null;
}

export type OwnedArtworkFilterType = 'ALL' | 'Auction' | 'Commission' | 'Trade';

export type OwnedArtworkSortType =
  | 'NEWEST'
  | 'OLDEST'
  | 'PRICE_HIGH'
  | 'PRICE_LOW'
  | 'TITLE_AZ';

