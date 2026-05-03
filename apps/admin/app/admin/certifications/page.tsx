import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { CertificationReviewPanel } from '@/components/admin/CertificationReviewPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Certifications | Admin | Elevate for Humanity',
  description: 'Review and manage student certifications and credentials.',
};

async function getCertificationData() {
  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const [pendingRes, recentRes] = await Promise.all([
    db
      .from('step_submissions')
      .select('id, user_id, lesson_id, status, submitted_at, notes, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
      .limit(50),
    db
      .from('step_submissions')
      .select('id, user_id, lesson_id, status, submitted_at, notes, profiles(full_name, email)')
      .in('status', ['approved', 'rejected'])
      .order('submitted_at', { ascending: false })
      .limit(20),
  ]);

  // Map step_submissions rows to the shape CertificationReviewPanel expects.
  // step_submissions is the source of truth for lab/assignment sign-off;
  // the panel interface uses a superset — unmapped fields default to empty strings.
  const mapRow = (s: any) => ({
    id: s.id as string,
    certification_name: s.lesson_id ?? '',
    provider: 'Elevate for Humanity',
    user_id: s.user_id ?? '',
    program_id: '',
    status: (s.status === 'pending' ? 'pending_review' : s.status) as 'pending_review' | 'approved' | 'rejected',
    created_at: s.submitted_at ?? '',
    reviewer_notes: s.notes ?? '',
    profiles: s.profiles
      ? { id: s.user_id ?? '', full_name: s.profiles.full_name ?? '', email: s.profiles.email ?? '' }
      : undefined,
  });

  return {
    pending: (pendingRes.data ?? []).map(mapRow),
    recent: (recentRes.data ?? []).map(mapRow),
  };
}

export default async function CertificationsPage() {
  await requireRole(['admin', 'super_admin', 'instructor']);
  const { pending, recent } = await getCertificationData();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Certifications' }]} />
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Certifications</h1>
          <p className="text-slate-600 mt-1">
            Review pending submissions and manage issued credentials.
          </p>
        </div>
        <CertificationReviewPanel pendingSubmissions={pending} recentSubmissions={recent} />
      </div>
    </div>
  );
}
