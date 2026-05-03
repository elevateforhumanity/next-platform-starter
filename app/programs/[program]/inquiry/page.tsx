import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ program: string }>;
}

export default async function ProgramInquiryRedirect({ params }: Props) {
  const { program: slug } = await params;
  redirect(`/inquiry?program=${slug}`);
}
