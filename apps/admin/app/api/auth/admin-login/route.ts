// RLS-safe admin login — uses service role key to read profiles table.
// Uses the shared createClient() from lib/supabase/server.ts so the session
// cookie domain matches what the admin layout expects (avoids stale-cookie
// redirect loops on admin.elevateforhumanity.org).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

// Must match ADMIN_ROLES in lib/rbac/role-matrix.ts and apps/admin/app/admin/layout.tsx
const ADMIN_ROLES = ['super_admin', 'admin', 'staff', 'org_admin'];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  // Use the shared server client — applies the same cookie domain (.elevateforhumanity.org)
  // as the admin layout, preventing stale-cookie redirect loops after login.
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password, // never trim passwords — leading/trailing spaces are valid
  });

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: authError?.message || 'Invalid email or password.' },
      { status: 401 }
    );
  }

  // Use service role key to read profile — bypasses RLS entirely
  const db = await requireAdminClient();
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: `Profile load failed: ${profileError.message}. Contact support.` },
      { status: 500 }
    );
  }

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'No profile found for your account. Contact support.' },
      { status: 403 }
    );
  }

  if (!ADMIN_ROLES.includes(profile.role)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'You do not have permission to access the admin portal.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, role: profile.role });
}
