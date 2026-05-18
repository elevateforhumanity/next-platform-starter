// Consolidated: /admin/grants/apply → /admin/grants/applications
import { permanentRedirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function Page() {
  permanentRedirect('/admin/grants/applications');
}
