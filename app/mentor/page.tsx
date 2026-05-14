import { permanentRedirect } from 'next/navigation';

export default function MentorRootPage() {
  permanentRedirect('/mentor/dashboard');
}
