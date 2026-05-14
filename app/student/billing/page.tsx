import { permanentRedirect } from 'next/navigation';

export default function StudentBillingPage() {
  permanentRedirect('/account/billing');
}
