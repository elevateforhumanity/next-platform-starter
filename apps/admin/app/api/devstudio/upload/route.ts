/**
 * POST /api/devstudio/upload
 *
 * Accepts a multipart file upload from the Dev Studio Documents tab.
 * Stores the file in S3/R2 under devstudio-docs/{userId}/{timestamp}-{filename}
 * and records metadata in the devstudio_documents table.
 *
 * Returns: { id, key, url, name, size, type, created_at }
 *
 * Admin-only. Max 50 MB. Allowed types: PDF, DOCX, PNG, JPG, JPEG, XLSX, CSV.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf':                                                          'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword':                                                       'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       'xlsx',
  'text/csv':                                                                 'csv',
  'image/png':                                                                'png',
  'image/jpeg':                                                               'jpg',
  'image/jpg':                                                                'jpg',
};

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function getS3(): S3Client {
  return new S3Client({
    endpoint: process.env.R2_ENDPOINT || undefined,
    region:   process.env.AWS_REGION  || 'us-east-1',
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY     || process.env.AWS_ACCESS_KEY_ID     || '',
      secretAccessKey: process.env.R2_SECRET_KEY     || process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: !!process.env.R2_ENDPOINT,
  });
}

const BUCKET = process.env.R2_BUCKET || process.env.AWS_S3_BUCKET || 'elevate-media';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Get current user id for path namespacing
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const label = (formData.get('label') as string | null) ?? '';

    if (!file) return safeError('No file provided', 400);
    if (file.size > MAX_BYTES) return safeError('File exceeds 50 MB limit', 413);

    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_TYPES[contentType]) {
      return safeError(`File type not allowed: ${contentType}. Allowed: PDF, DOCX, XLSX, CSV, PNG, JPG`, 415);
    }

    const ext       = ALLOWED_TYPES[contentType];
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const timestamp = Date.now();
    const key       = `devstudio-docs/${user.id}/${timestamp}-${safeName}`;

    // Upload to S3/R2
    const bytes = new Uint8Array(await file.arrayBuffer());
    const s3    = getS3();
    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        bytes,
      ContentType: contentType,
      Metadata: {
        'uploaded-by': user.id,
        'original-name': file.name,
        'label': label,
      },
    }));

    // Generate a 7-day signed download URL
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key:    key,
        ResponseContentDisposition: `attachment; filename="${safeName}"`,
      }),
      { expiresIn: 7 * 24 * 3600 },
    );

    // Record in DB
    const db = await requireAdminClient();
    const { data: doc, error: dbErr } = await db
      .from('devstudio_documents')
      .insert({
        user_id:      user.id,
        name:         label || file.name,
        original_name: file.name,
        s3_key:       key,
        bucket:       BUCKET,
        size_bytes:   file.size,
        content_type: contentType,
        ext,
        signed_url:   signedUrl,
        signed_url_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .select('id, name, s3_key, size_bytes, content_type, created_at')
      .single();

    if (dbErr) {
      // Table may not exist yet — return success without DB record
      if (dbErr.code === '42P01') {
        return NextResponse.json({ id: `temp-${timestamp}`, key, url: signedUrl, name: label || file.name, size: file.size, type: contentType, created_at: new Date().toISOString() });
      }
      return safeError('File uploaded but failed to record metadata', 500);
    }

    return NextResponse.json({ ...doc, url: signedUrl });
  } catch (err) {
    return safeInternalError(err, 'Upload failed');
  }
}

// ── GET — list documents for current user ─────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('devstudio_documents')
      .select('id, name, original_name, s3_key, size_bytes, content_type, ext, signed_url, signed_url_expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ documents: [] });
      return safeError('Failed to fetch documents', 500);
    }

    return NextResponse.json({ documents: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch documents');
  }
}
