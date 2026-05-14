import { permanentRedirect } from 'next/navigation';

export default function StudentPortalOnboardingDocumentsPage() {
  permanentRedirect('/lms/orientation');
}
