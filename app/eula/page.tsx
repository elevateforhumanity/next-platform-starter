import { redirect } from 'next/navigation';

// Canonical: /legal/eula
export default function Page() {
  redirect('/legal/eula');
}
