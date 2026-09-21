import type { Metadata } from 'next';
import { WalletEntry } from './wallet-entry';

export const metadata: Metadata = {
  title: 'Ví của tôi | Dillustration',
  description: 'Theo dõi số dư, tiền tạm giữ và lịch sử giao dịch trong ví Dillustration.',
};

export default function WalletPage() {
  return <WalletEntry />;
}
