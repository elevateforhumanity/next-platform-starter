import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { DocumentCenterClient } from './DocumentCenterClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Document Center | Elevate Admin',
};

export default async function DocumentCenterPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, file_name, file_path, file_url, mime_type, file_size_bytes, document_type, status, created_at, uploaded_by')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100);

  return <DocumentCenterClient initialDocuments={documents ?? []} fetchError={error?.message ?? null} />;
}
