import { redirect } from 'next/navigation';

// VITA tax intake consolidated into admin dashboard.
export default function TaxIntakePage() {
  redirect('/admin/dashboard');
}
