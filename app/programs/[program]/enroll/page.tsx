import { permanentRedirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
  robots: { index: false, follow: false },
};

// /programs/[slug]/enroll → /programs/[slug]/apply
export default async function EnrollRedirectPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  permanentRedirect(`/programs/${program}/apply`);
}
