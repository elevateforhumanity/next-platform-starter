export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeInternalError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    message: 'Use POST to test insert',
    example: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '3175551234',
      program: 'barber',
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const db = await requireAdminClient();

    const { data, error }: any = await db
      .from('applications')
      .insert({
        first_name: body.firstName || 'Test',
        last_name: body.lastName || 'User',
        phone: body.phone || '3175551234',
        email: body.email || 'test@example.com',
        program_id: body.program || 'test-program',
        notes: 'Test insert from diagnostic endpoint',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: { code: (error as any)?.code || 'UNKNOWN', hint: error.hint },
      });
    }

    await db.from('applications').delete().eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'Insert test successful (record deleted)',
      insertedId: data.id,
    });
  } catch (error) {
    return safeInternalError(error, 'Insert test failed');
  }
}
