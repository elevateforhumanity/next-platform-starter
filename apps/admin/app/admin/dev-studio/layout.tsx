import { redirect } from 'next/navigation';
import { requirePlatformOperatorContext } from '@/lib/platform/platform-owner';

export default async function DevStudioLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePlatformOperatorContext();
  if (!ctx) {
    redirect('/unauthorized?reason=platform_operator');
  }

  return <div className="h-[calc(100vh-4rem)] min-h-[480px] overflow-hidden">{children}</div>;
}
