import { permanentRedirect } from 'next/navigation';

export default function LegacyPartnersStudentsPage() {
  permanentRedirect('/partner/students');
}
