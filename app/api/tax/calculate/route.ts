// PUBLIC ROUTE: tax calculation — stateless, no auth required
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

// 2024 tax brackets (MFJ, Single, HOH, MFS)
const BRACKETS: Record<string, [number, number][]> = {
  single:              [[11600,0.10],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[609350,0.35],[Infinity,0.37]],
  married_filing_jointly: [[23200,0.10],[94300,0.12],[201050,0.22],[383900,0.24],[487450,0.32],[731200,0.35],[Infinity,0.37]],
  married_filing_separately: [[11600,0.10],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[365600,0.35],[Infinity,0.37]],
  head_of_household:   [[16550,0.10],[63100,0.12],[100500,0.22],[191950,0.24],[243700,0.32],[609350,0.35],[Infinity,0.37]],
};

const STANDARD_DEDUCTIONS: Record<string, number> = {
  single: 14600, married_filing_jointly: 29200,
  married_filing_separately: 14600, head_of_household: 21900,
};

function calcTax(taxableIncome: number, status: string): number {
  const brackets = BRACKETS[status] ?? BRACKETS.single;
  let tax = 0, prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, limit) - prev) * rate;
    prev = limit;
  }
  return Math.round(tax);
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;

  try {
    const { w2s, filing_status, additional_income = 0, deductions = 0 } = await request.json();

    if (!Array.isArray(w2s) || !filing_status) {
      return safeError('w2s array and filing_status are required', 400);
    }

    const grossIncome = w2s.reduce((sum: number, w: any) => sum + (Number(w.wages) || 0), 0) + Number(additional_income);
    const withheld = w2s.reduce((sum: number, w: any) => sum + (Number(w.federal_withheld) || 0), 0);
    const standardDeduction = STANDARD_DEDUCTIONS[filing_status] ?? 14600;
    const itemizedDeduction = Number(deductions);
    const deductionUsed = Math.max(standardDeduction, itemizedDeduction);
    const taxableIncome = Math.max(0, grossIncome - deductionUsed);
    const taxLiability = calcTax(taxableIncome, filing_status);
    const refundOrOwed = withheld - taxLiability;

    return NextResponse.json({
      gross_income: grossIncome,
      standard_deduction: standardDeduction,
      itemized_deduction: itemizedDeduction,
      deduction_used: deductionUsed,
      taxable_income: taxableIncome,
      tax_liability: taxLiability,
      withheld,
      refund: refundOrOwed > 0 ? refundOrOwed : 0,
      owed: refundOrOwed < 0 ? Math.abs(refundOrOwed) : 0,
      effective_rate: grossIncome > 0 ? ((taxLiability / grossIncome) * 100).toFixed(1) : '0.0',
    });
  } catch (err) {
    return safeInternalError(err, 'Calculation failed');
  }
}
