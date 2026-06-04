import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { WioaEtplFormsClient } from '@/components/admin/compliance/WioaEtplFormsClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ programId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programId } = await params;
  const db = await requireAdminClient();
  const { data } = await db
    .from('programs')
    .select('title')
    .eq('id', programId)
    .maybeSingle();
  return {
    title: `${data?.title ?? 'Program'} — WIOA Forms | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  };
}

export default async function WioaEtplProgramFormsPage({ params }: Props) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) notFound();

  const { data: program } = await db
    .from('programs')
    .select('id, title')
    .eq('id', programId)
    .maybeSingle();

  if (!program) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <WioaEtplFormsClient
        programId={program.id}
        programTitle={program.title}
        backHref="/admin/compliance/wioa-etpl"
      />
    </div>
  );
}
