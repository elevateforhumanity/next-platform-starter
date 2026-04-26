import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CourseAuthoringToolClient from './CourseAuthoringToolClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Builder | Elevate LMS',
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/builder' },
};

export default async function BuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/builder');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowed = ['admin', 'super_admin', 'staff', 'instructor'];
  if (!profile || !allowed.includes(profile.role)) redirect('/lms/dashboard');

  return <CourseAuthoringToolClient />;
}
