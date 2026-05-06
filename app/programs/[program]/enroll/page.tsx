import { redirect } from 'next/navigation';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// /programs/[slug]/enroll → /programs/[slug]/apply
// The catalog "Enroll" button links here; the real flow is /apply.
export default function EnrollRedirectPage({ params }: { params: { program: string } }) {
  redirect(`/programs/${params.program}/apply`);
}
