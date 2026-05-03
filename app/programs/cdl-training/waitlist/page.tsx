// CDL is now open for enrollment — redirect waitlist URL to apply page
import { redirect } from 'next/navigation';

export default function CDLWaitlistRedirect() {
  redirect('/programs/cdl-training/apply');
}
