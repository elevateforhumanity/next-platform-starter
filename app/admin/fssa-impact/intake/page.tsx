import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ParticipantIntakeForm from '@/components/admin/fssa/ParticipantIntakeForm';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Participant Intake | FSSA SNAP E&T | Admin',
};

export default async function FssaIntakePage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
              { label: 'New Intake' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/fssa-impact"
            className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">New Participant Intake</h1>
            <p className="text-sm text-slate-500">FSSA SNAP E&T — Indiana IMPACT Program</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <ParticipantIntakeForm
            onSuccess={(id) => {
              // Client-side redirect handled by the form component
            }}
          />
        </div>
      </div>
    </div>
  );
}
