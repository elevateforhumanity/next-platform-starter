import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: {
    default: 'Student Portal | Elevate for Humanity',
    template: '%s | Student Portal',
  },
  description: 'Access your courses, assignments, and academic resources.',
  robots: { index: false, follow: false },
};

// NOTE: All /student-portal/* pages are permanentRedirect stubs. This layout
// never renders for users — they are redirected before the layout is shown.
// Nav points to canonical paths so if any stub is ever removed the fallback is safe.
const navItems = [
  { href: '/learner/dashboard', label: '← My Dashboard' },
  { href: '/learner/dashboard', label: 'Portal Home' },
  { href: '/lms/courses', label: 'Courses' },
  { href: '/lms/assignments', label: 'Assignments' },
  { href: '/lms/grades', label: 'Grades' },
  { href: '/lms/calendar', label: 'Schedule' },
  { href: '/learner/dashboard', label: 'Announcements' },
  { href: '/lms/resources', label: 'Resources' },
  { href: '/onboarding/learner/handbook', label: 'Handbook' },
  { href: '/onboarding/learner/documents', label: 'Documents' },
  { href: '/onboarding/learner/agreements', label: 'Agreements' },
];

export const dynamic = 'force-dynamic';

export default async function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal');

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/learner/dashboard" className="text-lg font-bold text-brand-blue-700">
                Student Portal
              </Link>
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-700 hover:text-brand-blue-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
