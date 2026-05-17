'use client';

import { PortalShell, type PortalNavItem } from '@/components/ui/design-system';
import {
  LayoutDashboard, Users, FileText, BarChart3, DollarSign, Settings,
} from 'lucide-react';

const NAV: PortalNavItem[] = [
  { href: '/workforce-board',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/workforce-board/participants', label: 'Participants',  icon: Users },
  { href: '/workforce-board/cases',        label: 'Cases',         icon: FileText },
  { href: '/workforce-board/reports',      label: 'Reports',       icon: BarChart3 },
  { href: '/workforce-board/funding',      label: 'Funding',       icon: DollarSign },
  { href: '/workforce-board/settings',     label: 'Settings',      icon: Settings },
];

export default function WorkforceBoardShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}) {
  return (
    <PortalShell
      nav={NAV}
      portalName="Workforce Board"
      role="workforce_board"
      userName={userName}
      userEmail={userEmail}
      logoHref="/workforce-board"
    >
      {children}
    </PortalShell>
  );
}
