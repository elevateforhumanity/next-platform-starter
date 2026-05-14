import { permanentRedirect } from 'next/navigation';

export default function StudentProgressPage() {
  permanentRedirect('/lms/progress');
}
