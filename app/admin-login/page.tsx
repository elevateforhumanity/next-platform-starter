import { redirect } from 'next/navigation';

// /admin-login was a duplicate login shell with different styling.
// All login is now handled by /login — redirect permanently.
export default function AdminLoginRedirect() {
  redirect('/login?redirect=/admin/dashboard');
}
