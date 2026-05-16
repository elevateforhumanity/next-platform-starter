// Full-bleed layout for Dev Studio — cancels the pt-16 added by the admin
// layout's <main> so the studio can manage its own height from the nav baseline.
export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mt-16 overflow-hidden" style={{ height: '100dvh' }}>
      {children}
    </div>
  );
}
