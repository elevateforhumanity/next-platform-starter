'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

type ApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'denied' | 'withdrawn';

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<{ success: boolean; error?: string }> {
  const h = await headers();
  const req = new Request('http://localhost', { headers: h });
  const auth = await apiRequireAdmin(req);
  if (auth.error) return { success: false, error: 'Unauthorized' };

  const db = await requireAdminClient();
  if (!db) return { success: false, error: 'DB unavailable' };

  const { error } = await db
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/applications');
  return { success: true };
}
