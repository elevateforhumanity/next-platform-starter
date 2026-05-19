import { permanentRedirect } from 'next/navigation';

// Legacy all-in-one onboarding — canonical flow is now the (onboarding) step group
export default function BarbershopOnboardingLegacyRedirect() {
  permanentRedirect('/partners/barbershop-apprenticeship/forms');
}
