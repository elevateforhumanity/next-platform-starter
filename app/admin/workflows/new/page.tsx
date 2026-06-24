import { redirect } from 'next/navigation';

// Redirect to Dev Studio workflows (canonical location)
export default function Page() {
  redirect('/admin/studio/workflows');
}
