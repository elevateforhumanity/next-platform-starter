'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const WORKERS_COMP_OPTIONS = [
  { value: 'verified',  label: "Yes — we carry Workers' Compensation insurance" },
  { value: 'exempt',    label: 'Exempt — we have a valid state exemption (will provide documentation)' },
  { value: 'none',      label: "No — we do not currently carry Workers' Compensation" },
];

const COMPENSATION_MODELS = [
  { value: 'hourly',  label: 'Hourly Wage' },
  { value: 'hybrid',  label: 'Hybrid (Hourly Base + Commission/Tips)' },
];

const INITIAL_FORM = {
  spaLegalName: '',
  spaDbaName: '',
  ownerName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  spaAddressLine1: '',
  spaAddressLine2: '',
  spaCity: '',
  spaState: 'IN',
  spaZip: '',
  indianaEstablishmentLicenseNumber: '',
  supervisorName: '',
  supervisorLicenseNumber: '',
  supervisorYearsLicensed: '',
  apprenticesOnPayroll: 'yes',
  compensationModel: '',
  numberOfEmployees: '',
  workersCompStatus: '',
  hasGeneralLiability: '',
  canSuperviseAndVerify: '',
  mouAcknowledged: false,
  consentAcknowledged: false,
  notes: '',
};

export default function EstheticianSpaApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const set = (field: string, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mouAcknowledged || !formData.consentAcknowledged) {
      setError('You must acknowledge both the MOU terms and consent to proceed.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program: 'esthetician-apprenticeship',
          programName: 'Esthetician Apprenticeship',
          businessName: formData.spaLegalName,
          businessDba: formData.spaDbaName,
          businessAddressLine1: formData.spaAddressLine1,
          businessAddressLine2: formData.spaAddressLine2,
          businessCity: formData.spaCity,
          businessState: formData.spaState,
          businessZip: formData.spaZip,
          licenseNumber: formData.indianaEstablishmentLicenseNumber,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Submission failed. Please try again.');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Application Submitted</h1>
          <p className="text-slate-600 mb-6">
            Thank you for applying to host an esthetician apprentice. Our team will review your application and contact you within 3–5 business days.
          </p>
          <Link href="/partners/esthetician-apprenticeship" className="inline-flex items-center gap-2 text-pink-600 font-semibold hover:text-pink-800">
            ← Back to Partner Program
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumbs items={[
            { label: 'Partners', href: '/partners' },
            { label: 'Esthetician Apprenticeship', href: '/partners/esthetician-apprenticeship' },
            { label: 'Apply' },
          ]} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <InstitutionalHeader
            title="Host Spa Application"
            subtitle="Indiana Esthetician Apprenticeship Program"
            programType="DOL Registered Apprenticeship"
          />

          <div className="p-6 sm:p-8">
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-6 space-y-1.5">
              {[
                'No cost to apply — review is free',
                'Apprentices are placed on your payroll from day one',
                'Wage reimbursement available for WIOA-funded apprentices',
                'We handle all RTI coursework and progress tracking',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Business Info */}
              <div>
                <h2 className="text-base font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">Spa / Business Information</h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="spaLegalName">Legal Business Name *</label>
                      <input id="spaLegalName" required className={inputClass} value={formData.spaLegalName} onChange={e => set('spaLegalName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="spaDbaName">DBA / Trade Name</label>
                      <input id="spaDbaName" className={inputClass} value={formData.spaDbaName} onChange={e => set('spaDbaName', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="ownerName">Owner Name *</label>
                      <input id="ownerName" required className={inputClass} value={formData.ownerName} onChange={e => set('ownerName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="indianaEstablishmentLicenseNumber">Indiana Establishment License # *</label>
                      <input id="indianaEstablishmentLicenseNumber" required className={inputClass} value={formData.indianaEstablishmentLicenseNumber} onChange={e => set('indianaEstablishmentLicenseNumber', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="spaAddressLine1">Street Address *</label>
                    <input id="spaAddressLine1" required className={inputClass} value={formData.spaAddressLine1} onChange={e => set('spaAddressLine1', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="spaAddressLine2">Suite / Unit</label>
                    <input id="spaAddressLine2" className={inputClass} value={formData.spaAddressLine2} onChange={e => set('spaAddressLine2', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass} htmlFor="spaCity">City *</label>
                      <input id="spaCity" required className={inputClass} value={formData.spaCity} onChange={e => set('spaCity', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="spaState">State</label>
                      <input id="spaState" className={inputClass} value={formData.spaState} onChange={e => set('spaState', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="spaZip">ZIP *</label>
                      <input id="spaZip" required className={inputClass} value={formData.spaZip} onChange={e => set('spaZip', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h2 className="text-base font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">Primary Contact</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="contactName">Contact Name *</label>
                    <input id="contactName" required className={inputClass} value={formData.contactName} onChange={e => set('contactName', e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="contactEmail">Email Address *</label>
                      <input id="contactEmail" type="email" required className={inputClass} value={formData.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="contactPhone">Phone Number *</label>
                      <input id="contactPhone" type="tel" required className={inputClass} value={formData.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Supervisor */}
              <div>
                <h2 className="text-base font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">Supervising Esthetician</h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="supervisorName">Supervisor Name *</label>
                      <input id="supervisorName" required className={inputClass} value={formData.supervisorName} onChange={e => set('supervisorName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="supervisorLicenseNumber">Indiana License # *</label>
                      <input id="supervisorLicenseNumber" required className={inputClass} value={formData.supervisorLicenseNumber} onChange={e => set('supervisorLicenseNumber', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="supervisorYearsLicensed">Years Licensed *</label>
                    <input id="supervisorYearsLicensed" type="number" min="2" required className={inputClass} value={formData.supervisorYearsLicensed} onChange={e => set('supervisorYearsLicensed', e.target.value)} placeholder="Minimum 2 years required" />
                  </div>
                </div>
              </div>

              {/* Operations */}
              <div>
                <h2 className="text-base font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">Operations & Compliance</h2>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Number of Employees</label>
                    <input type="number" min="1" className={inputClass} value={formData.numberOfEmployees} onChange={e => set('numberOfEmployees', e.target.value)} />
                  </div>

                  <div>
                    <p className={labelClass}>Compensation Model for Apprentice *</p>
                    <div className="space-y-2 mt-1">
                      {COMPENSATION_MODELS.map(opt => (
                        <label key={opt.value} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${formData.compensationModel === opt.value ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="compensationModel" value={opt.value} checked={formData.compensationModel === opt.value} onChange={() => set('compensationModel', opt.value)} className="accent-pink-600" />
                          <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className={labelClass}>Workers&apos; Compensation Insurance *</p>
                    <div className="space-y-2 mt-1">
                      {WORKERS_COMP_OPTIONS.map(opt => (
                        <label key={opt.value} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${formData.workersCompStatus === opt.value ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="workersCompStatus" value={opt.value} checked={formData.workersCompStatus === opt.value} onChange={() => set('workersCompStatus', opt.value)} className="accent-pink-600" />
                          <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className={labelClass}>General Liability Insurance *</p>
                    <div className="flex gap-3 mt-1">
                      {['yes', 'no'].map(v => (
                        <label key={v} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 cursor-pointer transition-colors ${formData.hasGeneralLiability === v ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="hasGeneralLiability" value={v} checked={formData.hasGeneralLiability === v} onChange={() => set('hasGeneralLiability', v)} className="accent-pink-600" />
                          <span className="text-sm font-medium text-slate-900 capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className={labelClass}>Can you supervise, mentor, and verify apprentice hours? *</p>
                    <div className="flex gap-3 mt-1">
                      {['yes', 'no'].map(v => (
                        <label key={v} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 cursor-pointer transition-colors ${formData.canSuperviseAndVerify === v ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="canSuperviseAndVerify" value={v} checked={formData.canSuperviseAndVerify === v} onChange={() => set('canSuperviseAndVerify', v)} className="accent-pink-600" />
                          <span className="text-sm font-medium text-slate-900 capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass} htmlFor="notes">Additional Notes</label>
                <textarea id="notes" rows={3} className={inputClass} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything else you'd like us to know about your spa or your interest in the program..." />
              </div>

              {/* Acknowledgements */}
              <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.mouAcknowledged} onChange={e => set('mouAcknowledged', e.target.checked)} className="mt-0.5 accent-pink-600 flex-shrink-0" />
                  <span className="text-xs text-slate-700">
                    I understand that approved host sites will be required to sign a Memorandum of Understanding (MOU) with Elevate for Humanity outlining host site responsibilities, apprentice supervision requirements, and wage obligations.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.consentAcknowledged} onChange={e => set('consentAcknowledged', e.target.checked)} className="mt-0.5 accent-pink-600 flex-shrink-0" />
                  <span className="text-xs text-slate-700">
                    I consent to Elevate for Humanity contacting me regarding this application and the esthetician apprenticeship program. I confirm the information provided is accurate to the best of my knowledge.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Application <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Questions? Email{' '}
                <a href="mailto:partners@elevateforhumanity.org" className="text-pink-600 hover:underline">
                  partners@elevateforhumanity.org
                </a>{' '}
                or call{' '}
                <a href="tel:3173143757" className="text-pink-600 hover:underline">(317) 314-3757</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
