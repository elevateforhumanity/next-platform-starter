import { permanentRedirect } from 'next/navigation';

export default function LegacyPartnersDocumentsPage() {
  permanentRedirect('/partner/documents');
}
