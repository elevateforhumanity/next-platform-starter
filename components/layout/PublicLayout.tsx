// Server Component - NO 'use client'
// Layout for public marketing pages.
//
// MarketingChromeGuard (client) handles hiding chrome on app routes during
// client-side navigation by toggling data-app-route on the root div.
// CSS in globals.css hides [data-marketing-chrome] and resets padding.
//
// No headers() call — avoids forcing dynamic rendering on static pages.

import { Suspense } from 'react';
import Header from '@/components/site/Header';
import ServerFooter from '@/components/site/ServerFooter';
import ClientWidgets from './ClientWidgets';
import MarketingChromeGuardLoader from './MarketingChromeGuardLoader';
import { SafeSearchParamsProvider } from '@/hooks/useSafeSearchParams';
import { SiteDisclaimer } from '@/components/compliance/site-disclaimer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <div data-public-layout-root>
        <div data-marketing-chrome data-marketing-header>
          <Header />
        </div>

        <div data-main-shell>
          <main
            id="main-content"
            className="overflow-x-hidden"
            data-marketing-main
            role="main"
            tabIndex={-1}
          >
            {/* SafeSearchParamsProvider wraps only the page content — not the
                header/footer — so its Suspense boundary never duplicates the shell. */}
            <SafeSearchParamsProvider>
              {children}
            </SafeSearchParamsProvider>
          </main>
        </div>

        <div data-marketing-chrome data-marketing-footer>
          <SiteDisclaimer />
          <ServerFooter />
        </div>

        <Suspense fallback={null}>
          <ClientWidgets />
        </Suspense>
      </div>

      <MarketingChromeGuardLoader />
    </>
  );
}
