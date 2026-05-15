import { permanentRedirect } from 'next/navigation';

export default function StudentDashboardPage() {
  permanentRedirect('/learner/dashboard');
}
