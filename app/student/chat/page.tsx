import { permanentRedirect } from 'next/navigation';

export default function StudentChatPage() {
  permanentRedirect('/lms/chat');
}
