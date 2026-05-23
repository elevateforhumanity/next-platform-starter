import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import CoursePipelineClient from './CoursePipelineClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Pipeline | Admin | Elevate for Humanity',
  description: 'Generate a complete course — blueprint, lessons, quizzes, and publish — in one flow.',
  robots: { index: false, follow: false },
};

export default async function CoursePipelinePage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('status', 'active')
    .order('title');

  return <CoursePipelineClient programs={programs ?? []} />;
}
