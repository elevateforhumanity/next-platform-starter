import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Upload Document | Program Holder Portal',
  description: 'Upload a new document',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/documents/upload',
  },
};

// Program holder document types — document_requirements table is program-scoped (no role column).
const PROGRAM_HOLDER_REQUIREMENTS = [
  {
    id: 'business_license',
    document_type: 'business_license',
    description: 'Business License',
    instructions: 'Upload your current business license or registration.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'shop_license',
    document_type: 'shop_license',
    description: 'Shop / Facility License',
    instructions: 'Upload your current shop or facility operating license.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'ein_verification',
    document_type: 'ein_verification',
    description: 'EIN Verification (IRS Letter 147C or SS-4)',
    instructions: 'Upload your IRS EIN confirmation letter.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'employer_mou',
    document_type: 'employer_mou',
    description: 'Signed Memorandum of Understanding',
    instructions: 'Upload the signed MOU between your program and Elevate for Humanity.',
    accepted_formats: ['pdf'],
    max_file_size: 10485760,
  },
  {
    id: 'supervisor_designation',
    document_type: 'supervisor_designation',
    description: 'Journeyworker / Supervisor Designation',
    instructions: 'Upload documentation designating your qualified journeyworker supervisor.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'ipla_packet',
    document_type: 'ipla_packet',
    description: 'IPLA Licensing Packet',
    instructions: 'Upload your Indiana Professional Licensing Agency packet.',
    accepted_formats: ['pdf'],
    max_file_size: 10485760,
  },
];

export default async function UploadDocumentPage() {
  await requireProgramHolder();

  const requirements = PROGRAM_HOLDER_REQUIREMENTS;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Program Holder', href: '/program-holder' }, { label: 'Documents' }]}
        />
      </div>
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
