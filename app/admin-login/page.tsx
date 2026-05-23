import { redirect } from 'next/navigation';

// Shadow route — canonical admin login is at admin.elevateforhumanity.org/login.
// This page previously duplicated the admin login form on the main site.
export default function AdminLoginRedirect() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org';
  redirect(`${adminUrl}/login`);
}
