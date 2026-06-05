'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  APPRENTICE_PORTAL_CONFIGS,
  type ApprenticePortalConfig,
} from '@/components/portal/ApprenticePortalShell';
import {
  apprenticeshipDocumentsPath,
  apprenticeshipLmsCoursePath,
  apprenticeshipRtiLabel,
} from '@/lib/portal/program-portal-paths';
import {
  BARBER_STUDENT_APP_HOME,
  BARBER_STUDENT_APP_SHORT_LABEL,
} from '@/lib/barber/student-app';

function isActive(pathname: string, href: string, tabId: string): boolean {
  if (tabId === 'dashboard') {
    return pathname === href || pathname === '/apprentice';
  }
  if (tabId === 'course') {
    return pathname.startsWith('/lms/courses/');
  }
  if (tabId === 'documents') {
    return pathname.includes('/documents');
  }
  if (tabId === 'mobile-app') {
    return pathname.startsWith('/pwa/barber');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ApprenticeSubNav({
  programSlug,
  config,
}: {
  programSlug: string;
  config: ApprenticePortalConfig;
}) {
  const pathname = usePathname() ?? '';
  const lmsCourseHref = apprenticeshipLmsCoursePath(programSlug);
  const documentsHref = apprenticeshipDocumentsPath(programSlug);
  const rtiCourseLabelShort =
    apprenticeshipRtiLabel(programSlug, true) ?? 'Online Course';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', href: config.portalPath },
    ...(lmsCourseHref
      ? [{ id: 'course', label: rtiCourseLabelShort, href: lmsCourseHref }]
      : []),
    { id: 'hours', label: 'Hours', href: '/apprentice/hours' },
    { id: 'timeclock', label: 'Timeclock', href: '/apprentice/timeclock' },
    { id: 'competencies', label: 'Competencies', href: '/apprentice/competencies' },
    { id: 'documents', label: 'Documents', href: documentsHref },
    { id: 'billing', label: 'Billing', href: '/apprentice/billing' },
    { id: 'handbook', label: 'Handbook', href: '/apprentice/handbook' },
    ...(programSlug === 'barber-apprenticeship'
      ? [{ id: 'mobile-app', label: BARBER_STUDENT_APP_SHORT_LABEL, href: BARBER_STUDENT_APP_HOME }]
      : []),
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href, tab.id);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function resolveApprenticeNavConfig(programSlug: string | null): {
  programSlug: string;
  config: ApprenticePortalConfig;
} | null {
  if (!programSlug) return null;
  const config = APPRENTICE_PORTAL_CONFIGS[programSlug];
  if (!config) return null;
  return { programSlug, config };
}
