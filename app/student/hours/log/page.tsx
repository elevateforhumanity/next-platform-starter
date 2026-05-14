import { permanentRedirect } from 'next/navigation';

export default function StudentHoursLogPage() {
  permanentRedirect('/lms/attendance');
}
