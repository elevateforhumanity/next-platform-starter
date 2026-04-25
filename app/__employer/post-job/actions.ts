'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeError } from '@/lib/api/safe-error';

export async function postJobAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const job_type = (formData.get('job_type') as string) || 'full-time';
  const location = (formData.get('location') as string)?.trim() || null;
  const salary_range = (formData.get('salary_range') as string)?.trim() || null;
  const deadline = (formData.get('deadline') as string) || null;
  const requirements = (formData.get('requirements') as string)?.trim() || null;

  if (!title || !description) return;

  // Resolve employer_id from employers table if it exists
  const { data: employer } = await supabase
    .from('employers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  await supabase.from('job_postings').insert({
    title,
    description,
    job_type,
    location,
    salary_range,
    requirements,
    application_deadline: deadline || null,
    employer_id: employer?.id ?? null,
    status: 'active',
    posted_by: user.id,
  });

  redirect('/employer/opportunities');
}
