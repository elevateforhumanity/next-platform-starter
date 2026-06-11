export const dynamic = 'force-dynamic';

export default async function DevStudioLayout({ children }: { children: React.ReactNode }) {
  // Auth is handled by the parent /admin/layout.tsx — no extra role gate needed.
  return <div className="h-[calc(100vh-4rem)] min-h-[480px] overflow-hidden">{children}</div>;
}
