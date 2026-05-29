import { redirect } from 'next/navigation';

// AI Console consolidated into Dev Studio → Chat tab
export default function AiConsolePage() {
  redirect('/admin/dev-studio?tab=chat');
}
