export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[calc(100vh-4rem)] min-h-[480px] overflow-hidden">{children}</div>;
}
