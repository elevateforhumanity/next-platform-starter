import { permanentRedirect } from 'next/navigation';

export default function StudentPortalHoursPage() {
  permanentRedirect('/lms/attendance');
}
