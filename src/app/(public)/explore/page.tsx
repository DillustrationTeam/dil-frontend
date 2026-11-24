import { ArtDiscovery } from '@/features/marketplace';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; style?: string; sort?: string }>;
}) {
  const { q = '', category = '', tag = '', style = '', sort = 'newest' } = await searchParams;
  const resolvedCategory = category || style || '';
  return (
    <ArtDiscovery
      key={`${q}:${resolvedCategory}:${tag}:${sort}`}
      initialQuery={q}
      initialCategory={resolvedCategory}
      initialTag={tag}
      initialSort={sort}
    />
  );
}
