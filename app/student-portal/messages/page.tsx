import { permanentRedirect } from 'next/navigation';

export default function StudentPortalMessagesPage() {
  permanentRedirect('/lms/messages');
}
