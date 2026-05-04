import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Learner Portal | Elevate For Humanity',
  description: 'Access your courses, track progress, and manage your career training journey.',
  robots: { index: false, follow: false },
};

const navItems = [
  { href: '/learner/dashboard',          label: 'Dashboard' },
  { href: '/lms/courses',                label: 'My Courses' },
  { href: '/lms/programs',               label: 'Programs' },
  { href: '/lms/certificates',           label: 'Certificates' },
  { href: '/student-portal/assignments', label: 'Assignments' },
  { href: '/student-portal/grades',      label: 'Grades' },
  { href: '/student-portal/schedule',    label: 'Schedule' },
  { href: '/notifications',              label: 'Notifications' },
  { href: '/support',                    label: 'Support' },
];

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/learner/dashboard" className="text-lg font-bold text-brand-blue-700 shrink-0">
                Learner Portal
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-700 hover:text-brand-blue-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/my-dashboard"
              className="text-xs text-slate-500 hover:text-brand-blue-600 shrink-0"
            >
              ← My Dashboard
            </Link>
          </div>
        </div>

        {/* Mobile nav — horizontally scrollable */}
        <div className="md:hidden border-t border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-700 hover:text-brand-blue-700 whitespace-nowrap px-3 py-1.5 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
