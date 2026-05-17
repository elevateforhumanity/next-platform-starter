'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle, Upload, X } from 'lucide-react';

const WORKERS_COMP_OPTIONS = [
  { value: 'verified', label: "Yes — we carry Workers' Compensation insurance" },
  { value: 'exempt', label: 'Exempt — we have a valid state exemption (will provide documentation)' },
  { value: 'none', label: "No — we do not currently carry Workers' Compensation" },
];

const COMPENSATION_MODELS = [
  { value: 'hourly', label: 'Hourly Wage' },
  { value: 'hybrid', label: 'Hybrid (Hourly Base + Commission)' },
];

interface DocFile { file: File | null; name: string; data: string | null; }
const emptyDoc = (): DocFile => ({ file: null, name: '', data: null });

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FileSlot({ label, hint, value, onChange }: {
  label: string; hint: string;
  value: DocFile; onChange: (d: DocFile) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    onChange({ file, name: file.name, data: await fileToBase64(file) });
  };
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
      <p className="text-xs text-slate-500 mb-2">{hint}</p>
      {value.file ? (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-green-800 truncate flex-1">{value.name}</span>
          <button type="button" onClick={() => { onChange(emptyDoc()); if (ref.current) ref.current.value = ''; }}>
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors w-full">
          <Upload className="w-4 h-4 shrink-0" /> Choose file (PDF or image)
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
    </div>
  );
}

const INITIAL = {
  salonLegalName: '', salonDbaName: '', ownerName: '',
  contactName: '', contactEmail: '', contactPhone: '',
  salonAddressLine1: '', salonAddressLine2: '',
  salonCity: '', salonState: 'IN', salonZip: '',
  indianaSalonLicenseNumber: '',
  supervisorName: '', supervisorLicenseNumber: '', supervisorYearsLicensed: '',
  compensationModel: '', numberOfEmployees: '',
  workersCompStatus: '', hasGeneralLiability: '', canSuperviseAndVerify: '',
  mouAcknowledged: false, consentAcknowledged: false, notes: '',
};

export default function CosmetologyPartnerShopForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [form, setForm] = useState(INITIAL);

  const [einDoc, setEinDoc] = useState<DocFile>(emptyDoc());
  const [salonLicenseDoc, setSalonLicenseDoc] = useState<DocFile>(emptyDoc());
  const [supervisorLicenseDoc, setSupervisorLicenseDoc] = useState<DocFile>(emptyDoc());
  const [workersCompDoc, setWorkersCompDoc] = useState<DocFile>(emptyDoc());
  const [liabilityDoc, setLiabilityDoc] = useState<DocFile>(emptyDoc());

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mouAcknowledged || !form.consentAcknowledged) {
      setError('You must acknowledge the MOU and consent to proceed.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partners/cosmetology-apprenticeship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          programType: 'cosmetology',
          einFileData: einDoc.data, einFileName: einDoc.name,
          salonLicenseFileData: salonLicenseDoc.data, salonLicenseFileName: salonLicenseDoc.name,
          supervisorLicenseFileData: supervisorLicenseDoc.data, supervisorLicenseFileName: supervisorLicenseDoc.name,
          workersCompFileData: workersCompDoc.data, workersCompFileName: workersCompDoc.name,
          liabilityInsuranceFileData: liabilityDoc.data, liabilityInsuranceFileName: liabilityDoc.name,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Submission failed');
      }
      setSubmittedEmail(form.contactEmail);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Application Submitted</h2>
        <p className="text-slate-600 mb-6">
          Your salon application has been received. We&apos;ve sent a password setup link to{' '}
          <strong>{submittedEmail}</strong> — check your inbox to create your account and sign the MOU.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-purple-900 font-bold text-sm mb-2">What happens next:</p>
          <ol className="space-y-1 text-purple-800 text-sm list-decimal list-inside">
            <li>Check your email for the account setup link</li>
            <li>Set your password and log in</li>
            <li>Sign the Memorandum of Understanding (MOU)</li>
            <li>Upload any remaining documents</li>
            <li>Receive apprentice placement</li>
          </ol>
        </div>
        <p className="text-sm text-slate-500">
          Didn&apos;t receive the email?{' '}
          <a href="tel:3173143757" className="text-purple-600 hover:underline font-medium">(317) 314-3757</a>
        </p>
      </div>
    );
  }

  const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const lbl = 'block text-sm font-medium text-slate-700 mb-1';
  const sec = 'bg-white rounded-xl border border-slate-200 p-6 space-y-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-red-600 shrink-0 mt-0.5" />
          <p className="text-brand-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Salon Information */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Salon Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Salon Legal Name *</label>
            <input required className={inp} value={form.salonLegalName} onChange={(e) => set('salonLegalName', e.target.value)} /></div>
          <div><label className={lbl}>DBA / Trade Name</label>
            <input className={inp} value={form.salonDbaName} onChange={(e) => set('salonDbaName', e.target.value)} placeholder="If different from legal name" /></div>
          <div><label className={lbl}>Owner Name *</label>
            <input required className={inp} value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} /></div>
          <div><label className={lbl}>Indiana Salon License Number *</label>
            <input required className={inp} value={form.indianaSalonLicenseNumber} onChange={(e) => set('indianaSalonLicenseNumber', e.target.value)} placeholder="IPLA license number" /></div>
        </div>
        <div><label className={lbl}>Street Address *</label>
          <input required className={inp} value={form.salonAddressLine1} onChange={(e) => set('salonAddressLine1', e.target.value)} /></div>
        <div><label className={lbl}>Suite / Unit</label>
          <input className={inp} value={form.salonAddressLine2} onChange={(e) => set('salonAddressLine2', e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><label className={lbl}>City *</label>
            <input required className={inp} value={form.salonCity} onChange={(e) => set('salonCity', e.target.value)} /></div>
          <div><label className={lbl}>ZIP *</label>
            <input required className={inp} value={form.salonZip} onChange={(e) => set('salonZip', e.target.value)} maxLength={10} /></div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Primary Contact</h2>
        <p className="text-slate-500 text-sm">Your account will be created using this email address.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Contact Name *</label>
            <input required className={inp} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></div>
          <div><label className={lbl}>Contact Email *</label>
            <input required type="email" className={inp} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
          <div><label className={lbl}>Contact Phone *</label>
            <input required type="tel" className={inp} value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></div>
        </div>
      </div>

      {/* Supervising Cosmetologist */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Supervising Cosmetologist</h2>
        <p className="text-slate-500 text-sm">Must hold a current Indiana cosmetology license and will verify apprentice hours and competencies.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Supervisor Full Name *</label>
            <input required className={inp} value={form.supervisorName} onChange={(e) => set('supervisorName', e.target.value)} /></div>
          <div><label className={lbl}>Indiana Cosmetology License # *</label>
            <input required className={inp} value={form.supervisorLicenseNumber} onChange={(e) => set('supervisorLicenseNumber', e.target.value)} /></div>
          <div><label className={lbl}>Years Licensed *</label>
            <input required type="number" min="1" className={inp} value={form.supervisorYearsLicensed} onChange={(e) => set('supervisorYearsLicensed', e.target.value)} /></div>
        </div>
      </div>

      {/* Employment & Compliance */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Employment &amp; Compliance</h2>
        <div className="space-y-4">
          <div><label className={lbl}>Compensation Model *</label>
            <select required className={inp} value={form.compensationModel} onChange={(e) => set('compensationModel', e.target.value)}>
              <option value="">Select...</option>
              {COMPENSATION_MODELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></div>
          <div><label className={lbl}>Number of Current Employees</label>
            <input type="number" min="1" className={inp} value={form.numberOfEmployees} onChange={(e) => set('numberOfEmployees', e.target.value)} /></div>
          <div><label className={lbl}>Workers&apos; Compensation Insurance *</label>
            <select required className={inp} value={form.workersCompStatus} onChange={(e) => set('workersCompStatus', e.target.value)}>
              <option value="">Select...</option>
              {WORKERS_COMP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {form.workersCompStatus === 'none' && (
              <p className="text-amber-600 text-xs mt-1">⚠️ Workers&apos; compensation coverage is required before apprentice placement can begin.</p>
            )}</div>
          <div><label className={lbl}>General Liability Insurance *</label>
            <select required className={inp} value={form.hasGeneralLiability} onChange={(e) => set('hasGeneralLiability', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes — we carry general liability insurance</option>
              <option value="no">No</option>
            </select></div>
          <div><label className={lbl}>Can you supervise and verify apprentice hours weekly? *</label>
            <select required className={inp} value={form.canSuperviseAndVerify} onChange={(e) => set('canSuperviseAndVerify', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select></div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Documents</h2>
        <p className="text-slate-500 text-sm">Upload now to speed up onboarding. All documents can also be submitted after approval.</p>
        <div className="space-y-5">
          <FileSlot label="IRS EIN Assignment Letter (CP-575 or 147C)"
            hint="Required for DOL RAPIDS worksite registration. Must show EIN matching your salon legal name."
            value={einDoc} onChange={setEinDoc} />
          <FileSlot label="Indiana Salon License"
            hint="Full copy — must show license number, expiration date, licensee name, and salon address."
            value={salonLicenseDoc} onChange={setSalonLicenseDoc} />
          <FileSlot label="Supervising Cosmetologist License"
            hint="Current Indiana cosmetology license for your designated supervisor."
            value={supervisorLicenseDoc} onChange={setSupervisorLicenseDoc} />
          <FileSlot label="Workers' Compensation Certificate"
            hint="Certificate of insurance from your carrier showing effective and expiration dates."
            value={workersCompDoc} onChange={setWorkersCompDoc} />
          <FileSlot label="General Liability Insurance Certificate"
            hint="Certificate of general liability insurance for your salon."
            value={liabilityDoc} onChange={setLiabilityDoc} />
        </div>
      </div>

      {/* Notes */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Additional Information</h2>
        <label className={lbl}>Notes (optional)</label>
        <textarea rows={3} className={inp} value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Anything else we should know about your salon or training capacity..." />
      </div>

      {/* Acknowledgments */}
      <div className={sec}>
        <h2 className="text-lg font-bold text-slate-900">Acknowledgments</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-purple-600"
            checked={form.mouAcknowledged} onChange={(e) => set('mouAcknowledged', e.target.checked)} />
          <span className="text-sm text-slate-700">
            I have read and agree to the{' '}
            <Link href="/partners/cosmetology-partner-shop/sign-mou" className="text-purple-600 hover:underline font-medium">
              Memorandum of Understanding
            </Link>{' '}
            for the Cosmetology Apprenticeship Program and understand my responsibilities as a host salon.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-purple-600"
            checked={form.consentAcknowledged} onChange={(e) => set('consentAcknowledged', e.target.checked)} />
          <span className="text-sm text-slate-700">
            I certify that all information provided is accurate and complete. I understand that false or misleading information may result in disqualification from the program.
          </span>
        </label>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors text-base">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : 'Submit Partner Application'}
      </button>

      <p className="text-center text-slate-500 text-xs">
        Questions?{' '}
        <Link href="/contact" className="text-purple-600 hover:underline">Contact us</Link>{' '}
        or call{' '}
        <a href="tel:3173143757" className="text-purple-600 hover:underline">(317) 314-3757</a>
      </p>
    </form>
  );
}
