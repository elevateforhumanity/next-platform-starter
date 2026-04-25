import { requireAdmin } from '@/lib/auth';
import PageClient from './PageClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  return <PageClient />;
}
