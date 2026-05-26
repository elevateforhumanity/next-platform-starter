import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';
import { APPRENTICE_PORTAL_CONFIGS, type ApprenticePortalConfig } from '@/components/portal/ApprenticePortalShell';

export async function loadApprenticePortalData(programSlug: string) {
  const config: ApprenticePortalConfig =
    APPRENTICE_PORTAL_CONFIGS[programSlug] ??
    ({
      programSlug,
      label: 'Apprenticeship',
      icon: require('lucide-react').GraduationCap,
      accentBg: 'bg-blue-600',
      accentText: 'text-blue-600',
      heroImage: '/images/pages/apprenticeship-hero.webp',
      shopLabel: 'Host Shop',
      requiredOjl: 2000,
      requiredRti: 0,
      portalPath: '/portal/apprentice',
    } as ApprenticePortalConfig);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${config.portalPath}`);

  const [profileRes, enrollmentRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('program_enrollments')
      .select('id, program_id, program_slug, enrollment_state, orientation_completed_at, stripe_subscription_id, stripe_subscription_status')
      .eq('user_id', user.id)
      .eq('program_slug', programSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const enrollment = enrollmentRes.data;
  const hours = await getApprovedHoursByType(supabase, user.id, programSlug);

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type, status, verification_status')
    .eq('user_id', user.id);

  const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'Apprentice';

  return { config, firstName, enrollment, hours, docs: docs ?? [] };
}
