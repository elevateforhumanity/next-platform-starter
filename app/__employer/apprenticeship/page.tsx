
export const revalidate = 3600;

import { redirect } from 'next/navigation';

export default function EmployerApprenticeshipPage() {
  redirect('/employer/dashboard');
}
