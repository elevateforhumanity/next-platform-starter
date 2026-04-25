import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import ProgramBuilderClient from './ProgramBuilderClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Builder | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function ProgramBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; programId?: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { tab, programId } = await searchParams;

  const db = getAdminClient();

  const [
    { data: programs },
    { data: courses },
    { data: dbPrograms },
  ] = await Promise.all([
    db.from('programs')
      .select('id, title, slug, category, is_active, published, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50),
    db.from('courses')
      .select('id, title, program_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('programs')
      .select('id, title, category')
      .eq('is_active', true)
      .order('title'),
  ]);

  const programRows = programs ?? [];
  const courseRows = courses ?? [];
  const aiProgramRows = (dbPrograms ?? []).map((p) => ({
    id: p.id,
    name: p.title,
    category: p.category ?? '',
  }));

  const courseCountMap: Record<string, number> = {};
  for (const c of courseRows) {
    if (c.program_id) courseCountMap[c.program_id] = (courseCountMap[c.program_id] ?? 0) + 1;
  }

  return (
    <ProgramBuilderClient
      programs={programRows}
      courseCountMap={courseCountMap}
      aiPrograms={aiProgramRows}
      initialTab={tab ?? 'programs'}
      initialProgramId={programId}
    />
  );
}
