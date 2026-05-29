import { redirect } from 'next/navigation';

// AI Studio tools are consolidated into Dev Studio
export default function AiStudioPage() {
  redirect('/admin/dev-studio');
}
