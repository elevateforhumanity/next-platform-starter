'use client';

import { useEffect } from 'react';

// Full-bleed layout for Dev Studio.
//
// The admin layout wraps children in a max-w-screen-2xl padded container.
// Dev Studio needs the full viewport. We use position:fixed to escape the
// container, and add a data attribute to <html> so global CSS can suppress
// the RealtimeSystemStatus bar and main padding while the studio is open.
export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-dev-studio', 'open');
    return () => {
      document.documentElement.removeAttribute('data-dev-studio');
    };
  }, []);

  return (
    <>
      <style>{`
        /* Suppress admin layout chrome while Dev Studio is open */
        html[data-dev-studio='open'] #main-content {
          padding: 0 !important;
          max-width: 100% !important;
        }
        html[data-dev-studio='open'] #main-content > div {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .dev-studio-shell {
          position: fixed;
          inset: 0;
          top: 64px;
          z-index: 20;
          overflow: hidden;
          width: 100vw;
          max-width: 100vw;
          box-sizing: border-box;
          overscroll-behavior: contain;
        }

        .dev-studio-shell *,
        .dev-studio-shell *::before,
        .dev-studio-shell *::after {
          box-sizing: border-box;
        }

        .dev-studio-shell iframe {
          display: block;
          max-width: 100%;
          min-width: 0;
          border: none;
        }
      `}</style>
      <div className="dev-studio-shell">
        {children}
      </div>
    </>
  );
}
