import { redirect } from 'next/navigation';

// Canonical: /login
export default function Page() {
  redirect('/login');
}
