import { redirect } from 'next/navigation';

// /financial-aid is deprecated — canonical path is /funding
export default function FinancialAidRedirect() {
  redirect('/funding');
}
