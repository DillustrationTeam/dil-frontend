import { BiddingDashboardScreen } from '@/features/auction/components/bidding-dashboard-screen';

export const metadata = {
  title: 'Phiên tôi đang theo dõi | dillustration',
  description: 'Danh sách phiên đấu giá bạn đã bấm theo dõi, kèm nhắc nhở khi phiên sắp kết thúc.',
};

export default function WatchingAuctionsPage() {
  return <BiddingDashboardScreen initialTab="watching" />;
}
