import { permanentRedirect } from 'next/navigation';

export default function ProgramsAdminPage() {
  permanentRedirect('/program-holder/dashboard');
}
