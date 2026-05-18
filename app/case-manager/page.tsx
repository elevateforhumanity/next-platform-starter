import { permanentRedirect } from 'next/navigation';

export default function CaseManagerRoot() {
  permanentRedirect('/case-manager/dashboard');
}
