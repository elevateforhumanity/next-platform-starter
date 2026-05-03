// PUBLIC ROUTE: Generates FSSA TPP survey PDF — no auth required.
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { generateTppSurveyPdf } from '@/lib/documents/generate-tpp-survey-pdf';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body?.org_name) return safeError('org_name is required', 400);

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateTppSurveyPdf(body);
  } catch (err) {
    return safeInternalError(err, 'PDF generation failed');
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Elevate-FSSA-TPP-Survey.pdf"',
      'Content-Length': String(pdfBytes.length),
    },
  });
}
