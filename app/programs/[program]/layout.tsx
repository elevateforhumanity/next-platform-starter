import { getStaticProgram } from '@/data/programs/index';
import { programs as staticPrograms } from '@/content/cf-programs';
import { getDb } from '@/lib/lms/api';

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ program: string }>;
}) {
  const { program: slug } = await params;

  // Static programs always exist — skip DB check to avoid false 404s
  if (getStaticProgram(slug) || staticPrograms.some((p) => p.slug === slug)) {
    return children;
  }

  // For DB-only programs, verify the program exists and is active
  const supabase = await getDb();
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .in('status', ['active', 'published'])
    .maybeSingle();

  // If not found in DB either, let the page handle notFound()
  // Don't call notFound() here — the page has better context
  if (!program) {
    // Allow the page to render and call notFound() itself
  }

  return children;
}
