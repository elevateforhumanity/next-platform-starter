import { permanentRedirect } from 'next/navigation';

export default function StudentCertificationsPage() {
  permanentRedirect('/lms/certificates');
}
