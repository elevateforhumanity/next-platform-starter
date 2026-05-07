// Duplicate of /admin/certificates — redirects to canonical page
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function Page() {
  redirect('/admin/certificates');
}
