import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Hash, BookOpen, Tag } from 'lucide-react';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/utils/withTimeout';
import ApplicationActions from './ApplicationActions';
import { resolveProgram } from '@/lib/programs/resolve';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Application | Elevate For Humanity',
  description: 'Review and approve or reject an application',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  under_review: 'Under Review',
  enrolled: 'Enrolled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  submitted: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
  rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
  in_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  under_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  enrolled: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  // revoked is a derived state (revoked_at IS NOT NULL), not a DB status value
  revoked: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
};

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth is enforced by apps/admin/app/admin/layout.tsx — no duplicate requireRole() here.
  const { id } = await params;

  logger.info('[review/application] loading', { id });

  // Reject non-UUID IDs immediately — legacy intake-{timestamp} IDs are not valid
  // application records and will never resolve. Return a clear error instead of 404.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    logger.warn('[review/application] non-UUID id rejected', { id });
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Application not found</h1>
        <p className="text-slate-500 mb-6">
          <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">{id}</code> is not a
          valid application ID. This link may have been generated from an intake form submission
          that was not converted to an application record.
        </p>
        <Link href="/admin/applications" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
      </div>
    );
  }

  // Use admin client — applications table RLS restricts session-based reads.
  let db: Awaited<ReturnType<typeof requireAdminClient>> | null = null;
  try {
    db = await requireAdminClient();
  } catch (err) {
    logger.error('[review/application] requireAdminClient failed', err);
  }
  if (!db) notFound();

  let app: Record<string, unknown> | null = null;
  let queryError: string | undefined;
  try {
    const result = await withTimeout(
      db.from('applications').select('*').eq('id', id).maybeSingle(),
      5000,
      'applications.select',
    );
    app = result.data as Record<string, unknown> | null;
    queryError = result.error?.message;
  } catch (err) {
    queryError = err instanceof Error ? err.message : String(err);
  }

  logger.info('[review/application] query result', { id, found: !!app, error: queryError });

  if (queryError || !app) {
    logger.warn('[review/application] not found or timed out', { id, error: queryError });
    notFound();
  }

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
  const programSlug: string =
    app.program_slug ?? resolvedProgram?.slug ?? app.program_interest ?? '';

  // Parse support_notes for structured data
  const notes = (app.support_notes || '') as string;
  const noteFields = notes.split(' | ').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HERO */}
      <div className="relative w-full h-[220px] sm:h-[280px]">
        <Image sizes="100vw"
          src="/images/pages/admin-applicants-detail.jpg"
          alt="Review Application"
          fill
          priority
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
              <p className="text-brand-blue-300 text-xs font-semibold tracking-widest uppercase mb-1">
                Application Review
              </p>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow">
                {displayName}
              </h1>
              <p className="text-slate-300 text-sm mt-1">{app.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full border ${statusColors[effectiveStatus] || 'bg-gray-100 text-slate-900 border-gray-300'}`}
              >
                {effectiveStatus === 'revoked' ? 'Revoked' : statusLabels[app.status] || app.status}
              </span>
              <Link
                href="/admin/applications"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm transition-colors"
              >
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
                    <a
                      href={`mailto:${app.email}`}
                      className="text-sm text-brand-blue-600 hover:underline"
                    >
                      {app.email || 'Not provided'}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Phone</p>
                    {app.phone ? (
                      <a
                        href={`tel:${app.phone}`}
                        className="text-sm text-brand-blue-600 hover:underline"
                      >
                        {app.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">Not provided</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Location</p>
                    <p className="text-sm text-slate-800">
                      {[app.city, app.zip].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Submitted</p>
                    <p className="text-sm text-slate-800">
                      {new Date(app.created_at).toLocaleString('en-US')}
                    </p>
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
                  <p className="text-sm font-semibold text-slate-900">
                    {app.program_interest || 'Not specified'}
                  </p>
                  {app.source && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Source:{' '}
                      {(app.source as string).replace(/-/g, ' ')}
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
                applicantEmail={app.email || ''}
                applicantName={displayName}
              />
            </div>

            {/* Payment link — barber applicants with pending payment */}
            {programSlug === 'barber-apprenticeship' && app.payment_status !== 'paid' && (
              <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6">
                <h2 className="text-base font-bold text-slate-900 mb-1">Payment Pending</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Send this link to the student to complete their barber program payment.
                </p>
                <a
                  href={`${SITE_URL}/programs/barber-apprenticeship/apply?type=apprentice&payment=payment_plan&email=${encodeURIComponent(app.email || '')}&name=${encodeURIComponent(displayName)}&application_id=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Open Payment Page ↗
                </a>
                <p className="text-xs text-slate-400 mt-2 break-all">
                  {`/programs/barber-apprenticeship/apply?type=apprentice&payment=payment_plan&application_id=${id}`}
                </p>
              </div>
            )}

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
                    <dd className="text-sm text-slate-800">
                      {new Date(app.updated_at).toLocaleString('en-US')}
                    </dd>
                  </div>
                )}
                {app.revoked_at && (
                  <div className="pt-3 border-t border-rose-100">
                    <dt className="text-xs font-semibold text-rose-600">Revoked</dt>
                    <dd className="text-sm text-rose-700 mt-0.5">
                      {new Date(app.revoked_at).toLocaleString('en-US')}
                    </dd>
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
