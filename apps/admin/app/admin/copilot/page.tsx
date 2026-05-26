import { redirect } from 'next/navigation';

// AI Copilot is now the Studio AI panel.
// /admin/copilot → /admin/studio
export default function CopilotPage() {
  redirect('/admin/studio');
}
