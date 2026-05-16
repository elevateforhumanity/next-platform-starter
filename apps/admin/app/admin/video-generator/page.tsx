import { permanentRedirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
// Merged into /admin/media-studio — this route is an alias kept for backward compatibility.
export default function Page() {
  permanentRedirect('/admin/media-studio');
}
