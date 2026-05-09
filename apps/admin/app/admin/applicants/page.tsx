import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ApplicantsLegacyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;

    const values = Array.isArray(value) ? value : [value];
    const targetKey = key === 'q' ? 'search' : key;

    for (const v of values) {
      if (!v) continue;
      if (targetKey === 'status' && v === 'all') continue;
      if (targetKey === 'page' && v === '1') continue;
      nextParams.append(targetKey, v);
    }
  }

  const query = nextParams.toString();
  redirect(query ? `/admin/applications?${query}` : '/admin/applications');
}
