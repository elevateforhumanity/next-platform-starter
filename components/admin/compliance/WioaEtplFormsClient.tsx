'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Save,
} from 'lucide-react';
import {
  type IeapFormData,
  type Section188ChecklistData,
  IEAP_INITIAL,
  SECTION_188_INITIAL,
  mergeIeapFromProgram,
  FORM_LABELS,
} from '@/lib/compliance/wioa-etpl-forms';

type ProgramMeta = {
  id: string;
  title: string;
  slug: string;
  etpl_requires_initial_eligibility: boolean;
  etpl_listed: boolean;
  intraining_program_id: string | null;
};

type FormRow = {
  form_type: string;
  status: string;
  responses: IeapFormData | Section188ChecklistData;
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500';

export function WioaEtplFormsClient({
  programId,
  programTitle,
  backHref,
}: {
  programId: string;
  programTitle: string;
  backHref: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'ieap' | 'section188' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [program, setProgram] = useState<ProgramMeta | null>(null);
  const [ieap, setIeap] = useState<IeapFormData>(IEAP_INITIAL);
  const [section188, setSection188] = useState<Section188ChecklistData>(SECTION_188_INITIAL);
  const [ieapStatus, setIeapStatus] = useState<string>('draft');
  const [section188Status, setSection188Status] = useState<string>('draft');
  const [tab, setTab] = useState<'ieap' | 'section188'>('section188');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/compliance/wioa-etpl/${programId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load forms');

      const p = json.program as ProgramMeta & {
        description?: string;
        cip_code?: string;
        soc_code?: string;
        estimated_hours?: number;
        estimated_weeks?: number;
        credential_name?: string;
      };
      setProgram(p);

      const ieapRow = json.forms?.initial_eligibility_aggregate_performance as FormRow | null;
      const s188Row = json.forms?.section_188_checklist as FormRow | null;

      if (ieapRow?.responses) {
        setIeap({ ...IEAP_INITIAL, ...(ieapRow.responses as IeapFormData) });
        setIeapStatus(ieapRow.status);
      } else {
        setIeap(mergeIeapFromProgram(p));
        setIeapStatus('draft');
      }

      if (s188Row?.responses) {
        setSection188({ ...SECTION_188_INITIAL, ...(s188Row.responses as Section188ChecklistData) });
        setSection188Status(s188Row.status);
      } else {
        setSection188(SECTION_188_INITIAL);
        setSection188Status('draft');
      }

      if (!p.etpl_requires_initial_eligibility) {
        setTab('section188');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(
    formType: 'initial_eligibility_aggregate_performance' | 'section_188_checklist',
    markComplete: boolean,
  ) {
    const key = formType === 'initial_eligibility_aggregate_performance' ? 'ieap' : 'section188';
    setSaving(key);
    setError(null);
    setSuccess(null);
    try {
      const responses =
        formType === 'initial_eligibility_aggregate_performance' ? ieap : section188;
      const res = await fetch(`/api/admin/compliance/wioa-etpl/${programId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_type: formType, responses, mark_complete: markComplete }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      if (formType === 'initial_eligibility_aggregate_performance') {
        setIeapStatus(json.form.status);
      } else {
        setSection188Status(json.form.status);
      }
      setSuccess(markComplete ? 'Form marked complete and saved.' : 'Draft saved.');
      if (markComplete && formType === 'initial_eligibility_aggregate_performance') {
        setProgram((prev) =>
          prev ? { ...prev, etpl_requires_initial_eligibility: false } : prev,
        );
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading forms…
      </div>
    );
  }

  const needsIeap = program?.etpl_requires_initial_eligibility ?? true;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-blue-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to WIOA ETPL compliance
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">WIOA / ETPL compliance forms</h1>
      <p className="text-slate-600 mb-6">{programTitle}</p>

      {error && (
        <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200">
        {needsIeap && (
          <button
            type="button"
            onClick={() => setTab('ieap')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === 'ieap'
                ? 'border-brand-blue-600 text-brand-blue-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            IEAP {ieapStatus === 'completed' ? '✓' : ''}
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('section188')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            tab === 'section188'
              ? 'border-brand-blue-600 text-brand-blue-700'
              : 'border-transparent text-slate-500'
          }`}
        >
          Section 188 {section188Status === 'completed' ? '✓' : ''}
        </button>
      </div>

      {tab === 'ieap' && needsIeap && (
        <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-600">
            {FORM_LABELS.initial_eligibility_aggregate_performance}. Required for{' '}
            <strong>new programs only</strong> before initial INTraining / ETPL listing (WIOA §122,
            20 CFR 680.450). Historical performance may be N/A when completer data is not yet
            available.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="INTraining program ID">
              <input
                className={inputClass}
                value={ieap.intraining_program_id}
                onChange={(e) => setIeap({ ...ieap, intraining_program_id: e.target.value })}
              />
            </Field>
            <Field label="Program title (must match ETPL listing) *">
              <input
                className={inputClass}
                value={ieap.program_title_etpl}
                onChange={(e) => setIeap({ ...ieap, program_title_etpl: e.target.value })}
              />
            </Field>
            <Field label="CIP code">
              <input
                className={inputClass}
                value={ieap.cip_code}
                onChange={(e) => setIeap({ ...ieap, cip_code: e.target.value })}
              />
            </Field>
            <Field label="SOC code">
              <input
                className={inputClass}
                value={ieap.soc_code}
                onChange={(e) => setIeap({ ...ieap, soc_code: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Program description *">
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={ieap.program_description}
              onChange={(e) => setIeap({ ...ieap, program_description: e.target.value })}
            />
          </Field>

          <Field label="Recognized post-secondary credential *">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={ieap.recognized_credential_description}
              onChange={(e) =>
                setIeap({ ...ieap, recognized_credential_description: e.target.value })
              }
            />
          </Field>

          <Field label="Credential issuing authority">
            <input
              className={inputClass}
              value={ieap.credential_issuing_authority}
              onChange={(e) => setIeap({ ...ieap, credential_issuing_authority: e.target.value })}
            />
          </Field>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={ieap.aligns_in_demand_industry}
              onChange={(e) => setIeap({ ...ieap, aligns_in_demand_industry: e.target.checked })}
              className="mt-1"
            />
            <span>Program aligns with an in-demand industry or occupation (Indiana DWD) *</span>
          </label>

          <Field label="In-demand alignment narrative *">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={ieap.in_demand_narrative}
              onChange={(e) => setIeap({ ...ieap, in_demand_narrative: e.target.value })}
            />
          </Field>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={ieap.has_business_partnerships}
              onChange={(e) => setIeap({ ...ieap, has_business_partnerships: e.target.checked })}
              className="mt-1"
            />
            <span>Documented partnerships with business(es)</span>
          </label>

          {ieap.has_business_partnerships && (
            <>
              <Field label="Partnership description">
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={ieap.partnership_description}
                  onChange={(e) => setIeap({ ...ieap, partnership_description: e.target.value })}
                />
              </Field>
              <Field label="Employer / partner names">
                <textarea
                  className={`${inputClass} min-h-[60px]`}
                  value={ieap.employer_partners}
                  onChange={(e) => setIeap({ ...ieap, employer_partners: e.target.value })}
                />
              </Field>
            </>
          )}

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={ieap.performance_data_not_applicable}
              onChange={(e) =>
                setIeap({ ...ieap, performance_data_not_applicable: e.target.checked })
              }
              className="mt-1"
            />
            <span>
              New program — insufficient completer data (performance metrics N/A for initial
              eligibility year)
            </span>
          </label>

          {!ieap.performance_data_not_applicable && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Employment rate — 2nd quarter after exit (%)">
                <input
                  className={inputClass}
                  value={ieap.employment_rate_q2_pct}
                  onChange={(e) => setIeap({ ...ieap, employment_rate_q2_pct: e.target.value })}
                />
              </Field>
              <Field label="Employment rate — 4th quarter after exit (%)">
                <input
                  className={inputClass}
                  value={ieap.employment_rate_q4_pct}
                  onChange={(e) => setIeap({ ...ieap, employment_rate_q4_pct: e.target.value })}
                />
              </Field>
              <Field label="Median earnings — 2nd quarter after exit ($)">
                <input
                  className={inputClass}
                  value={ieap.median_earnings_q2}
                  onChange={(e) => setIeap({ ...ieap, median_earnings_q2: e.target.value })}
                />
              </Field>
              <Field label="Credential attainment rate (%)">
                <input
                  className={inputClass}
                  value={ieap.credential_attainment_rate_pct}
                  onChange={(e) =>
                    setIeap({ ...ieap, credential_attainment_rate_pct: e.target.value })
                  }
                />
              </Field>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Prepared by *">
              <input
                className={inputClass}
                value={ieap.prepared_by_name}
                onChange={(e) => setIeap({ ...ieap, prepared_by_name: e.target.value })}
              />
            </Field>
            <Field label="Title">
              <input
                className={inputClass}
                value={ieap.prepared_by_title}
                onChange={(e) => setIeap({ ...ieap, prepared_by_title: e.target.value })}
              />
            </Field>
            <Field label="Date *">
              <input
                type="date"
                className={inputClass}
                value={ieap.prepared_date}
                onChange={(e) => setIeap({ ...ieap, prepared_date: e.target.value })}
              />
            </Field>
          </div>

          <label className="flex items-start gap-2 text-sm border-t pt-4">
            <input
              type="checkbox"
              checked={ieap.attestation_signed}
              onChange={(e) => setIeap({ ...ieap, attestation_signed: e.target.checked })}
              className="mt-1"
            />
            <span>
              I attest that the information is accurate and verifiable for Indiana DWD INTraining /
              ETPL initial eligibility review.
            </span>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => save('initial_eligibility_aggregate_performance', false)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {saving === 'ieap' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save draft
            </button>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => save('initial_eligibility_aggregate_performance', true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50"
            >
              Mark IEAP complete
            </button>
          </div>
        </div>
      )}

      {tab === 'section188' && (
        <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-600">
            {FORM_LABELS.section_188_checklist}. Required for each program per WIOA Section 188 and
            29 CFR Part 38 (Indiana Methods of Administration / NDP elements).
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Equal Opportunity Officer name *">
              <input
                className={inputClass}
                value={section188.eo_officer_name}
                onChange={(e) => setSection188({ ...section188, eo_officer_name: e.target.value })}
              />
            </Field>
            <Field label="EO Officer email">
              <input
                className={inputClass}
                value={section188.eo_officer_email}
                onChange={(e) =>
                  setSection188({ ...section188, eo_officer_email: e.target.value })
                }
              />
            </Field>
            <Field label="Program / training location *">
              <input
                className={inputClass}
                value={section188.program_location_address}
                onChange={(e) =>
                  setSection188({ ...section188, program_location_address: e.target.value })
                }
              />
            </Field>
            <Field label="Review date *">
              <input
                type="date"
                className={inputClass}
                value={section188.review_date}
                onChange={(e) => setSection188({ ...section188, review_date: e.target.value })}
              />
            </Field>
            <Field label="Next annual review due">
              <input
                type="date"
                className={inputClass}
                value={section188.next_annual_review_due}
                onChange={(e) =>
                  setSection188({ ...section188, next_annual_review_due: e.target.value })
                }
              />
            </Field>
          </div>

          <div className="space-y-3">
            {(
              [
                ['eo_officer_designated', 'State / local EO officer designated for this program'],
                ['notice_and_communication', 'Required EO notices and communications in place'],
                ['assurance_language', 'Assurance language executed (grant / partner agreements)'],
                ['affirmative_outreach', 'Affirmative outreach to protected populations'],
                ['ada_physical_access', 'Training facility meets ADA physical access standards'],
                ['ada_programmatic_access', 'Programmatic access provided (materials, instruction)'],
                [
                  'reasonable_accommodation_procedure',
                  'Reasonable accommodation request procedure documented',
                ],
                ['data_collection_equity', 'Equity-related data collection per Part 38'],
                ['monitoring_recipients', 'Monitoring schedule for recipient compliance'],
                ['complaint_processing_posted', 'Complaint procedures posted and accessible'],
                [
                  'complaint_processing_29cfr38',
                  'Complaint processing meets 29 CFR Part 38 requirements',
                ],
                ['corrective_actions_documented', 'Corrective action / sanction procedures documented'],
                ['part_38_acknowledgment', '29 CFR Part 38 Final Rule acknowledged'],
                ['facility_ada_compliant', 'Facility and program verified ADA compliant'],
                [
                  'nondiscriminatory_delivery_attestation',
                  'Program delivered in a nondiscriminatory manner (WIOA §188)',
                ],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-start gap-2 text-sm border-b border-slate-100 pb-2">
                <input
                  type="checkbox"
                  checked={section188[key]}
                  onChange={(e) =>
                    setSection188({ ...section188, [key]: e.target.checked } as Section188ChecklistData)
                  }
                  className="mt-1"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={section188.notes}
              onChange={(e) => setSection188({ ...section188, notes: e.target.value })}
            />
          </Field>

          <label className="flex items-start gap-2 text-sm border-t pt-4">
            <input
              type="checkbox"
              checked={section188.attestation_signed}
              onChange={(e) =>
                setSection188({ ...section188, attestation_signed: e.target.checked })
              }
              className="mt-1"
            />
            <span>
              I certify this Section 188 Equal Opportunity compliance checklist is complete and
              accurate for this program.
            </span>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => save('section_188_checklist', false)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {saving === 'section188' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save draft
            </button>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => save('section_188_checklist', true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50"
            >
              Mark Section 188 complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
