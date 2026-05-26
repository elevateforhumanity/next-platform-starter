import { redirect } from 'next/navigation';

// Video management is now the Studio media panel.
// /admin/video-manager → /admin/studio
export default function VideoManagerPage() {
  redirect('/admin/studio');
}
