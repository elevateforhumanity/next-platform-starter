'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  // Section 1 — Org
  legal_name: string;
  org_type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ein: string;
  uei: string;
  rep_name: string;
  rep_title: string;
  rep_phone: string;
  rep_email: string;
  // Section 2 — Program
  program_name: string;
  program_type: string;
  delivery_mode: string;
  structured_hours: string;
  supervised_hours: string;
  total_weekly_hours: string;
  program_duration: string;
  counties: string;
  training_sites: string;
  credentials: string;
  // Section 3 — Projections
  total_participants: string;
  snap_recipients: string;
  abawd_participants: string;
  completion_rate: string;
  placement_rate: string;
  // Section 5 — Cost Plan
  nf_salary: string;
  f_salary: string;
  f_fringe: string;
  nf_materials: string;
  f_materials: string;
  nf_rent: string;
  f_rent: string;
  nf_inkind: string;
  f_transport_reimb: string;
  f_tuition_reimb: string;
  // Section 6 — Reimbursements
  reimb_unduplicated: string;
  reimb_monthly_dup: string;
  reimb_annual_budget: string;
  reimb_monthly_budget: string;
  reimb_per_participant: string;
  // Derived cost totals
  total_direct_nf: string;
  total_direct_f: string;
  total_program_costs: string;
  federal_reimb_50pct: string;
  // Section J — Budget Narrative & Justification
  j_salary_narrative: string;
  j_fringe_narrative: string;
  j_materials_narrative: string;
  j_rent_narrative: string;
  j_transport_narrative: string;
  j_tuition_narrative: string;
  j_inkind_narrative: string;
  j_indirect_narrative: string;
  // Compliance
  submission_date: string;
  signature_name: string;
  signature_title: string;
  signature_org: string;
  signature_date: string;
}

const DEFAULTS: FormState = {
  legal_name: 'Elevate for Humanity Technical and Career Institute',
  org_type: '2Exclusive LLC-S (DBA)',
  address: '8888 Keystone Crossing, Suite 1300',
  city: 'Indianapolis',
  state: 'IN',
  zip: '46240',
  ein: '85-3832840',
  uei: 'VX2GK5S8SZH8',
  rep_name: 'Elizabeth Greene',
  rep_title: 'Founder & Chief Executive Officer',
  rep_phone: '(317) 314-3757',
  rep_email: 'elevate4humanityedu@gmail.com',
  program_name: 'Elevate for Humanity SNAP E&T Multi-Track Credential Program',
  program_type: 'Vocational training',
  delivery_mode: 'Hybrid',
  structured_hours: '20',
  supervised_hours: '5',
  total_weekly_hours: '25',
  program_duration: '4 weeks',
  counties: 'Marion, Hamilton, Hendricks, Johnson, Madison',
  training_sites: '8888 Keystone Crossing Suite 1300 (IT/testing/admin)\n6331 N Keystone Ave (healthcare/beauty)\n7116 N College Ave (construction/manufacturing)\n2439 E 65th St (hands-on trades training)',
  credentials: [
    'IT Help Desk / CompTIA A+',
    'Cybersecurity Analyst',
    'CNA (Certified Nursing Assistant)',
    'QMA (Qualified Medication Aide)',
    'Phlebotomy Technician',
    'CDL Class A & B Commercial Driver Training',
    'Barber Apprenticeship',
    'Cosmetology Apprenticeship',
    'Nail Technician Apprenticeship',
    'Esthetician Apprenticeship',
    'Business Administration',
    'Finance & Bookkeeping',
    'HVAC Technician (EPA 608 Certification)',
    'Manufacturing / Production Technician',
  ].join('\n'),
  total_participants: '150',
  snap_recipients: '150',
  abawd_participants: '75',
  completion_rate: '82%',
  placement_rate: '74%',
  // Corrected per FSSA reviewer feedback (Davis 5/1/2026):
  // Federal salary updated to $496,600 (matches page 14 TPP budget)
  // Fringe updated to $74,490 (15% of $496,600)
  // Caito Dr removed; 2439 E 65th St added (hands-on training, $5,000 rent + $2,000 utilities)
  // Non-federal salary = 50% of total federal share ($796,289 × 50% = $398,144.50)
  nf_salary: '$398,144.50',
  f_salary: '$496,600',
  f_fringe: '$74,490',
  nf_materials: '$3,680',
  f_materials: '$42,245',
  nf_rent: '$7,000',
  f_rent: '$112,954',
  nf_inkind: '$5,000',
  f_transport_reimb: '$54,000',
  f_tuition_reimb: '$16,000',
  // Derived totals
  total_direct_nf: '$413,824.50',
  total_direct_f: '$796,289',
  total_program_costs: '$1,210,113.50',
  federal_reimb_50pct: '$398,144.50',
  total_direct_nf: '$413,824.50',
  total_direct_f: '$796,289',
  total_program_costs: '$1,210,113.50',
  federal_reimb_50pct: '$398,144.50',
  // Section J — Budget Narrative & Justification
  j_salary_narrative: 'SNAP E&T Case Manager (1.0 FTE, $42,000/yr); Program Coordinator Clystjah Woodley (1.0 FTE, $38,000/yr); Director of Community Services Leslie Wafford (1.0 FTE, $48,000/yr); Elizabeth Greene, CEO/Authorized Representative (0.40 FTE, $72,000 base × 40% = $28,800); Job Placement Specialist (planned hire, 1.0 FTE, $36,000/yr); Instructor stipends across 9 credential tracks at four sites ($233,800). Total Federal Salary: $496,600. Non-Federal match (50% of total federal share of $796,289): $398,144.50, documented via booth rental agreement, self-pay enrollment records, and volunteer instructor logs.',
  j_fringe_narrative: 'Fringe benefits calculated at 15% of federal salary ($496,600 × 15% = $74,490). Covers FICA (7.65%), health insurance contribution, workers\' compensation, and unemployment insurance for all federally-funded FTE positions.',
  j_materials_narrative: 'Non-Federal ($3,680): program supplies purchased with organizational funds. Federal ($42,245): curriculum materials, workbooks, testing prep materials, PPE kits, and program-specific consumables distributed to 150 participants across 14 credential tracks at four active sites. Average $281.63/participant.',
  j_rent_narrative: 'Non-Federal ($7,000): partial rent at 8888 Keystone Crossing covered by organizational revenue. Federal ($112,954): proportional share of four active training site leases — 8888 Keystone Crossing Suite 1300 (IT/testing/admin); 6331 N Keystone Ave (healthcare/beauty); 7116 N College Ave (construction/manufacturing); 2439 E 65th St (hands-on trades training, $5,000/mo rent + $2,000/mo utilities). Allocation based on square footage and program hours per site.',
  j_transport_narrative: 'Federal ($54,000): bus passes, mileage reimbursement, and rideshare support for 150 participants. Average $360/participant/year ($30/month). Required for all mandatory E&T participants per 7 CFR 273.7(d)(4). Documented via participant reimbursement request forms and receipts.',
  j_tuition_narrative: 'Federal ($16,000): credential exam registration and proctoring fees — NHA ($115), EPA 608 ($20), CompTIA A+ ($246), CDL skills test ($150), and state licensing fees. Covers approximately 64 participants at average $250/participant. Remaining participants\' exam fees covered by program holder agreements.',
  j_inkind_narrative: 'Non-Federal In-Kind ($5,000): volunteer instructor time documented via sign-in logs and time-and-effort records. Valued at $25/hour × 200 hours. Meets non-federal match requirement. No federal funds used for in-kind contributions.',
  j_indirect_narrative: 'No indirect costs claimed. Elevate for Humanity does not have a Negotiated Indirect Cost Rate Agreement (NICRA) on file. All costs are direct and documented. This is consistent with the organization\'s current federal award structure.',
  reimb_unduplicated: '150',
  reimb_monthly_dup: '60',
  reimb_annual_budget: '$70,000',
  reimb_monthly_budget: '$5,833',
  reimb_per_participant: '$97',
  submission_date: 'April 28, 2026',
  signature_name: 'Elizabeth Greene',
  signature_title: 'Executive Director',
  signature_org: '2exclusive llc-s dba Elevate for Humanity Career & Technical Institute',
  signature_date: '02/28/2026',
};

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, textarea, half,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (k: keyof FormState, v: string) => void;
  textarea?: boolean;
  half?: boolean;
}) {
  const base = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white';
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {textarea ? (
        <textarea rows={4} className={base} value={value} onChange={e => onChange(name, e.target.value)} />
      ) : (
        <input type="text" className={base} value={value} onChange={e => onChange(name, e.target.value)} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-wide">{title}</h2>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SnapEtClient() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const html = buildEmailHtml(form);
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'elevate4humanityedu@gmail.com',
          subject: `SNAP E&T TPP Application — ${form.program_name}`,
          html,
          fromName: 'Elevate Admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-lg font-semibold text-slate-900">Application sent to elevate4humanityedu@gmail.com</p>
        <button onClick={() => setSent(false)} className="text-sm text-brand-blue-600 hover:underline">Edit &amp; resend</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Header notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800 mb-8">
        All fields are pre-filled from the submitted application. Edit any field before sending.
      </div>

      {/* 1. Org Info */}
      <Section title="1. Organization Information">
        <Field label="Legal Organization Name" name="legal_name" value={form.legal_name} onChange={update} />
        <Field label="Organization Type" name="org_type" value={form.org_type} onChange={update} half />
        <Field label="EIN" name="ein" value={form.ein} onChange={update} half />
        <Field label="UEI (SAM.gov)" name="uei" value={form.uei} onChange={update} half />
        <Field label="Street Address" name="address" value={form.address} onChange={update} />
        <Field label="City" name="city" value={form.city} onChange={update} half />
        <Field label="State" name="state" value={form.state} onChange={update} half />
        <Field label="ZIP" name="zip" value={form.zip} onChange={update} half />
        <Field label="Authorized Representative" name="rep_name" value={form.rep_name} onChange={update} half />
        <Field label="Title" name="rep_title" value={form.rep_title} onChange={update} half />
        <Field label="Phone" name="rep_phone" value={form.rep_phone} onChange={update} half />
        <Field label="Email" name="rep_email" value={form.rep_email} onChange={update} half />
      </Section>

      {/* 2. Program Details */}
      <Section title="2. Program Details">
        <Field label="Program Name" name="program_name" value={form.program_name} onChange={update} />
        <Field label="Program Type" name="program_type" value={form.program_type} onChange={update} half />
        <Field label="Delivery Mode" name="delivery_mode" value={form.delivery_mode} onChange={update} half />
        <Field label="Program Duration" name="program_duration" value={form.program_duration} onChange={update} half />
        <Field label="Total Weekly Hours" name="total_weekly_hours" value={form.total_weekly_hours} onChange={update} half />
        <Field label="Structured Hours / Week" name="structured_hours" value={form.structured_hours} onChange={update} half />
        <Field label="Supervised Hours / Week" name="supervised_hours" value={form.supervised_hours} onChange={update} half />
        <Field label="Counties Served" name="counties" value={form.counties} onChange={update} />
        <Field label="Training Sites (one per line)" name="training_sites" value={form.training_sites} onChange={update} textarea />
        <Field label="Credential Programs Offered (one per line)" name="credentials" value={form.credentials} onChange={update} textarea />
      </Section>

      {/* 3. Participant Projections */}
      <Section title="3. Participant Projections">
        <Field label="Total Annual Participants" name="total_participants" value={form.total_participants} onChange={update} half />
        <Field label="SNAP Recipients" name="snap_recipients" value={form.snap_recipients} onChange={update} half />
        <Field label="ABAWD Participants" name="abawd_participants" value={form.abawd_participants} onChange={update} half />
        <Field label="Expected Completion Rate" name="completion_rate" value={form.completion_rate} onChange={update} half />
        <Field label="Expected 90-Day Job Placement Rate" name="placement_rate" value={form.placement_rate} onChange={update} half />
      </Section>

      {/* 5. FSSA Cost Plan */}
      <Section title="5. FSSA Cost Plan">
        <div className="col-span-2 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase">Expense Category</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase">Non-Federal Share</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase">Federal Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { label: 'Salary / Wages', nf: 'nf_salary', f: 'f_salary' },
                { label: 'Fringe Benefits (15%)', nf: null, f: 'f_fringe' },
                { label: 'Materials / Supplies', nf: 'nf_materials', f: 'f_materials' },
                { label: 'Building Space / Rent', nf: 'nf_rent', f: 'f_rent' },
              ].map(row => (
                <tr key={row.label}>
                  <td className="px-4 py-2 text-slate-700">{row.label}</td>
                  <td className="px-4 py-2">
                    {row.nf ? (
                      <input type="text" className="w-full border border-slate-200 rounded px-2 py-1 text-sm" value={form[row.nf as keyof FormState]} onChange={e => update(row.nf as keyof FormState, e.target.value)} />
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" className="w-full border border-slate-200 rounded px-2 py-1 text-sm" value={form[row.f as keyof FormState]} onChange={e => update(row.f as keyof FormState, e.target.value)} />
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-2">State In-Kind Contribution</td>
                <td className="px-4 py-2">
                  <input type="text" className="w-full border border-slate-200 rounded px-2 py-1 text-sm" value={form.nf_inkind} onChange={e => update('nf_inkind', e.target.value)} />
                </td>
                <td className="px-4 py-2 text-slate-400">—</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-slate-700">Transportation &amp; Other Reimbursements</td>
                <td className="px-4 py-2 text-slate-400">—</td>
                <td className="px-4 py-2">
                  <input type="text" className="w-full border border-slate-200 rounded px-2 py-1 text-sm" value={form.f_transport_reimb} onChange={e => update('f_transport_reimb', e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-slate-700">Tuition / Training Costs</td>
                <td className="px-4 py-2 text-slate-400">—</td>
                <td className="px-4 py-2">
                  <input type="text" className="w-full border border-slate-200 rounded px-2 py-1 text-sm" value={form.f_tuition_reimb} onChange={e => update('f_tuition_reimb', e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Cost totals summary */}
      <div className="col-span-2 mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Non-Federal Share', name: 'total_direct_nf' as keyof FormState },
            { label: 'Total Federal Share', name: 'total_direct_f' as keyof FormState },
            { label: 'Total Program Costs', name: 'total_program_costs' as keyof FormState },
            { label: 'Est. Federal Reimbursement (50%)', name: 'federal_reimb_50pct' as keyof FormState },
          ].map(t => (
            <div key={t.name} className="flex items-center justify-between bg-white border border-slate-200 rounded px-3 py-2">
              <span className="text-xs font-semibold text-slate-500">{t.label}</span>
              <input type="text" className="text-sm font-bold text-slate-900 text-right w-36 border-0 focus:outline-none bg-transparent" value={form[t.name]} onChange={e => update(t.name, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Participant Reimbursements */}
      <Section title="6. Participant Reimbursements — Tables E.I. & E.II.">
        <Field label="Unduplicated Annual Count (Row I)" name="reimb_unduplicated" value={form.reimb_unduplicated} onChange={update} half />
        <Field label="Monthly Duplicated Count (Row II)" name="reimb_monthly_dup" value={form.reimb_monthly_dup} onChange={update} half />
        <Field label="Annual Budget (Row III)" name="reimb_annual_budget" value={form.reimb_annual_budget} onChange={update} half />
        <Field label="Monthly Budget (Row IV = III ÷ 12)" name="reimb_monthly_budget" value={form.reimb_monthly_budget} onChange={update} half />
        <Field label="Per Participant / Month (Row V = IV ÷ II)" name="reimb_per_participant" value={form.reimb_per_participant} onChange={update} half />
      </Section>

      {/* Section J — Budget Narrative & Justification */}
      <Section title="Section J — Budget Narrative & Justification">
        <div className="col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-2">
          Required per FSSA reviewer feedback (Davis, 5/1/2026). Each line item must be justified with calculation method, cost basis, and linkage to program activities.
        </div>
        <Field label="Salary / Wages — Narrative & Justification" name="j_salary_narrative" value={form.j_salary_narrative} onChange={update} textarea />
        <Field label="Fringe Benefits — Narrative & Justification" name="j_fringe_narrative" value={form.j_fringe_narrative} onChange={update} textarea />
        <Field label="Materials / Supplies — Narrative & Justification" name="j_materials_narrative" value={form.j_materials_narrative} onChange={update} textarea />
        <Field label="Building Space / Rent — Narrative & Justification" name="j_rent_narrative" value={form.j_rent_narrative} onChange={update} textarea />
        <Field label="Transportation Reimbursements — Narrative & Justification" name="j_transport_narrative" value={form.j_transport_narrative} onChange={update} textarea />
        <Field label="Tuition / Training Costs — Narrative & Justification" name="j_tuition_narrative" value={form.j_tuition_narrative} onChange={update} textarea />
        <Field label="In-Kind Contributions — Narrative & Justification" name="j_inkind_narrative" value={form.j_inkind_narrative} onChange={update} textarea />
        <Field label="Indirect Costs — Narrative & Justification" name="j_indirect_narrative" value={form.j_indirect_narrative} onChange={update} textarea />
      </Section>

      {/* 9. Compliance & Signature */}
      <Section title="9. Compliance & Authorized Signature">
        <Field label="Submission Date" name="submission_date" value={form.submission_date} onChange={update} half />
        <Field label="Signature Date" name="signature_date" value={form.signature_date} onChange={update} half />
        <Field label="Authorized Representative (Printed Name)" name="signature_name" value={form.signature_name} onChange={update} half />
        <Field label="Title" name="signature_title" value={form.signature_title} onChange={update} half />
        <Field label="Organization Name" name="signature_org" value={form.signature_org} onChange={update} />
      </Section>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Send button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send to elevate4humanityedu@gmail.com'}
        </button>
      </div>
    </div>
  );
}

// ── Email HTML builder ────────────────────────────────────────────────────────

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 12px;font-weight:600;color:#475569;width:220px;vertical-align:top">${label}</td><td style="padding:6px 12px;color:#0f172a">${value.replace(/\n/g, '<br/>')}</td></tr>`;
}

function section(title: string, rows: string) {
  return `
    <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin:28px 0 12px">${title}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>`;
}

function buildEmailHtml(f: FormState): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:#1e293b;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <p style="margin:0;font-size:11px;opacity:.7">STATE OF INDIANA — Family and Social Services Administration — Division of Family Resources</p>
    <h1 style="margin:8px 0 4px;font-size:20px">SNAP Employment &amp; Training Program</h1>
    <p style="margin:0;font-size:14px;opacity:.85">Third Party Provider (TPP) Application Questionnaire</p>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:16px 24px;font-size:12px;color:#475569">
    <strong>Submitting Organization:</strong> ${f.legal_name} &nbsp;|&nbsp; <strong>EIN:</strong> ${f.ein} &nbsp;|&nbsp; <strong>UEI:</strong> ${f.uei}<br/>
    <strong>Primary Contact:</strong> ${f.rep_name} &nbsp;·&nbsp; ${f.rep_phone} &nbsp;·&nbsp; ${f.rep_email}<br/>
    <strong>Submission Date:</strong> ${f.submission_date}
  </div>
  <div style="padding:0 8px">
    ${section('1. Organization Information',
      row('Legal Name', f.legal_name) +
      row('Organization Type', f.org_type) +
      row('EIN', f.ein) +
      row('UEI', f.uei) +
      row('Address', `${f.address}, ${f.city}, ${f.state} ${f.zip}`) +
      row('Authorized Representative', f.rep_name) +
      row('Title', f.rep_title) +
      row('Phone', f.rep_phone) +
      row('Email', f.rep_email)
    )}
    ${section('2. Program Details',
      row('Program Name', f.program_name) +
      row('Program Type', f.program_type) +
      row('Delivery Mode', f.delivery_mode) +
      row('Duration', f.program_duration) +
      row('Structured Hours/Week', f.structured_hours) +
      row('Supervised Hours/Week', f.supervised_hours) +
      row('Total Weekly Hours', f.total_weekly_hours) +
      row('Counties Served', f.counties) +
      row('Training Sites', f.training_sites) +
      row('Credential Programs', f.credentials)
    )}
    ${section('3. Participant Projections',
      row('Total Annual Participants', f.total_participants) +
      row('SNAP Recipients', f.snap_recipients) +
      row('ABAWD Participants', f.abawd_participants) +
      row('Expected Completion Rate', f.completion_rate) +
      row('90-Day Job Placement Rate', f.placement_rate)
    )}
    ${section('5. FSSA Cost Plan',
      row('Salary / Wages (Non-Federal)', f.nf_salary) +
      row('Salary / Wages (Federal)', f.f_salary) +
      row('Fringe Benefits (15% of Federal Salary)', f.f_fringe) +
      row('Materials / Supplies (Non-Federal)', f.nf_materials) +
      row('Materials / Supplies (Federal)', f.f_materials) +
      row('Building Space / Rent (Non-Federal)', f.nf_rent) +
      row('Building Space / Rent (Federal)', f.f_rent) +
      row('State In-Kind Contribution (Non-Federal)', f.nf_inkind) +
      row('Transportation Reimbursements (Federal)', f.f_transport_reimb) +
      row('Tuition / Training Costs (Federal)', f.f_tuition_reimb) +
      row('Total Non-Federal Share', f.total_direct_nf) +
      row('Total Federal Share', f.total_direct_f) +
      row('Total Program Costs', f.total_program_costs) +
      row('Estimated Federal Reimbursement (50%)', f.federal_reimb_50pct)
    )}
    ${section('Section J — Budget Narrative &amp; Justification',
      row('Salary / Wages', f.j_salary_narrative) +
      row('Fringe Benefits', f.j_fringe_narrative) +
      row('Materials / Supplies', f.j_materials_narrative) +
      row('Building Space / Rent', f.j_rent_narrative) +
      row('Transportation Reimbursements', f.j_transport_narrative) +
      row('Tuition / Training Costs', f.j_tuition_narrative) +
      row('In-Kind Contributions', f.j_inkind_narrative) +
      row('Indirect Costs', f.j_indirect_narrative)
    )}
    ${section('6. Participant Reimbursements',
      row('Unduplicated Annual Count', f.reimb_unduplicated) +
      row('Monthly Duplicated Count', f.reimb_monthly_dup) +
      row('Annual Budget', f.reimb_annual_budget) +
      row('Monthly Budget', f.reimb_monthly_budget) +
      row('Per Participant / Month', f.reimb_per_participant)
    )}
    ${section('9. Compliance & Signature',
      row('Submission Date', f.submission_date) +
      row('Signature Date', f.signature_date) +
      row('Authorized Representative', f.signature_name) +
      row('Title', f.signature_title) +
      row('Organization', f.signature_org)
    )}
  </div>
  <div style="margin-top:24px;padding:16px 24px;background:#f1f5f9;border-radius:0 0 8px 8px;font-size:11px;color:#64748b">
    NOTICE: This document contains confidential program and financial information submitted for FSSA DFR review purposes only.
    Unauthorized disclosure is prohibited. Prepared pursuant to 7 CFR 273.7 and Indiana SNAP E&T State Plan requirements.
  </div>
</body></html>`;
}
