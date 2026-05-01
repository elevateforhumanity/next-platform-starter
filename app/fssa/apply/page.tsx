import { redirect } from 'next/navigation';

// Redirect legacy /fssa/apply path to the canonical application page.
export default function FssaApplyRedirect() {
  redirect('/apply/fssa');
}
