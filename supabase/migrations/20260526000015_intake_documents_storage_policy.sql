-- Storage policy for unauthenticated intake document uploads.
--
-- The intake form at /apply is public (no auth required). Documents uploaded
-- via POST /api/intake/upload are stored under intake-documents/{ts}-{rand}/
-- in the 'documents' bucket using the service_role (admin) client, which
-- bypasses storage RLS. However, if the bucket does not exist yet the upload
-- fails with a 404. This migration ensures the bucket exists and adds an
-- explicit service_role policy so the intent is clear in the audit log.
--
-- MUST BE APPLIED MANUALLY via Supabase Dashboard → SQL Editor.
-- Storage policies require elevated permissions not available to the migration runner.

-- Ensure the documents bucket exists with the correct settings.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow service_role to insert into intake-documents/ prefix.
-- The upload route uses requireAdminClient() which runs as service_role.
-- This policy makes the permission explicit and auditable.
DROP POLICY IF EXISTS "Service role can upload intake documents" ON storage.objects;
CREATE POLICY "Service role can upload intake documents"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'intake-documents'
  );

-- Allow admins and staff to read intake documents for review.
DROP POLICY IF EXISTS "Admins can read intake documents" ON storage.objects;
CREATE POLICY "Admins can read intake documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'intake-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff', 'case_manager')
    )
  );

-- Service role can also read (for signed URL generation in admin review pages).
DROP POLICY IF EXISTS "Service role can read all documents" ON storage.objects;
CREATE POLICY "Service role can read all documents"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'documents');
