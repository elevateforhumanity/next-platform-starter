import { permanentRedirect } from 'next/navigation';

// Canonical: /reset-password
export default function Page() {
  permanentRedirect('/reset-password');
}
