import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// TEMPORARY diagnostic endpoint — remove after confirming admin role
// PUBLIC ROUTE: read-only role lookup for debugging, no sensitive data exposed
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 });

  const supabase = getAdminClient();

  // Look up auth user by email
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const user = authData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) return NextResponse.json({ found: false, email });

  // Look up profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    auth_user_id: user.id,
    auth_email: user.email,
    email_confirmed: !!user.email_confirmed_at,
    profile,
  });
}
