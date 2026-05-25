import { redirect } from 'next/navigation';

/**
 * QMA (Qualified Medication Aide) application.
 * Routes through the standard intake form with program pre-selected.
 */
export default function QmaApplyPage() {
  redirect('/apply?program=qma&program_name=Qualified+Medication+Aide');
}
