import { permanentRedirect } from 'next/navigation';

export default function LegacyPartnersLoginPage() {
  permanentRedirect('/partner/login');
}
