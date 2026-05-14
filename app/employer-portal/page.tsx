import { permanentRedirect } from 'next/navigation';

export default function EmployerPortalLegacyPage() {
  permanentRedirect('/employer/dashboard');
}
