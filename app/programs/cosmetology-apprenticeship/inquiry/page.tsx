import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function CosmetologyInquiryRedirect() {
  redirect('/contact?program=cosmetology-apprenticeship');
}
