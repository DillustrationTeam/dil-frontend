import { BiddingDashboardScreen } from '@/features/auction/components/bidding-dashboard-screen';

export const metadata = {
  title: 'Phiên đấu giá của tôi | dillustration',
  description: 'Quản lý và theo dõi các phiên đấu giá cá nhân đang tham gia.',
};

export default function MyAuctionsPage() {
  return <BiddingDashboardScreen />;
}
