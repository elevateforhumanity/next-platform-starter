import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function BarbershopApprenticeshipApplyRedirect() {
  redirect('/partners/barber-host-shop/apply');
}
