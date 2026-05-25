'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { approveApplication } from '@/lib/enrollment/approve';
import { runPostApprovalActions } from '@/lib/enrollment/post-approval';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

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

  // For approvals, run the full pipeline (creates enrollment, account, sends email)
  if (status === 'approved') {
    const { data: app } = await db
      .from('applications')
      .select(
        'id, email, first_name, last_name, program_interest, program_id, funding_type, phone, city',
      )
      .eq('id', applicationId)
      .maybeSingle();

    if (!app) return { success: false, error: 'Application not found' };

    const result = await approveApplication(db, {
      applicationId,
      programId: app.program_id ?? null,
      fundingType: app.funding_type ?? null,
      role: 'student',
      bypassPaymentGate: true,
    });

    if (!result.success) {
      logger.error('[admin/applicants] approveApplication failed', undefined, {
        applicationId,
        error: result.error,
      });
      return { success: false, error: result.error ?? 'Approval pipeline failed' };
    }

    // Send welcome email with credentials — non-fatal, runs in background
    const fullName = [app.first_name, app.last_name].filter(Boolean).join(' ') || null;
    runPostApprovalActions({
      db,
      applicationId,
      programSlug: app.program_interest ?? null,
      studentEmail: app.email,
      studentName: fullName,
      studentPhone: app.phone ?? null,
      studentCity: app.city ?? null,
      fundingType: app.funding_type ?? null,
      tempPassword: result.tempPassword ?? null,
      enrollmentId: result.enrollmentId ?? null,
    }).catch((err: unknown) =>
      logger.error('[admin/applicants] post-approval actions failed (non-fatal)', err as Error),
    );

    revalidatePath('/admin/applications');
    return { success: true };
  }

  // Non-approval transitions — simple status update
  const { error } = await db
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/applications');
  return { success: true };
}
