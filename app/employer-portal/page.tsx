import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Building2,
  ChevronRight,
  Plus,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Portal | Elevate for Humanity',
  description: 'Manage job postings, apprentices, and hiring tools for your organization.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer-portal' },
};

export default async function EmployerPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer-portal');

  const db = await requireAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, company_name, verified, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // Non-employer roles redirect to their own dashboard
  const employerRoles = ['employer', 'admin', 'super_admin'];
  if (profile && !employerRoles.includes(profile.role ?? '')) {
    redirect('/portals');
  }

  // Unverified employers see pending state
  if (profile?.role === 'employer' && !profile.verified) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Under Review</h1>
          <p className="text-slate-600 mb-6">
            Your employer account is being reviewed. You'll receive an email at{' '}
            <strong>{user.email}</strong> when approved (1–2 business days).
          </p>
          <Link
            href="/for-employers"
            className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Learn About Employer Partnership
          </Link>
        </div>
      </div>
    );
  }

  // Pull employer data
  const [
    { data: jobPostings, count: jobCount },
    { data: apprenticeships, count: apprenticeCount },
    { data: applications, count: appCount },
  ] = await Promise.all([
    db
      .from('job_postings')
      .select('id, title, status, created_at', { count: 'exact' })
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('apprenticeships')
      .select('id, title, status', { count: 'exact' })
      .eq('employer_id', user.id)
      .limit(5),
    db
      .from('job_applications')
      .select('id, status, created_at', { count: 'exact' })
      .eq('employer_id', user.id)
      .eq('status', 'pending')
      .limit(5),
  ]);

  const NAV = [
    {
      label: 'Job Postings',
      href: '/employer/jobs',
      icon: Briefcase,
      count: jobCount ?? 0,
      desc: 'Post and manage open positions',
    },
    {
      label: 'Apprentices',
      href: '/employer/apprentices',
      icon: Users,
      count: apprenticeCount ?? 0,
      desc: 'Track apprentice hours and progress',
    },
    {
      label: 'Applications',
      href: '/employer/applications',
      icon: FileText,
      count: appCount ?? 0,
      desc: 'Review pending applications',
      badge: (appCount ?? 0) > 0,
    },
    {
      label: 'Reports',
      href: '/employer/reports',
      icon: TrendingUp,
      count: null,
      desc: 'Compliance and outcome reports',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-0.5">
              Employer Portal
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              {profile?.company_name ?? profile?.full_name ?? 'Your Organization'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {profile?.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            <Link
              href="/employer/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 transition"
            >
              Full Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Briefcase className="w-6 h-6 text-brand-blue-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{jobCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Job Postings</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Users className="w-6 h-6 text-green-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{apprenticeCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Apprentices</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <FileText className="w-6 h-6 text-amber-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{appCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Pending Applications</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Icon className="w-7 h-7 text-brand-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{item.label}</p>
                    {item.badge && (
                      <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Recent job postings */}
        {jobPostings && jobPostings.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Recent Job Postings</h2>
              <Link
                href="/employer/jobs"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> New Posting
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {jobPostings.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between px-6 py-3">
                  <p className="text-sm font-medium text-slate-900">{job.title}</p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      job.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : job.status === 'closed'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/employer/jobs"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Post a Job
          </Link>
          <Link
            href="/employer/apprenticeships/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Add Apprentice
          </Link>
          <Link
            href="/employer/documents"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Compliance Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
