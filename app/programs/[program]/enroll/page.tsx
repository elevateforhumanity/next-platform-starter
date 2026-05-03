import { redirect } from 'next/navigation';

// /programs/[slug]/enroll → /programs/[slug]/apply
// The catalog "Enroll" button links here; the real flow is /apply.
export default function EnrollRedirectPage({ params }: { params: { program: string } }) {
  redirect(`/programs/${params.slug}/apply`);
}
