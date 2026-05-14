import { permanentRedirect } from 'next/navigation';

export default function LegacyPartnersHoursPage() {
  permanentRedirect('/partner/hours');
}
