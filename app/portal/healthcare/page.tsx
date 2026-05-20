import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Heart } from 'lucide-react';
import { BookOpen, Award, FileText, Clock, TrendingUp, GraduationCap } from 'lucide-react';
import IndustryPortalPage from '../_components/IndustryPortalPage';

export const metadata: Metadata = {
  title: 'Healthcare Portal — Elevate for Humanity',
  description: 'Your healthcare training portal. Track CNA, Medical Assistant, Phlebotomy, and other healthcare program progress.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const QUICK_LINKS = [
  { name: 'My Courses', href: '/lms/courses', icon: BookOpen, description: 'Continue your coursework' },
  { name: 'Certificates', href: '/lms/certificates', icon: Award, description: 'View earned credentials' },
  { name: 'Schedule', href: '/lms/calendar', icon: Clock, description: 'Upcoming classes & labs' },
  { name: 'Documents', href: '/learner/dashboard', icon: FileText, description: 'Upload required documents' },
  { name: 'Grades', href: '/lms/grades', icon: TrendingUp, description: 'View quiz & exam scores' },
  { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'Exam preparation resources' },
];

export default async function HealthcarePortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/healthcare');

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
    credential: 'Healthcare Credential',
    progress: e.progress_pct ?? 0,
    status: e.enrollment_state as 'active' | 'completed',
  }));

  return (
    <IndustryPortalPage
      portalKey="healthcare"
      industryLabel="Healthcare"
      industryIcon={<Heart className="w-5 h-5 text-white" />}
      accentColor="text-rose-600"
      accentBg="bg-rose-600"
      userName={profile?.full_name ?? user.email ?? 'Student'}
      enrolledPrograms={enrolledPrograms}
      availablePrograms={[
        { title: 'Certified Nursing Assistant (CNA)', slug: 'cna', credential: 'Indiana ISDH CNA', progress: 0, status: 'not_started' },
        { title: 'Medical Assistant', slug: 'medical-assistant', credential: 'NHA CCMA', progress: 0, status: 'not_started' },
        { title: 'Phlebotomy Technician', slug: 'phlebotomy', credential: 'NHA CPT', progress: 0, status: 'not_started' },
        { title: 'Pharmacy Technician', slug: 'pharmacy-technician', credential: 'PTCB CPhT', progress: 0, status: 'not_started' },
      ]}
      quickLinks={QUICK_LINKS}
    />
  );
}
