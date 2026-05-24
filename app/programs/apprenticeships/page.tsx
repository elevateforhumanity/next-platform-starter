// Canonical apprenticeships page is /apprenticeships.
// This route exists for backward compatibility — redirect permanently.
import { redirect } from 'next/navigation';

export default function ApprenticeshipsProgramsRedirect() {
  redirect('/apprenticeships');
}
