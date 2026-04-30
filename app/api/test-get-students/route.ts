import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const supabase = await createClient();

    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'student')
      .limit(20)
      .order('created_at', { ascending: false });

    if (error) {
      // Error: $1
      return NextResponse.json({ students: [] });
    }

    return NextResponse.json({ students: students || [] });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return NextResponse.json({ students: [] });
  }
}
