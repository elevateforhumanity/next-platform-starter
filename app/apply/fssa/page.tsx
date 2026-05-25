/**
 * FSSA IMPACT application — archived.
 *
 * FSSA-funded enrollment is handled through WorkOne case managers.
 * Direct online applications are not accepted. Students with FSSA/TANF
 * benefits should contact their case manager or join the waitlist.
 */
import { redirect } from 'next/navigation';

export default function FssaApplyPage() {
  // Redirect to the FSSA waitlist — case managers will follow up directly.
  redirect('/apply/fssa/waitlist');
}
