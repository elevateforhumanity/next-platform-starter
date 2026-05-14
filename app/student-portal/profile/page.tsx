import { permanentRedirect } from 'next/navigation';

export default function StudentPortalProfilePage() {
  permanentRedirect('/lms/profile');
}
