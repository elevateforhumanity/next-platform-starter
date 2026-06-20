import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';

/** Only bucket admin document access is allowed to sign from */
const DOCUMENT_BUCKET = 'documents';

/**
 * Single authorized path for admin document access.
 * Generates a short-lived signed URL and logs the access to the audit trail.
 *
 * When documentId is provided, ALL metadata (filePath, owner, type) is
 * resolved from the database. Caller-supplied values are ignored to prevent
 * audit records that don't match reality.
 *
 * All admin document access MUST go through this function or the
 * /api/admin/documents/signed-url endpoint (which calls this function).
 * Direct createSignedUrl calls in admin pages are prohibited (enforced by CI).
 */
export async function getAdminDocumentUrl(params: {
  adminId: string;
  documentId: string;
  context?: string;
}): Promise<string | null> {
  const { adminId, documentId, context } = params;

  const db = await requireAdminClient();
  if (!db) return null;
  await setAuditContext(db, { actorUserId: adminId, systemActor: 'admin_document_access' });

  if (!documentId) return null;

  // DB is the sole source of truth for document metadata
  const { data: doc } = await db
    .from('documents')
    .select('file_path, user_id, document_type')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc?.file_path) return null;

  // Generate short-lived signed URL (60s)
  const { data, error } = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.file_path, 60);

  if (error || !data?.signedUrl) return null;

  // Log access to immutable audit trail
  // created_at is omitted — DB default now() is the authoritative timestamp
  await db
    .from('admin_audit_events')
    .insert({
      actor_user_id: adminId,
      action: 'DOCUMENT_URL_ISSUED',
      target_type: 'document',
      target_id: documentId,
      metadata: {
        document_owner_id: doc.user_id,
        document_type: doc.document_type,
        context: context || 'server_render',
      },
    })
    .catch((err: Error) => {
      logger.warn('[DocumentAccess] Audit log failed', { error: err.message });
    });

  return data.signedUrl;
}

/**
 * Batch version: get signed URLs for multiple documents.
 * All metadata is resolved from DB to maintain audit integrity.
 */
export async function getAdminDocumentUrls(params: {
  adminId: string;
  documentIds: string[];
  context?: string;
}): Promise<Record<string, string | null>> {
  const { adminId, documentIds, context } = params;

  if (!documentIds.length) return {};

  const db = await requireAdminClient();
  if (!db) return {};

  const results: Record<string, string | null> = {};

  // Fetch all document metadata in one query
  const { data: docs } = await db
    .from('documents')
    .select('id, file_path, user_id, document_type')
    .in('id', documentIds);

  if (!docs?.length) return {};

  // Generate signed URLs
  await Promise.all(
    docs.map(async (doc) => {
      if (!doc.file_path) {
        results[doc.id] = null;
        return;
      }

      const { data, error } = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.file_path, 60);

      if (error || !data?.signedUrl) {
        results[doc.id] = null;
        return;
      }

      results[doc.id] = data.signedUrl;

      // Log access
      await db
        .from('admin_audit_events')
        .insert({
          actor_user_id: adminId,
          action: 'DOCUMENT_URL_ISSUED',
          target_type: 'document',
          target_id: doc.id,
          metadata: {
            document_owner_id: doc.user_id,
            document_type: doc.document_type,
            context: context || 'server_render_batch',
          },
        })
        .catch((err: Error) => {
          logger.warn('[DocumentAccess] Audit log failed', { error: err.message });
        });
    })
  );

  return results;
}

/**
 * Generate signed URLs for document file paths (without requiring document IDs).
 * This is used when we have file paths from other sources (e.g., contracts, enrollment docs).
 * Each access is logged to the audit trail.
 */
export async function getAdminDocumentUrlByPath(params: {
  adminId: string;
  filePaths: Array<{ bucket: string; path: string; documentId?: string }>;
  context?: string;
}): Promise<Record<string, string | null>> {
  const { adminId, filePaths, context } = params;

  if (!filePaths.length) return {};

  const db = await requireAdminClient();
  if (!db) return {};

  const results: Record<string, string | null> = {};

  await Promise.all(
    filePaths.map(async ({ bucket, path, documentId }) => {
      const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 60);

      if (error || !data?.signedUrl) {
        results[path] = null;
        return;
      }

      results[path] = data.signedUrl;

      // Log access
      await db
        .from('admin_audit_events')
        .insert({
          actor_user_id: adminId,
          action: 'DOCUMENT_URL_ISSUED',
          target_type: 'document',
          target_id: documentId || path,
          metadata: {
            storage_bucket: bucket,
            file_path: path,
            context: context || 'server_render_path_based',
          },
        })
        .catch((err: Error) => {
          logger.warn('[DocumentAccess] Audit log failed', { error: err.message });
        });
    })
  );

  return results;
}
