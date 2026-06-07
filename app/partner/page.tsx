import { redirect } from 'next/navigation';

/** Partner root — canonical portal is /partner/dashboard (onboarding gates live there). */
export default function PartnerRootPage() {
  redirect('/partner/dashboard');
}
