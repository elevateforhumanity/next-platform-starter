import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Scope to the authenticated user — ignore any userId in the body to prevent IDOR.
    const userId = user.id;

    const db = await requireAdminClient();

    // Check if student has Milady enrollment
    const { data: miladyEnrollment } = await db
      .from('partner_lms_enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('provider_type', 'milady')
      .maybeSingle();

    if (!miladyEnrollment) {
      return NextResponse.json({ error: 'No Milady enrollment found' }, { status: 404 });
    }

    // Update onboarding record
    const { error } = await db
      .from('student_onboarding')
      .update({ milady_orientation_completed: true })
      .eq('student_id', userId);

    if (error) {
      // Error: $1
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to mark orientation complete' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/student/mark-milady-orientation', _POST);
