// RLS-safe admin login — uses service role key to read profiles table.
// Deployed: 2026-05-23
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';

const ADMIN_ROLES = ['super_admin', 'admin', 'staff'];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  const cookieStore = await cookies();

  // Sign in with the anon key — this sets the session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

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
