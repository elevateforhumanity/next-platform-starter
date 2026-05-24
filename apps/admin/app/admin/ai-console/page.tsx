import { redirect } from 'next/navigation';

// /admin/ai-console → /admin/ai-studio (canonical AI section)
export default function AiConsolePage() {
  redirect('/admin/ai-studio');
}
