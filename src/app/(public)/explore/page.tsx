import { ArtDiscovery } from '@/features/marketplace';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; style?: string }>;
}) {
  const { q = '', category = '', tag = '', style = '' } = await searchParams;
  const resolvedCategory = category || style || '';
  return (
    <ArtDiscovery
      key={`${q}:${resolvedCategory}:${tag}`}
      initialQuery={q}
      initialCategory={resolvedCategory}
      initialTag={tag}
    />
  );
}
