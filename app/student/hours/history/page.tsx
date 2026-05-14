import { permanentRedirect } from 'next/navigation';

export default function StudentHoursHistoryPage() {
  permanentRedirect('/lms/attendance');
}
