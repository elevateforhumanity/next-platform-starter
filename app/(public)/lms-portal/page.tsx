import { permanentRedirect } from 'next/navigation';

export default function LmsPortalPage() {
  permanentRedirect('/lms/dashboard');
}
