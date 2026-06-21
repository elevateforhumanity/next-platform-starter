// Single source of truth for public marketing site navigation.
//
// Rules:
// - Each URL appears under ONE top-level section only (no cross-menu duplicates).
// - Top-level = horizontal main menu (tablet/desktop); subItems = dropdown / mobile accordion.
// - Application *forms* live under Apply; employer/partner *pages* under Partners; sign-in under Portals.
//
// Consumed by: components/site/Header.tsx → HeaderMainNav (horizontal + dropdowns on md+, mobile hamburger)

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
    id: 'platform',
    name: 'Platform',
    href: '/platform/overview',
    subItems: [
      { name: '— The Workforce OS —', href: '/platform/overview', isHeader: true },
      { name: 'Platform Overview', href: '/platform/overview' },
      { name: 'AI Career Navigator', href: '/ai' },
      { name: 'Apprenticeship Technology', href: '/apprenticeships' },
      { name: 'Compliance Automation', href: '/store/add-ons/compliance-automation' },
      { name: 'Blockchain Credentials', href: '/platform/verification' },
      { name: 'Analytics & Reporting', href: '/platform/workforce-analytics' },
    ],
  },
  {
    name: 'Gov Portal',
    href: '/government',
    id: 'government',
    subItems: [
      { name: 'FSSA Gov Portal: Attendance & Budget', href: '/snap-et-partner', isSectionLink: true },
      { name: 'Workforce Partners', href: '/workforce-partners' },
      { name: 'Employer Partnership', href: '/employer-partners' },
      { name: 'Grant Compliance', href: '/compliance/grant-reporting' },
    ],
  },
  {
    name: 'The Bosses (VR)',
    href: '/admin/staff-portal/vr',
    id: 'vr-os',
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

/** Split flat subItems into category columns at each `isHeader` boundary (desktop + mobile nav). */
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
