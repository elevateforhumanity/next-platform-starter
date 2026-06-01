export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import BarberApplyClient from '../BarberApplyClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Barber Apprentice Application',
  description:
    `Apply to enroll in the ${PLATFORM_DEFAULTS.orgName} DOL-registered barber apprenticeship program.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply/apprentice',
  },
};

export default function BarberApprenticeApplyPage() {
  return <BarberApplyClient />;
}
