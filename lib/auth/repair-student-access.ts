// Auto-repair service for broken student portal access.
// Creates missing auth users, activates accounts, and seeds missing enrollments.
// Admin-only — never call from public-facing routes.
//
// Schema reality:
//   profiles.id = auth.users.id (direct FK)
//   profiles.is_active — account active flag
//   enrollments.user_id → profiles.id

import { requireAdminClient } from '@/lib/supabase/admin';

export async function repairStudentPortalAccess(
  email: string,
): Promise<{ success: boolean; message: string; actions: string[] }> {
  const normalizedEmail = email.trim().toLowerCase();
  const actions: string[] = [];

  const db = await requireAdminClient();

  // ── Find profile ─────────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id, email, is_active, enrollment_status')
    .ilike('email', normalizedEmail)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile record missing — cannot repair. Create the account first.');
  }

  // ── Ensure auth user exists ──────────────────────────────────────────────
  const { data: authData } = await db.auth.admin.getUserById(profile.id as string);

  if (!authData?.user) {
    const tempPassword = 'Temp1234!' + Math.random().toString(36).slice(2);
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) throw createError;
    actions.push(
      `Created missing auth user (id: ${created.user.id}, email pre-confirmed, temp password set). ` +
      `Note: new auth id differs from profile id — manual reconciliation may be needed.`,
    );
  } else {
    actions.push('Auth user already exists — skipped.');
  }

  // ── Activate profile ─────────────────────────────────────────────────────
  if (!profile.is_active) {
    const { error: updateError } = await db
      .from('profiles')
      .update({ is_active: true })
      .eq('id', profile.id);

    if (updateError) throw updateError;
    actions.push('Set profiles.is_active → true.');
  } else {
    actions.push('Profile already active — skipped.');
  }

  // ── Ensure enrollment exists ─────────────────────────────────────────────
  const { data: enrollment } = await db
    .from('enrollments')
    .select('id, enrollment_state')
    .eq('user_id', profile.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    const { error: enrollError } = await db.from('enrollments').insert({
      user_id: profile.id,
      status: 'active',
      enrollment_state: 'active',
      enrolled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    if (enrollError) throw enrollError;
    actions.push('Created missing enrollment record (enrollment_state: active).');
  } else if (!['active', 'started', 'onboarding'].includes(enrollment.enrollment_state as string)) {
    const { error: stateError } = await db
      .from('enrollments')
      .update({ enrollment_state: 'active' })
      .eq('id', enrollment.id);

    if (stateError) throw stateError;
    actions.push(`Updated enrollment_state: ${enrollment.enrollment_state} → active.`);
  } else {
    actions.push(`Enrollment already in active state (${enrollment.enrollment_state}) — skipped.`);
  }

  return {
    success: true,
    message: 'Student portal access repaired.',
    actions,
  };
}
