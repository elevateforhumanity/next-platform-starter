import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page({
  searchParams,
}: {
  searchParams?: { payment?: string };
}) {
  const payment = searchParams?.payment?.trim();
  const destination = payment
    ? `/apply?program=barber-apprenticeship&payment=${encodeURIComponent(payment)}`
    : '/apply?program=barber-apprenticeship';
  permanentRedirect(destination);
}
