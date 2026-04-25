import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Hash, BookOpen, Tag } from 'lucide-react';
import ApplicationActions from './ApplicationActions';
import { resolveProgram } from '@/lib/programs/resolve';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Review Application | Elevate For Humanity',
  description: 'Review and approve or reject an application',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  enrolled: 'Enrolled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  submitted: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
  rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
  in_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  enrolled: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  // revoked is a derived state (revoked_at IS NOT NULL), not a DB status value
  revoked: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
};

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'super_admin']);
  const { id } = await params;

  // Use admin client — applications table RLS restricts session-based reads.
  let db: Awaited<ReturnType<typeof getAdminClient>> | null = null;
  try { db = await getAdminClient(); } catch (_) { /* notFound() below handles null db */ }
  if (!db) notFound();

  const { data: app, error } = await db
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !app) notFound();

  const displayName =
    [app.first_name, app.last_name].filter(Boolean).join(' ') ||
    app.full_name ||
    'Unknown Applicant';

  // Effective status: revoked_at IS NOT NULL overrides the DB status value.
  // applications.status stays 'enrolled' (terminal) after revocation.
  const effectiveStatus = app.revoked_at ? 'revoked' : app.status;

  // Resolve program_interest to a program UUID for enrollment creation.
  // Priority: application.program_id (already resolved) → resolveProgram utility.
  const resolvedProgram = await resolveProgram(db!, app.program_interest);
  const resolvedProgramId: string | null = app.program_id ?? resolvedProgram?.id ?? null;
  const programSlug: string = app.program_slug ?? resolvedProgram?.slug ?? app.program_interest ?? '';

  // Parse support_notes for structured data
  const notes = (app.support_notes || '') as string;
  const noteFields = notes.split(' | ').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* HERO */}
      <div className="relative w-full h-[220px] sm:h-[280px]">
        <Image
          src="/images/pages/admin-applicants-detail.jpg"
          alt="Review Application"
          fill priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/40 to-slate-900/80" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 pb-8 max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Applications', href: '/admin/applications' },
              { label: displayName },
            ]}
            className="text-white/70 mb-3"
          />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-brand-blue-300 text-xs font-semibold tracking-widest uppercase mb-1">Application Review</p>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow">{displayName}</h1>
              <p className="text-slate-300 text-sm mt-1">{app.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full border ${statusColors[effectiveStatus] || 'bg-gray-100 text-slate-900 border-gray-300'}`}>
                {effectiveStatus === 'revoked' ? 'Revoked' : (statusLabels[app.status] || app.status)}
              </span>
              <Link href="/admin/applications" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Email</p>
                    <a href={`mailto:${app.email}`} className="text-sm text-brand-blue-600 hover:underline">{app.email || 'Not provided'}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Phone</p>
                    {app.phone
                      ? <a href={`tel:${app.phone}`} className="text-sm text-brand-blue-600 hover:underline">{app.phone}</a>
                      : <span className="text-sm text-slate-400">Not provided</span>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Location</p>
                    <p className="text-sm text-slate-800">{[app.city, app.zip].filter(Boolean).join(', ') || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Submitted</p>
                    <p className="text-sm text-slate-800">{new Date(app.created_at).toLocaleString('en-US')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Program Interest */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Program Interest</h2>
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{app.program_interest || 'Not specified'}</p>
                  {app.source && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Source: {(app.source as string).replace(/-/g, ' ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            {noteFields.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">Additional Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {noteFields.map((field, i) => {
                    const [label, ...rest] = field.split(': ');
                    const value = rest.join(': ');
                    return (
                      <div key={i} className="bg-slate-50 rounded-xl p-3">
                        <dt className="text-xs font-semibold text-slate-500 mb-1">{label}</dt>
                        <dd className="text-sm text-slate-800">{value || field}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Actions</h2>
              <ApplicationActions
                applicationId={id}
                currentStatus={app.status}
                programId={resolvedProgramId}
                programInterest={programSlug}
              />
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Metadata</h2>
              <dl className="space-y-3">
                <div className="flex items-start gap-2">
                  <Hash className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Application ID</dt>
                    <dd className="text-xs font-mono text-slate-600 break-all mt-0.5">{id}</dd>
                  </div>
                </div>
                {app.updated_at && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Last Updated</dt>
                    <dd className="text-sm text-slate-800">{new Date(app.updated_at).toLocaleString('en-US')}</dd>
                  </div>
                )}
                {app.revoked_at && (
                  <div className="pt-3 border-t border-rose-100">
                    <dt className="text-xs font-semibold text-rose-600">Revoked</dt>
                    <dd className="text-sm text-rose-700 mt-0.5">{new Date(app.revoked_at).toLocaleString('en-US')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
