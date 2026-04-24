import { permanentRedirect } from 'next/navigation';

// Canonical apply URL is /apply/barber — permanently redirect the legacy path
// so search engines and bookmarks update their references.
export default function Page() {
  permanentRedirect('/apply/barber');
}
