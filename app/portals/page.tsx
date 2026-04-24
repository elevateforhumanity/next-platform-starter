
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Handshake,
  Users,
  Briefcase,
  UserCircle,
  ArrowRight,
  Shield,
  Clock,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/portals',
  },
  title: 'Portals | Elevate For Humanity',
  description:
    'Access your personalized portal. Whether you are a student, employer, partner, parent, staff member, or client, find your dedicated dashboard here.',
  keywords: [
    'student portal',
    'employer portal',
    'partner portal',
    'parent portal',
    'staff portal',
    'client portal',
    'dashboard',
    'login',
  ],
};

const portals = [
  {
    icon: GraduationCap,
    title: 'Student Portal',
    description: 'Access your courses, track progress, view grades, manage your schedule, and connect with instructors and career services.',
    href: '/login?redirect=/learner/dashboard',
    color: 'blue',
    features: ['Course Materials', 'Grade Tracking', 'Career Services', 'Schedule Management'],
  },
  {
    icon: Briefcase,
    title: 'Employer Portal',
    description: 'Post jobs, manage apprentices, track training progress, access compliance documents, and connect with program coordinators.',
    href: '/login?redirect=/employer/dashboard',
    color: 'green',
    features: ['Job Postings', 'Apprentice Management', 'Compliance Documents', 'Hiring Tools'],
  },
  {
    icon: Handshake,
    title: 'Partner Portal',
    description: 'Record attendance, manage apprentice hours, access MOU documents, and track your organization\'s program involvement.',
    href: '/login?redirect=/partner/dashboard',
    color: 'purple',
    features: ['Attendance Recording', 'Hours Tracking', 'MOU Documents', 'Program Reports'],
  },
  {
    icon: Building2,
    title: 'Program Holder Portal',
    description: 'Manage your programs, track enrollments, handle compliance documentation, and monitor student outcomes.',
    href: '/login?redirect=/program-holder/dashboard',
    color: 'indigo',
    features: ['Program Management', 'Enrollment Tracking', 'Compliance Docs', 'Outcomes Reports'],
  },
  {
    icon: Users,
    title: 'Instructor Portal',
    description: 'View your student roster, review lab and assignment submissions, track completions, and manage course content.',
    href: '/login?redirect=/instructor/dashboard',
    color: 'teal',
    features: ['Student Roster', 'Submission Review', 'Grade Tracking', 'Course Management'],
  },
  {
    icon: UserCircle,
    title: 'Case Manager Portal',
    description: 'Track your assigned participants, verify enrollments, record job placements, and generate WIOA compliance reports.',
    href: '/login?redirect=/case-manager/dashboard',
    color: 'orange',
    features: ['Caseload Management', 'Enrollment Verification', 'Job Placements', 'WIOA Reports'],
  },
  {
    icon: Users,
    title: 'Mentor Portal',
    description: 'Connect with your mentees, schedule sessions, track their career progress, and access mentoring resources.',
    href: '/login?redirect=/mentor/dashboard',
    color: 'green',
    features: ['Mentee List', 'Session Scheduling', 'Progress Tracking', 'Resources'],
  },
  {
    icon: Briefcase,
    title: 'Staff Portal',
    description: 'Manage students, record attendance, flag at-risk learners, run reports, and coordinate daily operations.',
    href: '/login?redirect=/staff-portal/dashboard',
    color: 'teal',
    features: ['Student Management', 'Attendance Tracking', 'At-Risk Flags', 'Reports'],
  },
  {
    icon: Shield,
    title: 'Admin Dashboard',
    description: 'Full site management — users, enrollments, programs, ETPL tracking, curriculum builder, and system settings.',
    href: '/login?redirect=/admin/dashboard',
    color: 'red',
    features: ['User Management', 'Enrollments', 'ETPL Tracking', 'System Settings'],
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue:   { bg: 'bg-brand-blue-600',   text: 'text-brand-blue-600',   border: 'border-brand-blue-200',   light: 'bg-brand-blue-50' },
  green:  { bg: 'bg-brand-green-600',  text: 'text-brand-green-600',  border: 'border-brand-green-200',  light: 'bg-brand-green-50' },
  orange: { bg: 'bg-brand-orange-600', text: 'text-brand-orange-600', border: 'border-brand-orange-200', light: 'bg-brand-orange-50' },
  teal:   { bg: 'bg-teal-600',         text: 'text-teal-600',         border: 'border-teal-200',         light: 'bg-teal-50' },
  indigo: { bg: 'bg-indigo-600',       text: 'text-indigo-600',       border: 'border-indigo-200',       light: 'bg-indigo-50' },
  purple: { bg: 'bg-purple-600',       text: 'text-purple-600',       border: 'border-purple-200',       light: 'bg-purple-50' },
  red:    { bg: 'bg-red-600',          text: 'text-red-600',          border: 'border-red-200',          light: 'bg-red-50' },
};

const ROLE_DASHBOARD: Record<string, string> = {
  student:        '/learner/dashboard',
  learner:        '/learner/dashboard',
  employer:       '/employer/dashboard',
  instructor:     '/instructor/dashboard',
  partner:        '/partner/dashboard',
  program_holder: '/program-holder/dashboard',
  staff:          '/staff-portal/dashboard',
  mentor:         '/mentor/dashboard',
  case_manager:   '/case-manager/dashboard',
  org_admin:      '/partner/dashboard',
  admin:          '/admin/dashboard',
  super_admin:    '/admin/dashboard',
};

export default async function PortalsPage() {
  // Authenticated users go straight to their dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const dest = profile?.role ? ROLE_DASHBOARD[profile.role] : null;
    if (dest) redirect(dest);
  }

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Portals' },
        ]}
      />
      {/* Hero Section */}
      <section className="bg-brand-blue-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Access Your Portal</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Choose your portal below to access your personalized dashboard, resources, and tools.
            Each portal is designed to support your specific role in the Elevate community.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-green-400" />
              <span>Secure Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-blue-400" />
              <span>24/7 Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span>Real-Time Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portals.map((portal) => {
              const colors = colorClasses[portal.color];
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.title}
                  href={portal.href}
                  className={`group bg-white rounded-2xl p-6 shadow-sm border ${colors.border} hover:shadow-lg hover:border-transparent transition-all duration-300`}
                >
                  <div className={`w-14 h-14 ${colors.light} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700">
                    {portal.title}
                  </h2>
                  <p className="text-slate-600 mb-4 text-sm leading-relaxed">{portal.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {portal.features.map((feature) => (
                      <span
                        key={feature}
                        className={`text-xs px-2 py-1 ${colors.light} ${colors.text} rounded-full`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className={`flex items-center gap-2 ${colors.text} font-semibold text-sm`}>
                    <span>Access Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Need Help Accessing Your Portal?</h2>
          <p className="text-lg text-slate-600 mb-8">
            If you're having trouble logging in or need assistance finding the right portal,
            our support team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/faq"
              className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access for Returning Users */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Returning User?</h2>
            <p className="text-slate-500">Sign in directly to your portal dashboard</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/login?redirect=/learner/dashboard"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <GraduationCap className="w-6 h-6 text-brand-blue-400" />
              <span className="font-semibold">Student Sign In</span>
            </Link>
            <Link
              href="/login?redirect=/employer/dashboard"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Building2 className="w-6 h-6 text-brand-green-400" />
              <span className="font-semibold">Employer Sign In</span>
            </Link>
            <Link
              href="/login?redirect=/staff-portal/dashboard"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Briefcase className="w-6 h-6 text-teal-400" />
              <span className="font-semibold">Staff Sign In</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
