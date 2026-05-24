import { redirect } from 'next/navigation';

// /admin/ai-studio → /admin/dev-studio?tab=ellie
// Ellie (AI Operations Assistant) is now integrated into Dev Studio.
export default function AiStudioPage() {
  redirect('/admin/dev-studio?tab=ellie');
}
