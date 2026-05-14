import { permanentRedirect } from 'next/navigation';

export default function StudentPortalDashboardPage() {
  permanentRedirect('/learner/dashboard');
}
