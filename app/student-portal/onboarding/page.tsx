import { permanentRedirect } from 'next/navigation';

export default function StudentPortalOnboardingPage() {
  permanentRedirect('/lms/orientation');
}
