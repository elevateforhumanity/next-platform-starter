import { permanentRedirect } from 'next/navigation';

export default function StudentHoursPage() {
  permanentRedirect('/lms/attendance');
}
