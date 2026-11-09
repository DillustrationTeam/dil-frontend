'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TradeStation } from '@/features/art-trade/components/TradeStation';

export default function ArtTradeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id === 'create') {
      router.replace('/art-trades/create');
    }
  }, [params?.id, router]);

  if (!params?.id || params.id === 'create') {
    return null;
  }

  return (
    <main className="min-h-screen py-10">
      <TradeStation tradeId={params.id} />
    </main>
  );
}

