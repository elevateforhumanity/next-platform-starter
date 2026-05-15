import { permanentRedirect } from 'next/navigation';

export default function StudentCertificatesPage() {
  permanentRedirect('/lms/certificates');
}
