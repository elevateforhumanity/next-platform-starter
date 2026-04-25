import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';

export const metadata: Metadata = {
  title: {
    default: 'Partner Portal | Elevate for Humanity',
    template: '%s | Partner Portal',
  },
  description: 'Manage your partnership with Elevate for Humanity.',
};

const navItems = [
  { href: '/partner/attendance', label: 'Attendance' },
  { href: '/partner/hours', label: 'Hours' },
  { href: '/partner/competencies', label: 'Competencies' },
  { href: '/partner/programs', label: 'Programs' },
  { href: '/partner/documents', label: 'Documents' },
  { href: '/partner/reports', label: 'Reports' },
  { href: '/partner/settings', label: 'Settings' },
];

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser({ allowedRoles: ['partner', 'admin', 'super_admin', 'org_admin', 'staff'] });
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/partner/attendance" className="text-lg font-bold text-brand-orange-600">Partner Portal</Link>
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-slate-700 hover:text-brand-blue-700">{item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
