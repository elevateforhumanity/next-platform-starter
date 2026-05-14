import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Canonical certificate verification is at /verify/[certificateId]
export default async function Page({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  permanentRedirect(`/verify/${certificateId}`);
}
