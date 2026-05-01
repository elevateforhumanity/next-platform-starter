import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProgramInquiryRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/inquiry?program=${slug}`);
}
