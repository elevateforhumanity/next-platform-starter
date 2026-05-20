/**
 * Regression tests for student portal access fixes.
 *
 * Three bugs fixed:
 * 1. requireRole redirected to /unauthorized when profile row was missing.
 *    Fixed: redirects to /onboarding/learner?reason=profile_missing instead.
 *
 * 2. proxy.ts enrollment gate used stale enrollment_state values
 *    ('documents_complete', 'confirmed', 'orientation_complete') that no longer
 *    exist in the DB constraint. Fixed: gate passes 'active' and 'enrolled';
 *    terminal states go to /unauthorized; in-progress states route to enrollment flow.
 *
 * 3. access_granted_at was never set automatically — students who completed the
 *    full enrollment flow were blocked from /lms/ until an admin manually granted
 *    access. Fixed: submit-documents and documents/complete now set access_granted_at.
 *
 * These are static analysis tests — they read source files and assert the correct
 * behavior is present. No Supabase mocking required.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function read(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// Fix 1: requireRole — missing profile redirects to onboarding, not /unauthorized
// ---------------------------------------------------------------------------

describe('requireRole — missing profile row', () => {
  const src = read('lib/auth/require-role.ts');

  it('redirects to /onboarding/learner when profile is null', () => {
    expect(src).toContain('/onboarding/learner?reason=profile_missing');
  });

  it('does not redirect to /unauthorized when profile is null for non-admin', () => {
    // The old code had a single `if (!profile || !allowed)` block that always
    // went to /unauthorized. The fix splits this into two separate checks.
    // Verify the null-profile branch does NOT unconditionally go to /unauthorized.
    const nullProfileBlock = src.slice(
      src.indexOf('Profile row missing'),
      src.indexOf('Load secondary roles'),
    );
    expect(nullProfileBlock).toContain('/onboarding/learner');
    expect(nullProfileBlock).not.toMatch(/redirect\(['"`]\/unauthorized/);
  });

  it('still redirects admin service role to /unauthorized when profile is null', () => {
    const nullProfileBlock = src.slice(
      src.indexOf('Profile row missing'),
      src.indexOf('Load secondary roles'),
    );
    expect(nullProfileBlock).toContain("SERVICE_ROLE === 'admin'");
    expect(nullProfileBlock).toContain('/unauthorized');
  });

  it('still redirects to /unauthorized when profile exists but role is wrong', () => {
    // The role-mismatch redirect must still exist after the profile-null split.
    const afterNullCheck = src.slice(src.indexOf('Load secondary roles'));
    expect(afterNullCheck).toContain('/unauthorized');
  });
});

// ---------------------------------------------------------------------------
// Fix 2: proxy.ts enrollment gate — correct state values
// ---------------------------------------------------------------------------

describe('proxy.ts enrollment gate — enrollment_state values', () => {
  const src = read('proxy.ts');

  it('passes students with enrollment_state = active', () => {
    expect(src).toContain("LMS_ACCESS_STATES = new Set(['active', 'enrolled'])");
  });

  it('passes students with enrollment_state = enrolled', () => {
    expect(src).toContain("'enrolled'");
  });

  it('does not reference the removed documents_complete state as an access state', () => {
    // documents_complete was removed from the DB constraint in migration 20260501000010.
    // It must not appear in the LMS_ACCESS_STATES set.
    const accessStatesBlock = src.slice(
      src.indexOf('LMS_ACCESS_STATES'),
      src.indexOf('TERMINAL_STATES'),
    );
    expect(accessStatesBlock).not.toContain('documents_complete');
  });

  it('sends terminal states to /unauthorized, not enrollment flow', () => {
    expect(src).toContain("TERMINAL_STATES.has(state)");
    const terminalBlock = src.slice(
      src.indexOf('TERMINAL_STATES.has(state)'),
      src.indexOf('In-progress enrollment states'),
    );
    expect(terminalBlock).toContain('/unauthorized');
  });

  it('does not reference the removed confirmed state as a redirect target', () => {
    // 'confirmed' was a state that no longer exists in the DB constraint.
    // The old code had: if (state === 'confirmed') redirectPath = '/enrollment/orientation'
    // This must be gone.
    const enrollmentGateBlock = src.slice(
      src.indexOf('LMS_ACCESS_STATES'),
      src.indexOf('if (needsPartner)'),
    );
    expect(enrollmentGateBlock).not.toMatch(/state === ['"]confirmed['"]/);
  });

  it('does not reference the removed orientation_complete state as a redirect trigger', () => {
    const enrollmentGateBlock = src.slice(
      src.indexOf('LMS_ACCESS_STATES'),
      src.indexOf('if (needsPartner)'),
    );
    expect(enrollmentGateBlock).not.toMatch(/state === ['"]orientation_complete['"]/);
  });

  it('routes onboarding/orientation states to /enrollment/orientation', () => {
    expect(src).toContain("state === 'orientation' || state === 'onboarding'");
    const routingBlock = src.slice(
      src.indexOf("state === 'orientation' || state === 'onboarding'"),
      src.indexOf('return NextResponse.redirect(new URL(redirectPath'),
    );
    expect(routingBlock).toContain('/enrollment/orientation');
  });
});

// ---------------------------------------------------------------------------
// Fix 3: access_granted_at auto-set on enrollment completion
// ---------------------------------------------------------------------------

describe('submit-documents route — auto-grants LMS access', () => {
  const src = read('app/api/enrollment/submit-documents/route.ts');

  it('sets access_granted_at in the enrollment update', () => {
    expect(src).toContain('access_granted_at: now');
  });

  it('sets enrollment_state to active', () => {
    expect(src).toContain("enrollment_state: 'active'");
  });

  it('no longer looks for removed documents_complete state', () => {
    expect(src).not.toContain("'documents_complete'");
  });

  it('no longer looks for removed confirmed state', () => {
    expect(src).not.toContain("'confirmed'");
  });

  it('looks for orientation_complete as the pre-documents state', () => {
    expect(src).toContain("'orientation_complete'");
  });
});

describe('documents/complete route — auto-grants LMS access', () => {
  const src = read('app/api/enrollment/documents/complete/route.ts');

  it('sets access_granted_at in the enrollment update', () => {
    expect(src).toContain('access_granted_at: now');
  });

  it('sets enrollment_state to active', () => {
    expect(src).toContain("enrollment_state: 'active'");
  });

  it('no longer treats documents_complete as an already-submitted state', () => {
    // Old code: if (enrollment_state === 'documents_complete' || 'active') -> already submitted
    // Fixed: only 'active' means already submitted
    const alreadySubmittedBlock = src.slice(
      src.indexOf('Documents already submitted'),
      src.indexOf('Documents already submitted') + 200,
    );
    expect(alreadySubmittedBlock).not.toContain('documents_complete');
  });
});

// ---------------------------------------------------------------------------
// Enrollment state contract — DB states vs code states
// ---------------------------------------------------------------------------

describe('enrollment state contract', () => {
  it('DB-valid states used in proxy.ts access check match known valid states', () => {
    // These are the states from migration 20260501000010 that mean "enrolled and active"
    const DB_ACTIVE_STATES = ['active', 'enrolled'];
    const proxySrc = read('proxy.ts');
    for (const state of DB_ACTIVE_STATES) {
      expect(proxySrc).toContain(`'${state}'`);
    }
  });

  it('DB-valid terminal states are all handled in proxy.ts', () => {
    const DB_TERMINAL_STATES = [
      'suspended', 'revoked', 'withdrawn', 'completed',
      'graduated', 'placed', 'follow_up_6mo', 'follow_up_12mo',
    ];
    const proxySrc = read('proxy.ts');
    for (const state of DB_TERMINAL_STATES) {
      expect(proxySrc, `terminal state '${state}' not handled in proxy.ts`).toContain(`'${state}'`);
    }
  });
});
