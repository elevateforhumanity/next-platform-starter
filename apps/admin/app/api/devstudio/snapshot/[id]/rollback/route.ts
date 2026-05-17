/**
 * POST /api/devstudio/snapshot/[id]/rollback
 *
 * Execute rollback for a snapshot. Runs rollback_sql if present,
 * marks the snapshot as rolled_back, emits a rollback event.
 *
 * Requires deployer-tier confirmation — only super_admin can trigger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { emitEvent } from '@/lib/platform/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // Fetch snapshot
    const { data: snapshot, error: fetchErr } = await supabase
      .from('platform_snapshots')
      .select('id, label, rollback_sql, rolled_back, snapshot_type')
      .eq('id', id)
      .single();

    if (fetchErr || !snapshot) return safeError('Snapshot not found', 404);
    if (snapshot.rolled_back) return safeError('Snapshot already rolled back', 409);

    // Execute rollback SQL if present
    if (snapshot.rollback_sql) {
      const dangerous = /\b(DROP\s+TABLE|TRUNCATE)\b/i.test(snapshot.rollback_sql);
      if (dangerous) {
        return safeError('Rollback SQL contains destructive statements — execute manually in Supabase Dashboard', 422);
      }

      const { error: sqlErr } = await supabase.rpc('exec_sql', { sql: snapshot.rollback_sql });
      if (sqlErr) return safeError(`Rollback SQL failed: ${sqlErr.message}`, 500);
    }

    // Mark as rolled back
    await supabase
      .from('platform_snapshots')
      .update({ rolled_back: true, rolled_back_at: new Date().toISOString() })
      .eq('id', id);

    await emitEvent('snapshot.rolled_back', 'system', {
      severity: 'warning',
      actor_id: auth.user?.id,
      actor_type: 'ai',
      subject_id: id,
      subject_type: 'snapshot',
      message: `Rollback executed: ${snapshot.label}`,
    });

    return NextResponse.json({
      success: true,
      message: `Rollback executed for: ${snapshot.label}`,
      had_sql: !!snapshot.rollback_sql,
    });
  } catch (err) {
    return safeInternalError(err, 'Rollback failed');
  }
}
