import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Scissors } from 'lucide-react';
import { BookOpen, Award, FileText, Clock, TrendingUp, GraduationCap } from 'lucide-react';
import IndustryPortalPage from '../_components/IndustryPortalPage';

export const metadata: Metadata = {
  title: 'Beauty & Barber Portal — Elevate for Humanity',
  description: 'Your beauty & barber training portal. Track cosmetology, barber, and esthetics program progress.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const QUICK_LINKS = [
  { name: 'My Courses', href: '/lms/courses', icon: BookOpen, description: 'Continue your coursework' },
  { name: 'Certificates', href: '/lms/certificates', icon: Award, description: 'View earned credentials' },
  { name: 'Schedule', href: '/lms/calendar', icon: Clock, description: 'Upcoming classes & labs' },
  { name: 'Documents', href: '/learner/dashboard', icon: FileText, description: 'Upload required documents' },
  { name: 'Hours Log', href: '/apprentice/hours', icon: TrendingUp, description: 'Track OJL & RTI hours' },
  { name: 'State Board Prep', href: '/apprentice/state-board', icon: GraduationCap, description: 'Indiana state board exam prep' },
];

export default async function BeautyPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/beauty');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, program_id, program_slug, enrollment_state, progress_pct')
    .eq('user_id', user.id)
    .in('enrollment_state', ['active', 'completed'])
    .order('created_at', { ascending: false });

  const enrolledPrograms = (enrollments ?? []).map((e: any) => ({
    title: e.program_slug?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Program',
    slug: e.program_slug ?? e.program_id,
    credential: 'Beauty Credential',
    progress: e.progress_pct ?? 0,
    status: e.enrollment_state as 'active' | 'completed',
  }));

  return (
    <IndustryPortalPage
      portalKey="beauty"
      industryLabel="Beauty & Barber"
      industryIcon={<Scissors className="w-5 h-5 text-white" />}
      accentColor="text-pink-600"
      accentBg="bg-pink-600"
      userName={profile?.full_name ?? user.email ?? 'Student'}
      enrolledPrograms={enrolledPrograms}
      availablePrograms={[
        { title: 'Barber Apprenticeship', slug: 'barber-apprenticeship', credential: 'Indiana Barber License', progress: 0, status: 'not_started' },
        { title: 'Cosmetology Apprenticeship', slug: 'cosmetology-apprenticeship', credential: 'Indiana Cosmetology License', progress: 0, status: 'not_started' },
        { title: 'Esthetics Apprenticeship', slug: 'esthetician-apprenticeship', credential: 'Indiana Esthetician License', progress: 0, status: 'not_started' },
        { title: 'Nail Technology', slug: 'nail-technology', credential: 'Indiana Nail Tech License', progress: 0, status: 'not_started' },
      ]}
      quickLinks={QUICK_LINKS}
    />
  );
}
