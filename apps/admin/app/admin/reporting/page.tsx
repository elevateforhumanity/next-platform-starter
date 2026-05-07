// Duplicate of /admin/reports — redirects to canonical page
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function Page() {
  redirect('/admin/reports');
}
