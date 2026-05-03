import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import AICourseBuilderChat from './AICourseBuilderChat';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'AI Course Builder | Admin | Elevate For Humanity',
};

export default async function AICourseBuilderPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  return <AICourseBuilderChat programs={programs ?? []} />;
}
