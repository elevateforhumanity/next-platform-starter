'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Clock, AlertTriangle, GraduationCap,
  BookOpen, Megaphone, Bell, FileText, Shield, Book, LifeBuoy,
  HelpCircle, ClipboardCheck, BarChart3, Settings, Menu, X,
  LogOut, CheckCircle, CalendarDays, Briefcase,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  section: string;
}

// Partner and program_holder are the same role — one unified nav.
// All items visible to all portal roles.
const ALL_ROLES = ['partner', 'program_holder', 'admin', 'super_admin', 'staff', 'org_admin'];

const NAV: NavItem[] = [
  // ── Overview ───────────────────────────────────────────────────────────────
  { href: '/program-holder/dashboard',     label: 'Dashboard',      icon: LayoutDashboard, roles: ALL_ROLES, section: 'Overview' },

  // ── Students ───────────────────────────────────────────────────────────────
  { href: '/program-holder/students',          label: 'Students',   icon: Users,          roles: ALL_ROLES, section: 'Students' },
  { href: '/program-holder/students/pending',  label: 'Pending',    icon: Clock,          roles: ALL_ROLES, section: 'Students' },
  { href: '/program-holder/students/at-risk',  label: 'At-Risk',    icon: AlertTriangle,  roles: ALL_ROLES, section: 'Students' },

  // ── Training ───────────────────────────────────────────────────────────────
  { href: '/partner/attendance',           label: 'Attendance',     icon: CalendarDays,   roles: ALL_ROLES, section: 'Training' },
  { href: '/partner/hours',                label: 'Hours',          icon: Clock,          roles: ALL_ROLES, section: 'Training' },
  { href: '/partner/competencies',         label: 'Competencies',   icon: CheckCircle,    roles: ALL_ROLES, section: 'Training' },
  { href: '/program-holder/grades',        label: 'Grades',         icon: GraduationCap,  roles: ALL_ROLES, section: 'Training' },
  { href: '/partner/programs',             label: 'Programs',       icon: Briefcase,      roles: ALL_ROLES, section: 'Training' },
  { href: '/program-holder/courses/create',label: 'Create Course',  icon: BookOpen,       roles: ALL_ROLES, section: 'Training' },

  // ── Documents & Compliance ─────────────────────────────────────────────────
  { href: '/program-holder/documents',     label: 'Documents',      icon: FileText,       roles: ALL_ROLES, section: 'Compliance' },
  { href: '/program-holder/verification',  label: 'Verification',   icon: Shield,         roles: ALL_ROLES, section: 'Compliance' },
  { href: '/program-holder/compliance',    label: 'Compliance',     icon: ClipboardCheck, roles: ALL_ROLES, section: 'Compliance' },
  { href: '/program-holder/mou',           label: 'MOU',            icon: FileText,       roles: ALL_ROLES, section: 'Compliance' },

  // ── Reports ────────────────────────────────────────────────────────────────
  { href: '/program-holder/reports',       label: 'Reports',        icon: BarChart3,      roles: ALL_ROLES, section: 'Reports' },
  { href: '/program-holder/campaigns',     label: 'Campaigns',      icon: Megaphone,      roles: ALL_ROLES, section: 'Reports' },

  // ── Settings & Support ─────────────────────────────────────────────────────
  { href: '/program-holder/notifications', label: 'Notifications',  icon: Bell,           roles: ALL_ROLES, section: 'Settings' },
  { href: '/program-holder/how-to-use',    label: 'How to Use',     icon: HelpCircle,     roles: ALL_ROLES, section: 'Settings' },
  { href: '/program-holder/documentation', label: 'Documentation',  icon: Book,           roles: ALL_ROLES, section: 'Settings' },
  { href: '/program-holder/support',       label: 'Support',        icon: LifeBuoy,       roles: ALL_ROLES, section: 'Settings' },
  { href: '/program-holder/settings',      label: 'Settings',       icon: Settings,       roles: ALL_ROLES, section: 'Settings' },
];

const SECTIONS = ['Overview', 'Students', 'Training', 'Compliance', 'Reports', 'Settings'];

export function PartnerProgramHolderShell({
  children,
  role,
  userName,
  userEmail,
  orgName,
  hasSchoolApplications = false,
}: {
  children: React.ReactNode;
  role: string;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  hasSchoolApplications?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((item) => item.roles.includes(role));

  // Add school applications if enabled
  const allNav = hasSchoolApplications
    ? [...visibleNav, { href: '/program-holder/school-applications', label: 'School Applications', icon: FileText, roles: ['program_holder'], section: 'Students' }]
    : visibleNav;

  const portalName = role === 'partner' ? 'Partner Portal' : 'Program Holder Portal';
  const homeHref = role === 'partner' ? '/partner/dashboard' : '/program-holder/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-slate-200 fixed inset-y-0 z-20">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-100">
          <Link href={homeHref} className="text-sm font-bold text-brand-blue-700 leading-tight block">
            {portalName}
          </Link>
          {orgName && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{orgName}</p>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {SECTIONS.map((section) => {
            const items = allNav.filter((i) => i.section === section);
            if (!items.length) return null;
            return (
              <div key={section}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1">{section}</p>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                        active
                          ? 'bg-brand-blue-50 text-brand-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-brand-blue-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-700 truncate">{userName}</p>
          <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
          <Link
            href="/api/auth/signout"
            className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <Link href={homeHref} className="text-sm font-bold text-brand-blue-700">{portalName}</Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-14 bottom-0 w-64 bg-white overflow-y-auto px-2 py-3 space-y-4" onClick={(e) => e.stopPropagation()}>
            {SECTIONS.map((section) => {
              const items = allNav.filter((i) => i.section === section);
              if (!items.length) return null;
              return (
                <div key={section}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1">{section}</p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                          active ? 'bg-brand-blue-50 text-brand-blue-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 pt-14 lg:pt-0">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
