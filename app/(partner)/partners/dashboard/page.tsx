import { permanentRedirect } from 'next/navigation';

export default function LegacyPartnersDashboardPage() {
  permanentRedirect('/partner/dashboard');
}
