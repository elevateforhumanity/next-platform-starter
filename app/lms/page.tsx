import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'LMS Portal | Elevate for Humanity',
  description: 'Secure learner portal for courses, lessons, progress tracking, and certifications.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms',
  },
};

export default async function LmsRootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms');
  redirect('/learner/dashboard');
}
