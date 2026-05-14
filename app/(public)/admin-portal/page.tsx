import { permanentRedirect } from 'next/navigation';

export default function AdminPortalPage() {
  permanentRedirect('/admin-login');
}
