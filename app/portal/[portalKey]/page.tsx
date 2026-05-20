import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import IndustryPortalPage from '../_components/IndustryPortalPage';
import { PORTAL_CONFIGS, VALID_PORTAL_KEYS } from './portal-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ portalKey: string }> }) {
  const { portalKey } = await params;
  const config = PORTAL_CONFIGS[portalKey];
  if (!config) return { title: 'Portal Not Found' };
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function IndustryPortalPageRoute({
  params,
}: {
  params: Promise<{ portalKey: string }>;
}) {
  const { portalKey } = await params;

  if (!VALID_PORTAL_KEYS.includes(portalKey)) {
    notFound();
  }

  const config = PORTAL_CONFIGS[portalKey];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/portal/${portalKey}`);

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
    credential: `${config.label} Credential`,
    progress: e.progress_pct ?? 0,
    status: e.enrollment_state as 'active' | 'completed',
  }));

  const Icon = config.icon;

  return (
    <IndustryPortalPage
      portalKey={portalKey}
      industryLabel={config.label}
      industryIcon={<Icon className="w-5 h-5 text-white" />}
      accentColor={config.accentColor}
      accentBg={config.accentBg}
      userName={profile?.full_name ?? user.email ?? 'Student'}
      enrolledPrograms={enrolledPrograms}
      availablePrograms={config.availablePrograms.map((p) => ({ ...p, progress: 0, status: 'not_started' as const }))}
      quickLinks={config.quickLinks}
    />
  );
}
