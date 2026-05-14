import { permanentRedirect } from 'next/navigation';

export default function StudentPortalLegacyPage() {
  permanentRedirect('/learner/dashboard');
}
