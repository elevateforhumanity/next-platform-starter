import { permanentRedirect } from 'next/navigation';

export default function StudentPortalSettingsPage() {
  permanentRedirect('/lms/settings');
}
