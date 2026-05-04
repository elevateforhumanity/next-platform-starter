import { redirect } from 'next/navigation';

// Legacy slug — canonical page is /programs/cna
export default function Page() {
  redirect('/programs/cna');
}
