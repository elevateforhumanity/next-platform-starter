import { redirect } from 'next/navigation';

// The host salon application form lives at cosmetology-partner-shop/apply.
// This route is the canonical public-facing URL — redirect to the form.
export default function CosmetologyApprenticeshipApplyRedirect() {
  redirect('/partners/cosmetology-partner-shop/apply');
}
