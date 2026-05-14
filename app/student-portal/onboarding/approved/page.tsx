import { permanentRedirect } from 'next/navigation';

export default function StudentPortalOnboardingApprovedPage() {
  permanentRedirect('/learner/dashboard');
}
