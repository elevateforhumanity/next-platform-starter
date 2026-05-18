import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  robots: { index: false, follow: false },
};

export default async function ProgramInquiryRedirect({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: slug } = await params;
  permanentRedirect(`/inquiry?program=${slug}`);
}
