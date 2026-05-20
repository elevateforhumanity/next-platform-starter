import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upload Document | Employer Portal',
  description: 'Upload a new document',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employer/documents/upload',
  },
};

export default async function UploadDocumentPage() {
  const { user } = await requireRole(['employer', 'admin', 'super_admin']);
  const supabase = await createClient();

  const { data: requirements } = await supabase
    .from('document_requirements')
    .select('*')
    .eq('role', 'employer');

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">Upload Document</h1>
          <p className="text-lg text-black">Upload a required document to complete your profile</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <DocumentUploadForm requirements={requirements || []} />
      </div>
    </div>
  );
}
