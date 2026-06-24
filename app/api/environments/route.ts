import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole('operator');

    const supabase = await createClient();

    // Try to fetch from database
    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      // Return empty array if table doesn't exist or no data
      return NextResponse.json([]);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to fetch environments:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin');

    const { name, type, url } = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('environments')
      .insert({
        id: crypto.randomUUID(),
        name,
        type: type || 'development',
        url,
        status: 'running',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Failed to create environment:', error);
    return NextResponse.json(
      { error: 'Failed to create environment' },
      { status: 500 }
    );
  }
}
