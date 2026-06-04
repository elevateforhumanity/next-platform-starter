import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { WioaIeapAdminForm } from '@/components/admin/compliance/WioaIeapAdminForm';
import type { Metadata } from 'next';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ programId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programId } = await params;
  const db = await requireAdminClient();
  const { data } = await db?.from('programs').select('title').eq('id', programId).maybeSingle() ?? {
    data: null,
  };
  return {
    title: `${FORM_LABELS.initial_eligibility_aggregate_performance} | ${data?.title ?? 'Program'} | Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function WioaIeapAdminPage({ params }: Props) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) notFound();
  const { data: program } = await db.from('programs').select('id').eq('id', programId).maybeSingle();
  if (!program) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <WioaIeapAdminForm programId={programId} />
    </div>
  );
}
