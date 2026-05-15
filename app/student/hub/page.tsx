import { permanentRedirect } from 'next/navigation';

export default function StudentHubPage() {
  permanentRedirect('/learner/dashboard');
}
