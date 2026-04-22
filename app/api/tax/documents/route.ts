// PUBLIC ROUTE: tax document upload — identified by email, no auth required
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const email = form.get('email') as string | null;
    const documentType = form.get('document_type') as string | null;

    if (!file || !email || !documentType) {
      return safeError('file, email, and document_type are required', 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return safeError('File exceeds 10MB limit', 400);
    }

    const db = getAdminClient();
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `tax-documents/${email.replace('@', '_at_')}/${documentType}-${Date.now()}.${ext}`;

    const { error: storageError } = await db.storage
      .from('documents')
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) return safeError('Storage upload failed', 500);

    // Record in tax_documents table
    const { error: dbError } = await db.from('tax_documents').insert({
      email,
      document_type: documentType,
      file_name: file.name,
      storage_path: path,
      file_size: file.size,
      status: 'pending_review',
    });

    if (dbError) {
      // Storage succeeded but DB record failed — log but don't fail the user
      console.error('tax_documents insert failed:', dbError.message);
    }

    return NextResponse.json({ success: true, path });
  } catch (err) {
    return safeInternalError(err, 'Document upload failed');
  }
}
