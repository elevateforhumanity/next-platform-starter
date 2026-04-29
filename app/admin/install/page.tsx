import { redirect } from 'next/navigation';

// Moved outside /admin/ — admin layout auth gate blocked unauthenticated access.
export default function Page() {
  redirect('/install-app');
}
