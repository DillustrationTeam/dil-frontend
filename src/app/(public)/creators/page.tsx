import type { Metadata } from 'next';
import { CreatorsDirectory } from '@/features/marketplace';

export const metadata: Metadata = {
  title: 'Tìm Họa Sĩ & Đặt Vẽ | dillustration',
  description:
    'Tìm kiếm và lọc danh sách họa sĩ chuyên về từng danh mục để gửi yêu cầu đặt vẽ commission.',
};

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = '' } = await searchParams;
  return <CreatorsDirectory key={category} initialCategory={category} />;
}
