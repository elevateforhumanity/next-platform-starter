// Full-bleed layout for Dev Studio.
//
// The admin layout wraps all pages in <main class="pt-16"> which is an
// unconstrained block — height:100% on children resolves to nothing.
// Using position:fixed escapes the layout flow entirely so the studio
// can own the full viewport from the nav baseline (top:64px) down.
export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        top: 64, // nav height — sit flush below the AdminNav bar
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}
