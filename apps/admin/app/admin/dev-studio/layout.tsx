// Full-bleed layout for Dev Studio.
//
// The admin layout wraps all pages in <main className="pt-16"> which is an
// unconstrained block. Using position: fixed lets the studio own the viewport
// from the nav baseline down without overlapping the admin nav.
export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="dev-studio-shell-route"
      style={{
        position: 'fixed',
        inset: 0,
        top: 64,
        height: 'calc(100dvh - 64px)',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <style>{`
        .dev-studio-shell-route,
        .dev-studio-shell-route * {
          box-sizing: border-box;
        }

        .dev-studio-shell-route {
          max-width: 100vw;
          overscroll-behavior: contain;
        }

        .dev-studio-shell-route iframe[title='Live Preview'],
        .dev-studio-shell-route iframe[title='Preview'] {
          display: block;
          max-width: 100%;
          min-width: 0;
        }
      `}</style>
      {children}
    </div>
  );
}
