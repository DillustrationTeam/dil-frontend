import { ArtDiscovery } from '@/features/marketplace';

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  return <ArtDiscovery key={q} initialQuery={q} />;
}
