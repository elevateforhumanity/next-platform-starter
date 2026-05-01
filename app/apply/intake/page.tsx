import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * /apply/intake redirects to /apply — the canonical intake URL.
 * Preserves ?program= query param so pre-filled links still work.
 */
export default function IntakePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const program = searchParams?.program;
  if (program) {
    redirect(`/apply?program=${program}`);
  }
  redirect('/apply');
}
