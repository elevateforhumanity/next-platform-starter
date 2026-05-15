import { permanentRedirect } from 'next/navigation';

export default function StudentResourcesPage() {
  permanentRedirect('/lms/resources');
}
