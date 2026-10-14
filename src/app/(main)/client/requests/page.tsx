import { permanentRedirect } from 'next/navigation';

export default function ClientRequestsPage() {
  permanentRedirect('/client/commissions');
}
