export const revalidate = 3600;

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin Login | Elevate For Humanity',
  description: 'Administrator sign-in for Elevate For Humanity.',
  robots: { index: false, follow: false },
};

export default function AdminPortalPublicPage() {
  redirect('/admin-login');
}
