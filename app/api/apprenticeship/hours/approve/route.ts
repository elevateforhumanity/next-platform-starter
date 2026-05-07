import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { hour_id } = body;
    // Partner portal sends { hour_id, action: 'approve' | 'reject' }
    // Legacy callers omit action and default to approve.
    const action: 'approve' | 'reject' = body.action === 'reject' ? 'reject' : 'approve';

    if (!hour_id) {
      return NextResponse.json({ error: 'Hour ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/sponsor/employer (legacy path) or an active partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employer_id')
      .eq('id', user.id)
      .maybeSingle();

    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isLegacyApprover =
      !!profile?.role && ['admin', 'sponsor', 'employer'].includes(profile.role);
    const isPartner = !!partnerUser;

    if (!isLegacyApprover && !isPartner) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin/sponsor/employer or partner role' },
        { status: 403 },
      );
    }

    // Load the hour entry to validate
    const { data: hourEntry } = await supabase
      .from('hour_entries')
      .select('user_id, source_type, status')
      .eq('id', hour_id)
      .maybeSingle();

    if (!hourEntry) {
      return NextResponse.json({ error: 'Hour entry not found' }, { status: 404 });
    }

    if (hourEntry.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending hour entries can be approved or rejected' }, { status: 400 });
    }

    // Employer can only approve OJL hours, not RTI
    const isRti = ['rti', 'in_state_barber_school', 'continuing_education'].includes(
      hourEntry.source_type,
    );
    if (isRti && profile?.role === 'employer') {
      return NextResponse.json(
        { error: 'Employers cannot approve RTI hours — requires sponsor or admin' },
        { status: 403 },
      );
    }

    // OJL hours: employer must supervise this specific student
    if (profile?.role === 'employer' && profile.employer_id) {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('employer_id')
        .eq('id', hourEntry.user_id)
        .maybeSingle();

      if (studentProfile?.employer_id !== profile.employer_id) {
        return NextResponse.json(
          { error: 'Forbidden - can only approve hours for your own apprentices' },
          { status: 403 },
        );
      }
    }

    // Partner: can only approve hours for their own apprentices
    if (isPartner && !isLegacyApprover) {
      const { data: apprenticeship } = await supabase
        .from('apprenticeships')
        .select('id')
        .eq('apprentice_id', hourEntry.user_id)
        .eq('partner_id', partnerUser!.partner_id)
        .maybeSingle();

      if (!apprenticeship) {
        return NextResponse.json(
          { error: 'Forbidden - can only approve hours for your own apprentices' },
          { status: 403 },
        );
      }
    }

    // Approve or reject the hours entry
    const updatePayload =
      action === 'approve'
        ? {
            status: 'approved',
            approved_by: user.email,
            approved_at: new Date().toISOString(),
            approved_by_role: profile?.role ?? null,
          }
        : {
            status: 'rejected',
            approved_by: user.email,
            approved_at: new Date().toISOString(),
            approved_by_role: profile?.role ?? null,
          };

    const { error } = await supabase
      .from('hour_entries')
      .update(updatePayload)
      .eq('id', hour_id)
      .eq('status', 'pending');

    if (error) {
      // Error: $1
      return NextResponse.json({ error: `Failed to ${action} hours` }, { status: 500 });
    }

    return NextResponse.json({ success: true, action });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to approve hours' },
      { status: 500 },
    );
  }
}

// Bulk approve
async function _PUT(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { hour_ids } = await req.json();

    if (!hour_ids || !Array.isArray(hour_ids)) {
      return NextResponse.json({ error: 'Hour IDs array is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/sponsor/employer (legacy path) or an active partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employer_id')
      .eq('id', user.id)
      .maybeSingle();

    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isLegacyApprover =
      !!profile?.role && ['admin', 'sponsor', 'employer'].includes(profile.role);
    const isPartner = !!partnerUser;

    if (!isLegacyApprover && !isPartner) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin/sponsor/employer or partner role' },
        { status: 403 },
      );
    }

    // If employer, verify all hours belong to their apprentices
    if (profile?.role === 'employer' && profile.employer_id) {
      const { data: entries } = await supabase
        .from('hour_entries')
        .select('user_id')
        .in('id', hour_ids);

      if (entries) {
        const studentIds = [...new Set(entries.map((e) => e.user_id))];
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, employer_id')
          .in('id', studentIds);

        const unauthorized = studentProfiles?.filter(
          (sp) => sp.employer_id !== profile.employer_id,
        );
        if (unauthorized && unauthorized.length > 0) {
          return NextResponse.json(
            { error: 'Forbidden - can only approve hours for your own apprentices' },
            { status: 403 },
          );
        }
      }
    }

    // Partner: can only approve hours for their own apprentices
    if (isPartner && !isLegacyApprover) {
      const { data: entries } = await supabase
        .from('hour_entries')
        .select('user_id')
        .in('id', hour_ids);

      if (entries) {
        const studentIds = [...new Set(entries.map((e: { user_id: string }) => e.user_id))];
        const { data: apprenticeships } = await supabase
          .from('apprenticeships')
          .select('apprentice_id')
          .in('apprentice_id', studentIds)
          .eq('partner_id', partnerUser!.partner_id);

        const authorizedIds = new Set(
          (apprenticeships || []).map((a: { apprentice_id: string }) => a.apprentice_id),
        );
        const unauthorized = studentIds.filter((id) => !authorizedIds.has(id));
        if (unauthorized.length > 0) {
          return NextResponse.json(
            { error: 'Forbidden - can only approve hours for your own apprentices' },
            { status: 403 },
          );
        }
      }
    }

    // Bulk approve — only pending entries, trigger enforces attestation
    const { error } = await supabase
      .from('hour_entries')
      .update({
        status: 'approved',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        approved_by_role: profile?.role ?? null,
      })
      .in('id', hour_ids)
      .eq('status', 'pending');

    if (error) {
      // Error: $1
      return NextResponse.json({ error: 'Failed to approve hours' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: hour_ids.length });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to approve hours' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/apprenticeship/hours/approve', _POST, { critical: true });
export const PUT = withApiAudit('/api/apprenticeship/hours/approve', _PUT, { critical: true });
