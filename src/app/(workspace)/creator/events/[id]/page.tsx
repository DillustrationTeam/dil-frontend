import { redirect } from 'next/navigation';

export default async function CreatorEventRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/creator/events/${id}/jury`);
}
