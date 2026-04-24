import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Clock, CheckCircle, XCircle, Eye, Users, Building2,
  AlertTriangle, ArrowRight, RefreshCw, FileSignature, ShieldCheck, ListChecks,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Onboarding Review | Admin | Elevate For Humanity',
};

type OnboardingStatus = 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'pending';

interface EmployerOnboarding {
  id: string;
  employer_id: string;
  status: OnboardingStatus;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  mou_signed: boolean | null;
  insurance_verified: boolean | null;
  site_verified: boolean | null;
  created_at: string;
  updated_at: string | null;
}

interface OnboardingProgress {
  id: string;
  user_id: string;
  profile_completed: boolean | null;
  agreements_completed: boolean | null;
  handbook_acknowledged: boolean | null;
  documents_uploaded: boolean | null;
  status: string | null;
  completed_at: string | null;
  created_at: string;
}

interface MouSignature {
  id: string;
  partner_type: string | null;
  organization_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  signer_name: string;
  signer_title: string | null;
  supervisor_name: string | null;
  supervisor_license: string | null;
  compensation_model: string | null;
  compensation_rate: string | null;
  mou_version: string | null;
  signed_at: string;
  ip_address: string | null;
}

interface PolicyAcknowledgment {
  id: string;
  shop_name: string;
  signer_name: string;
  policies_acknowledged: string[];
  acknowledged_at: string;
  ip_address: string | null;
}

interface ProviderOnboardingStep {
  id: string;
  provider_id: string;
  step_name: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

const STATUS_STYLES: Record<OnboardingStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed:  'bg-blue-100 text-blue-800 border-blue-200',
  approved:  'bg-green-100 text-green-800 border-green-200',
  rejected:  'bg-red-100 text-red-800 border-red-200',
  pending:   'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_ICONS: Record<OnboardingStatus, React.ElementType> = {
  submitted: Clock,
  reviewed:  Eye,
  approved:  CheckCircle,
  rejected:  XCircle,
  pending:   AlertTriangle,
};

function StatusBadge({ status }: { status: OnboardingStatus }) {
  const Icon = STATUS_ICONS[status] ?? Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CheckItem({ label, value }: { label: string; value: boolean | null }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${value ? 'text-green-700' : 'text-slate-400'}`}>
      {value ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default async function AdminOnboardingPage() {
  await requireAdmin();

  const db = await getAdminClient();

  const [employerRes, providerRes, mouRes, policyRes, progressRes] = await Promise.all([
    db.from('employer_onboarding')
      .select('*')
      .order('created_at', { ascending: false }),
    db.from('provider_onboarding_steps')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false }),
    db.from('mou_signatures')
      .select('id, partner_type, organization_name, contact_name, contact_email, signer_name, signer_title, supervisor_name, supervisor_license, compensation_model, compensation_rate, mou_version, signed_at, ip_address')
      .order('signed_at', { ascending: false })
      .limit(100),
    db.from('partner_policy_acknowledgments')
      .select('id, shop_name, signer_name, policies_acknowledged, acknowledged_at, ip_address')
      .order('acknowledged_at', { ascending: false })
      .limit(100),
    // Learner onboarding step completion — written by /api/onboarding/complete-step
    db.from('onboarding_progress')
      .select('id, user_id, profile_completed, agreements_completed, handbook_acknowledged, documents_uploaded, status, completed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const employers: EmployerOnboarding[] = employerRes.data ?? [];
  const providerSteps: ProviderOnboardingStep[] = providerRes.data ?? [];
  const mouSignatures: MouSignature[] = mouRes.data ?? [];
  const policyAcks: PolicyAcknowledgment[] = policyRes.data ?? [];
  const onboardingProgress: OnboardingProgress[] = progressRes.data ?? [];

  // Group provider steps by provider_id
  const providerMap = new Map<string, ProviderOnboardingStep[]>();
  for (const step of providerSteps) {
    const existing = providerMap.get(step.provider_id) ?? [];
    existing.push(step);
    providerMap.set(step.provider_id, existing);
  }

  const submitted  = employers.filter(e => e.status === 'submitted').length;
  const approved   = employers.filter(e => e.status === 'approved').length;
  const rejected   = employers.filter(e => e.status === 'rejected').length;
  const pending    = employers.filter(e => !e.status || e.status === 'pending').length;

  const providerCount     = providerMap.size;
  const completedProviders = [...providerMap.values()].filter(steps => steps.every(s => s.completed)).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Onboarding', href: '/admin/onboarding' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Review</h1>
          <p className="text-slate-500 text-sm mt-1">
            Employer and provider onboarding status across all accounts.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/employers/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Employer Detail <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Submitted',  value: submitted,  color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved',   value: approved,   color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Rejected',   value: rejected,   color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: 'Pending',    value: pending,    color: 'text-slate-600',  bg: 'bg-slate-50'  },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-slate-100`}>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Employer Onboarding Table */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Employer Onboarding</h2>
          <span className="ml-auto text-sm text-slate-500">{employers.length} total</span>
        </div>

        {employers.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No employer onboarding records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Company', 'Contact', 'Status', 'Checklist', 'Submitted', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employers.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {e.company_name ?? <span className="text-slate-400 italic">Unnamed</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{e.contact_name ?? '—'}</div>
                      <div className="text-xs text-slate-400">{e.contact_email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={(e.status ?? 'pending') as OnboardingStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <CheckItem label="MOU Signed"       value={e.mou_signed} />
                        <CheckItem label="Insurance"        value={e.insurance_verified} />
                        <CheckItem label="Site Verified"    value={e.site_verified} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/employers/${e.employer_id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Provider Onboarding */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Provider Onboarding</h2>
          <span className="ml-auto text-sm text-slate-500">
            {completedProviders}/{providerCount} complete
          </span>
        </div>

        {providerMap.size === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No provider onboarding steps found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...providerMap.entries()].map(([providerId, steps]) => {
              const allDone = steps.every(s => s.completed);
              const profile = steps[0]?.profiles;
              return (
                <div key={providerId} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-900">{profile?.full_name ?? 'Unknown Provider'}</p>
                      <p className="text-xs text-slate-400">{profile?.email ?? providerId}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${allDone ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {allDone ? 'Complete' : `${steps.filter(s => s.completed).length}/${steps.length} steps`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {steps.map(step => (
                      <span
                        key={step.id}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                          step.completed
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {step.completed
                          ? <CheckCircle className="w-3 h-3" />
                          : <RefreshCw className="w-3 h-3" />}
                        {step.step_name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* MOU Signatures */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileSignature className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">MOU Signatures</h2>
          <span className="ml-auto text-sm text-slate-500">{mouSignatures.length} total</span>
        </div>

        {mouSignatures.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <FileSignature className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No MOU signatures on record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Partner Type', 'Organization', 'Signer', 'Supervisor', 'Compensation', 'MOU Version', 'Signed'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mouSignatures.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        m.partner_type === 'barbershop' ? 'bg-amber-100 text-amber-700'
                        : m.partner_type === 'cosmetology' ? 'bg-pink-100 text-pink-700'
                        : m.partner_type === 'program_holder' ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {(m.partner_type ?? 'unknown').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{m.organization_name ?? m.signer_name}</p>
                      <p className="text-xs text-slate-400">{m.contact_email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{m.signer_name}</p>
                      <p className="text-xs text-slate-400">{m.signer_title ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{m.supervisor_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{m.supervisor_license ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {m.compensation_model ? `${m.compensation_model}${m.compensation_rate ? ` — ${m.compensation_rate}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{m.mou_version ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(m.signed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Learner Onboarding Progress */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Learner Onboarding Progress</h2>
          <span className="ml-auto text-sm text-slate-500">{onboardingProgress.length} records</span>
        </div>
        {onboardingProgress.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
            <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No onboarding progress records yet.</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Completed', value: onboardingProgress.filter(p => p.status === 'completed').length, color: 'text-green-600' },
                { label: 'In Progress', value: onboardingProgress.filter(p => p.status === 'in_progress').length, color: 'text-amber-600' },
                { label: 'Not Started', value: onboardingProgress.filter(p => p.status === 'not_started' || !p.status).length, color: 'text-slate-500' },
                { label: 'Profile Done', value: onboardingProgress.filter(p => p.profile_completed).length, color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['User', 'Profile', 'Agreements', 'Handbook', 'Documents', 'Status', 'Completed'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {onboardingProgress.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.user_id?.slice(0, 8)}…</td>
                      {[p.profile_completed, p.agreements_completed, p.handbook_acknowledged, p.documents_uploaded].map((done, i) => (
                        <td key={i} className="px-4 py-3">
                          {done
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-slate-300" />}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.status === 'completed' ? 'bg-green-100 text-green-700'
                          : p.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                          {p.status ?? 'not_started'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Partner Policy Acknowledgments */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Partner Policy Acknowledgments</h2>
          <span className="ml-auto text-sm text-slate-500">{policyAcks.length} total</span>
        </div>

        {policyAcks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No policy acknowledgments on record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Shop', 'Signer', 'Policies Acknowledged', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policyAcks.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.shop_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.signer_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.policies_acknowledged ?? []).map(pol => (
                          <span key={pol} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle className="w-3 h-3" />
                            {pol.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {(p.policies_acknowledged ?? []).length === 0 && <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(p.acknowledged_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
