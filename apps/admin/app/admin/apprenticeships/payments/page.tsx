import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ApprenticePaymentsClient from './ApprenticePaymentsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprentice Payments | Admin | Elevate For Humanity',
};

export default async function ApprenticePaymentsPage() {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Apprenticeships', href: '/admin/apprenticeships' },
            { label: 'Payments' },
          ]}
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ApprenticePaymentsClient />
      </div>
    </div>
  );
}
