import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Users } from 'lucide-react';
import { BookOpen, Award, FileText, Clock, TrendingUp, GraduationCap } from 'lucide-react';
import IndustryPortalPage from '../_components/IndustryPortalPage';

export const metadata: Metadata = {
  title: 'Social Services Portal — Elevate for Humanity',
  description: 'Your social services training portal. Track Peer Recovery, DSP, and human services program progress.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const QUICK_LINKS = [
  { name: 'My Courses', href: '/lms/courses', icon: BookOpen, description: 'Continue your coursework' },
  { name: 'Certificates', href: '/lms/certificates', icon: Award, description: 'View earned credentials' },
  { name: 'Schedule', href: '/lms/calendar', icon: Clock, description: 'Upcoming classes & labs' },
  { name: 'Documents', href: '/learner/dashboard', icon: FileText, description: 'Upload required documents' },
  { name: 'Grades', href: '/lms/grades', icon: TrendingUp, description: 'View assessment scores' },
  { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'CPRC and credential exam prep' },
];

export default async function SocialServicesPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/social-services');

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
    credential: 'Social Services Credential',
    progress: e.progress_pct ?? 0,
    status: e.enrollment_state as 'active' | 'completed',
  }));

  return (
    <IndustryPortalPage
      portalKey="social-services"
      industryLabel="Social Services"
      industryIcon={<Users className="w-5 h-5 text-white" />}
      accentColor="text-teal-600"
      accentBg="bg-teal-600"
      userName={profile?.full_name ?? user.email ?? 'Student'}
      enrolledPrograms={enrolledPrograms}
      availablePrograms={[
        { title: 'Peer Recovery Specialist', slug: 'peer-recovery-specialist', credential: 'CPRC Pathway', progress: 0, status: 'not_started' },
        { title: 'Direct Support Professional', slug: 'direct-support-professional', credential: 'DSP Credential', progress: 0, status: 'not_started' },
        { title: 'Home Health Aide', slug: 'home-health-aide', credential: 'Indiana HHA', progress: 0, status: 'not_started' },
      ]}
      quickLinks={QUICK_LINKS}
    />
  );
}
