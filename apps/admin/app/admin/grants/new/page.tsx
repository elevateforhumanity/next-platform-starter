// Consolidated: /admin/grants/new → /admin/grants/applications/new
import { permanentRedirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function Page() {
  permanentRedirect('/admin/grants/applications/new');
}
