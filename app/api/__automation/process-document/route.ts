import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { autoExtract } from '@/lib/ocr/tesseract-ocr';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Field extraction heuristics ───────────────────────────────────────────────
function extractFields(text: string, documentType: string): Record<string, string | null> {
  const t = text.toUpperCase();
  const fields: Record<string, string | null> = {};

  const nameMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})/);
  if (nameMatch) fields.name = nameMatch[1];

  const dobMatch = t.match(/(?:DOB|DATE OF BIRTH|BIRTH DATE)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
  if (dobMatch) fields.date_of_birth = dobMatch[1];

  const expMatch = t.match(/(?:EXP(?:IRES)?|EXPIRATION)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
  if (expMatch) fields.expiration_date = expMatch[1];

  const issMatch = t.match(/(?:ISS(?:UED)?|ISSUE DATE)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
  if (issMatch) fields.issue_date = issMatch[1];

  const idMatch = t.match(/(?:DL|LIC(?:ENSE)?|ID)[:\s#]*([A-Z0-9]{6,12})\b/);
  if (idMatch) fields.id_number = idMatch[1];

  const stateMatch = t.match(/\b(ALABAMA|ALASKA|ARIZONA|ARKANSAS|CALIFORNIA|COLORADO|CONNECTICUT|DELAWARE|FLORIDA|GEORGIA|HAWAII|IDAHO|ILLINOIS|INDIANA|IOWA|KANSAS|KENTUCKY|LOUISIANA|MAINE|MARYLAND|MASSACHUSETTS|MICHIGAN|MINNESOTA|MISSISSIPPI|MISSOURI|MONTANA|NEBRASKA|NEVADA|NEW HAMPSHIRE|NEW JERSEY|NEW MEXICO|NEW YORK|NORTH CAROLINA|NORTH DAKOTA|OHIO|OKLAHOMA|OREGON|PENNSYLVANIA|RHODE ISLAND|SOUTH CAROLINA|SOUTH DAKOTA|TENNESSEE|TEXAS|UTAH|VERMONT|VIRGINIA|WASHINGTON|WEST VIRGINIA|WISCONSIN|WYOMING)\b/);
  if (stateMatch) fields.state = stateMatch[1];

  if (documentType === 'ssn_card' || documentType === 'social_security') {
    const ssnMatch = t.match(/\b(\d{3}[-\s]\d{2}[-\s]\d{4})\b/);
    if (ssnMatch) fields.ssn_last4 = ssnMatch[1].replace(/\D/g, '').slice(-4);
  }

  if (documentType === 'transcript' || documentType === 'diploma') {
    const gpaMatch = t.match(/(?:GPA|GRADE POINT)[:\s]*([0-9]\.[0-9]{1,2})/);
    if (gpaMatch) fields.gpa = gpaMatch[1];
    const degreeMatch = t.match(/(BACHELOR|MASTER|ASSOCIATE|DOCTORATE|CERTIFICATE|DIPLOMA)/);
    if (degreeMatch) fields.degree_type = degreeMatch[1];
  }

  if (documentType === 'w2' || documentType === '1099') {
    const einMatch = t.match(/\b(\d{2}-\d{7})\b/);
    if (einMatch) fields.ein = einMatch[1];
    const wagesMatch = t.match(/(?:WAGES|SALARY|COMPENSATION)[:\s$]*([0-9,]+\.[0-9]{2})/);
    if (wagesMatch) fields.wages = wagesMatch[1];
    const yearMatch = t.match(/\b(20\d{2})\b/);
    if (yearMatch) fields.tax_year = yearMatch[1];
  }

  if (documentType === 'insurance') {
    const policyMatch = t.match(/(?:POLICY|POLICY NO)[:\s#]*([A-Z0-9-]{6,20})/);
    if (policyMatch) fields.policy_number = policyMatch[1];
  }

  return fields;
}

// ── Main handler ──────────────────────────────────────────────────────────────
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const body = await request.json();
    const { document_id } = body;
    if (!document_id) return safeError('document_id required', 400);

    const db = await getAdminClient();

    const { data: doc, error: docError } = await db
      .from('documents')
      .select('id, document_type, file_url, file_path, mime_type, status')
      .eq('id', document_id)
      .maybeSingle();

    if (docError || !doc) return safeError('Document not found', 404);
    if (doc.status === 'processed') return safeError('Document already processed', 409);

    await db.from('documents').update({ status: 'processing' }).eq('id', document_id);

    // Resolve storage path — prefer file_path, fall back to deriving from URL
    const storagePath: string | null = doc.file_path ?? (() => {
      const url = doc.file_url ?? '';
      const marker = '/documents/';
      const idx = url.indexOf(marker);
      return idx !== -1 ? url.slice(idx + marker.length) : null;
    })();

    if (!storagePath) {
      await db.from('documents').update({ status: 'error' }).eq('id', document_id);
      return safeError('Cannot resolve file path for document', 422);
    }

    const { data: fileBlob, error: downloadError } = await db.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileBlob) {
      logger.error('[process-document] Storage download failed', { document_id, storagePath, error: downloadError });
      await db.from('documents').update({ status: 'error' }).eq('id', document_id);
      return safeError('Failed to download document from storage', 502);
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    // Run OCR / text extraction
    const ocrResult = await autoExtract(buffer, doc.mime_type ?? undefined);

    // Extract structured fields from raw text
    const extractedFields = extractFields(ocrResult.text, doc.document_type ?? '');

    // Low OCR confidence → route to human review instead of auto-processing
    const newStatus = ocrResult.confidence >= 30 || ocrResult.source === 'pdf-parse'
      ? 'processed'
      : 'pending_review';

    const { error: updateError } = await db
      .from('documents')
      .update({
        status: newStatus,
        ocr_text: ocrResult.text || null,
        ocr_confidence: ocrResult.confidence > 0 ? ocrResult.confidence / 100 : null,
        extracted_data: {
          fields: extractedFields,
          source: ocrResult.source,
          word_count: ocrResult.words.length,
          char_count: ocrResult.text.length,
        },
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('id', document_id);

    if (updateError) {
      logger.error('[process-document] DB update failed', { document_id, error: updateError });
      return safeDbError(updateError, 'Failed to save OCR results');
    }

    logger.info('[process-document] OCR complete', {
      document_id,
      source: ocrResult.source,
      confidence: ocrResult.confidence,
      chars: ocrResult.text.length,
      extracted_fields: Object.keys(extractedFields).filter(k => extractedFields[k] !== null),
      status: newStatus,
    });

    return NextResponse.json({
      success: true,
      document_id,
      status: newStatus,
      ocr: {
        source: ocrResult.source,
        confidence: ocrResult.confidence,
        char_count: ocrResult.text.length,
        extracted_fields: Object.keys(extractedFields).filter(k => extractedFields[k] !== null),
      },
    });
  } catch (error) {
    logger.error('[process-document] Unexpected error', error);
    return safeInternalError(error, 'Document processing failed');
  }
}

export const POST = withApiAudit('/api/automation/process-document', _POST);
