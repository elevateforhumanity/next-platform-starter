// ============================================================
// CONSOLIDATED NAVIGATION - June 2026
// Simplified: 5 top-level menus with essential items only
// Full navigation available at /directory
// ============================================================

import { canonicalRoutes } from '@/lib/routes/canonical-routes';

export interface NavSubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  nested?: boolean;
}

export interface NavItem {
  id: string;
  name: string;
  href?: string;
  subItems?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      { name: '— By Category —', href: '/programs', isHeader: true },
      { name: 'Healthcare', href: '/programs/healthcare' },
      { name: 'Skilled Trades', href: '/programs/skilled-trades' },
      { name: 'Beauty & Barber', href: '/programs#cat-beauty' },
      { name: 'Technology', href: '/programs/technology' },
      { name: 'Business & Finance', href: '/programs/finance-bookkeeping-accounting' },
      { name: 'All Programs →', href: '/programs', isSectionLink: true },

      { name: '— Funding —', href: '/funding', isHeader: true },
      { name: 'WIOA / Federal Aid', href: '/funding/wioa' },
      { name: 'Workforce Ready Grant', href: '/funding/wrg' },
      { name: 'Self-Pay Options', href: '/funding' },
      { name: 'All Funding →', href: '/funding', isSectionLink: true },

      { name: '— Apprenticeships —', href: '/apprenticeships', isHeader: true },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Find Host Shop', href: '/programs/barber-apprenticeship/host-shops' },
      { name: 'All Apprenticeships →', href: '/apprenticeships', isSectionLink: true },
    ],
  },
  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Exams —', href: '/testing', isHeader: true },
      { name: 'Testing Center', href: '/testing' },
      { name: 'Schedule Exam', href: '/testing/book' },
      { name: 'EPA 608 (HVAC)', href: '/testing/esco' },
      { name: 'NRF RISE Up', href: '/testing/nrf' },
      { name: 'All Certifications →', href: '/testing', isSectionLink: true },
    ],
  },
  {
    id: 'solutions',
    name: 'Solutions',
    href: '/partners',
    subItems: [
      { name: '— For Partners —', href: '/partners', isHeader: true },
      { name: 'Employers', href: '/for-employers' },
      { name: 'Workforce Agencies', href: '/for-agencies' },
      { name: 'Government', href: '/government' },
      { name: 'Training Providers', href: '/for-providers' },
      { name: 'All Solutions →', href: '/partners', isSectionLink: true },
    ],
  },
  {
    id: 'platform',
    name: 'Platform',
    href: '/platform/overview',
    subItems: [
      { name: '— Platform —', href: '/platform/overview', isHeader: true },
      { name: 'Overview', href: '/platform/overview' },
      { name: 'AI Career Navigator', href: '/ai' },
      { name: 'Credentials', href: '/platform/verification' },
      { name: 'Analytics', href: '/platform/workforce-analytics' },
    ],
  },
  {
    id: 'about',
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'About Us', href: '/about' },
      { name: 'Mission', href: '/about/mission' },
      { name: 'Team', href: '/about/team' },
      { name: 'Impact', href: '/impact' },
      { name: 'Partners', href: '/about/partners' },

      { name: '— Resources —', href: '/blog', isHeader: true },
      { name: 'Blog', href: '/blog' },
      { name: 'Events', href: '/events' },
      { name: 'Success Stories', href: '/success-stories' },

      { name: '— Contact —', href: '/contact', isHeader: true },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Locations', href: '/locations' },
      { name: 'Donate', href: '/donate' },

      { name: '— Help —', href: '/support', isHeader: true },
      { name: 'Help Center', href: '/help' },
      { name: 'Full Directory →', href: '/directory', isSectionLink: true },
    ],
  },
];

/** Collect leaf hrefs for audits (pathname only, no query). */
export function collectNavHrefOwners(items: NavItem[] = NAV_ITEMS): Map<string, string> {
  const owners = new Map<string, string>();
  for (const item of items) {
    if (item.href) {
      const key = item.href.split('?')[0];
      if (!owners.has(key)) owners.set(key, item.name);
    }
    for (const sub of item.subItems ?? []) {
      if (sub.isHeader) continue;
      const key = sub.href.split('?')[0];
      const existing = owners.get(key);
      if (existing && existing !== item.name) {
        owners.set(key, `${existing} + ${item.name}`);
      } else if (!existing) {
        owners.set(key, item.name);
      }
    }
  }
  return owners;
}

/** Split flat subItems into category columns at each `isHeader` boundary. */
export function groupNavSubItemsByHeader(subItems: NavSubItem[]): NavSubItem[][] {
  const columns: NavSubItem[][] = [];
  let current: NavSubItem[] = [];
  for (const sub of subItems) {
    if (sub.isHeader && current.length > 0) {
      columns.push(current);
      current = [sub];
    } else {
      current.push(sub);
    }
  }
  if (current.length > 0) columns.push(current);
  return columns;
}

export function getNavCategoryLabel(column: NavSubItem[]): string {
  const header = column.find((sub) => sub.isHeader);
  if (header) return header.name.replace(/—/g, '').trim();
  return 'Links';
}

export function findDuplicateNavHrefs(items: NavItem[] = NAV_ITEMS): { href: string; owners: string }[] {
  const count = new Map<string, Set<string>>();
  for (const item of items) {
    const add = (href: string) => {
      const key = href.split('?')[0];
      if (!count.has(key)) count.set(key, new Set());
      count.get(key)!.add(item.name);
    };
    if (item.href) add(item.href);
    for (const sub of item.subItems ?? []) {
      if (!sub.isHeader) add(sub.href);
    }
  }
  return [...count.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([href, owners]) => ({ href, owners: [...owners].join(', ') }));
}
