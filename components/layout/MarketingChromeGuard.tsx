'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const APP_ROUTE_PREFIXES = [
  '/lms',
  '/learner',
  '/admin',
  '/instructor',
  '/employer',
  '/employer-portal',
  '/partner',
  '/staff-portal',
  '/mentor',
  '/program-holder',
  '/provider',
  '/proctor',
  '/login',
  '/signup',
  '/reset-password',
  '/verify',
];

function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function MarketingChromeGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const app = isAppRoute(pathname);
    const admin = isAdminRoute(pathname);

    // Toggle on <body> — keyed by the inline script in root layout for hard navs,
    // and by this effect for client-side SPA transitions.
    if (app) {
      document.body.setAttribute('data-app-route', 'true');
    } else {
      document.body.removeAttribute('data-app-route');
    }

    // Admin routes get an additional attribute so the footer can be
    // re-shown via CSS while the header stays hidden.
    if (admin) {
      document.body.setAttribute('data-admin-route', 'true');
    } else {
      document.body.removeAttribute('data-admin-route');
    }

    // Also toggle the legacy data-public-layout-root attribute for any code
    // that still reads it directly.
    const root = document.querySelector('[data-public-layout-root]');
    if (root) {
      if (app) {
        root.setAttribute('data-app-route', 'true');
      } else {
        root.removeAttribute('data-app-route');
      }
      if (admin) {
        root.setAttribute('data-admin-route', 'true');
      } else {
        root.removeAttribute('data-admin-route');
      }
    }
  }, [pathname]);

  return null;
}
