import { redirect } from 'next/navigation';

// Redirect /apply/impact to the canonical FSSA application page.
export default function ApplyImpactRedirect() {
  redirect('/apply/fssa');
}
