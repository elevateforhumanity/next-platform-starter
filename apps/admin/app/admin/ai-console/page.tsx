import { redirect } from 'next/navigation';

// /admin/ai-console → /admin/dev-studio?tab=ellie (Ellie lives in Dev Studio)
export default function AiConsolePage() {
  redirect('/admin/dev-studio?tab=ellie');
}
