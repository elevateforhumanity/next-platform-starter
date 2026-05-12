import { redirect } from 'next/navigation';

// Canonical: /legal/privacy
export default function Page() {
  redirect('/legal/privacy');
}
