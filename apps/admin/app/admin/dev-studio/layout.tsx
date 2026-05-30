// Full-bleed layout for Dev Studio.
//
// The admin layout wraps all pages in <main class="pt-16"> which is an
// unconstrained block - height:100% on children resolves to nothing.
// Using position:fixed escapes the layout flow entirely so the studio
// can own the full viewport from the nav baseline (top:64px) down.
import DevStudioCourseDock from './DevStudioCourseDock';

export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="dev-studio-shell-route"
      style={{
        position: 'fixed',
        inset: 0,
        top: 64, // nav height - sit flush below the AdminNav bar
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
      <DevStudioCourseDock />
    </div>
  );
}
