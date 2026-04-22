import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'auth');
  if (limited) return limited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Authentication required', 401);

    const body = await request.json();
    const { w2s, filing_status, additional_income, deductions, calculation } = body;

    if (!w2s || !filing_status || !calculation) {
      return safeError('w2s, filing_status, and calculation are required', 400);
    }

    const db = getAdminClient();
    const { data, error } = await db.from('tax_returns').insert({
      user_id: user.id,
      tax_year: new Date().getFullYear() - 1,
      filing_status,
      gross_income: calculation.gross_income,
      taxable_income: calculation.taxable_income,
      tax_liability: calculation.tax_liability,
      refund_amount: calculation.refund,
      amount_owed: calculation.owed,
      w2_data: w2s,
      additional_income: additional_income ?? 0,
      deductions: deductions ?? 0,
      status: 'draft',
      service_type: 'self_prepared',
    }).select('id').single();

    if (error) return safeError('Failed to save return', 500);

    return NextResponse.json({ success: true, return_id: data.id });
  } catch (err) {
    return safeInternalError(err, 'Submission failed');
  }
}
