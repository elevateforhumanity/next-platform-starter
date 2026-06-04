import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { WioaEtplProgramHubClient } from '@/components/admin/compliance/WioaEtplProgramHubClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ programId: string }> };

export async function generateMetadata({ params }: Props) {
  const { programId } = await params;
  const db = await requireAdminClient();
  const { data } = await db?.from('programs').select('title').eq('id', programId).maybeSingle() ?? {
    data: null,
  };
  return {
    title: `${data?.title ?? 'Program'} — WIOA compliance | Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function WioaEtplProgramHubPage({ params }: Props) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) notFound();
  const { data: program } = await db.from('programs').select('id').eq('id', programId).maybeSingle();
  if (!program) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <WioaEtplProgramHubClient programId={programId} />
    </div>
  );
}
