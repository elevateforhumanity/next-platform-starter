// Consolidated: /admin/document-center → /admin/documents
import { permanentRedirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function Page() {
  permanentRedirect('/admin/documents');
}
