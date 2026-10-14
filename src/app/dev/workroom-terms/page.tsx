import { notFound } from 'next/navigation';
import WorkroomTermsPreview from './preview';

export default function WorkroomTermsPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <WorkroomTermsPreview />;
}
