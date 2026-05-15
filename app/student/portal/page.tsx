import { permanentRedirect } from 'next/navigation';

export default function StudentPortalPage() {
  permanentRedirect('/learner/dashboard');
}
