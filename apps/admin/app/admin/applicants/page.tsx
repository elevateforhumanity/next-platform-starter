import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ApplicantsLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const nextParams = new URLSearchParams();

  if (params.status && params.status !== 'all') {
    nextParams.set('status', params.status);
  }

  // Legacy `q` parameter maps to canonical `search`.
  if (params.q) {
    nextParams.set('search', params.q);
  }

  if (params.page && params.page !== '1') {
    nextParams.set('page', params.page);
  }

  const query = nextParams.toString();
  redirect(query ? `/admin/applications?${query}` : '/admin/applications');
}
