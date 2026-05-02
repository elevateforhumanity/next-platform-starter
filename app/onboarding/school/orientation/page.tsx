// /onboarding/school/orientation was a boilerplate stub.
// Redirect to the parent onboarding flow.
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect('/onboarding');
}
