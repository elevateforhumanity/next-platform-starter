import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function BecomeHostShopPage() {
  redirect('/barber-host-shop');
}