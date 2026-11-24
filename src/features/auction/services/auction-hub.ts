import { hubUrl } from '@/lib/realtime-url';

/** URL hub SignalR của Auction Module (`/hubs/auctions`). */
export function auctionHubUrl(): string {
  return hubUrl('/hubs/auctions');
}
