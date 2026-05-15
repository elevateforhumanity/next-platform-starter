import { permanentRedirect } from 'next/navigation';

export default function PoliciesPrivacyPage() {
  permanentRedirect('/legal/disclosures');
}
