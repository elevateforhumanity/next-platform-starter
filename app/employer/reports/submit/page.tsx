import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import ReportSubmitClient from './ReportSubmitClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Submit WIOA Report | Employer Portal',
  description: 'Submit workforce outcome metrics and compliance data for your reporting period.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/reports/submit' },
};

export default async function EmployerReportSubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/employer/reports/submit');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role, employer_id, company_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['employer', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const employerKey = profile.employer_id || user.id;

  const [{ count: participantsServed }, { count: completions }, { count: placements }] = await Promise.all([
    db.from('applications').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey),
    db.from('applications').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey).eq('status', 'completed'),
    db.from('job_placements').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey).eq('status', 'placed'),
  ]);

  return (
    <ReportSubmitClient
      companyName={profile.company_name || 'Your Organization'}
      defaults={{
        participantsServed: participantsServed || 0,
        completions: completions || 0,
        placements: placements || 0,
      }}
    />
  );
}
