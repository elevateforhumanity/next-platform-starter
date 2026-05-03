import { notFound } from 'next/navigation';
import { getDb } from '@/lib/lms/api';

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const supabase = await getDb();

  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!program) notFound();

  return children;
}
