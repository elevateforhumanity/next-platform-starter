'use client';

import { useState } from 'react';
import {
  Building2, Save, Loader2, CheckCircle2, AlertTriangle,
  Plus, Trash2, ShieldCheck, X, RefreshCw,
} from 'lucide-react';

type Org = {
  id: string;
  legal_name: string | null;
  dba_name: string | null;
  ein: string | null;
  uei: string | null;
  sam_status: string | null;
  sam_expiration: string | null;
  website: string | null;
  phone: string | null;
  general_email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  authorized_signatory_name: string | null;
  authorized_signatory_title: string | null;
} | null;

type Fact = {
  id: string;
  fact_key: string;
  fact_value_json: unknown;
  source_type: string | null;
  source_reference: string | null;
  status: string;
  approved_at: string | null;
  updated_at: string;
};

function factStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && 'value' in (v as Record<string, unknown>))
    return String((v as Record<string, unknown>).value);
  return JSON.stringify(v);
}

const ORG_FIELDS: { key: keyof Org; label: string; placeholder?: string; type?: string }[] = [
  { key: 'legal_name', label: 'Legal Name', placeholder: 'Elevate for Humanity Inc.' },
  { key: 'dba_name', label: 'DBA Name', placeholder: 'Elevate for Humanity' },
  { key: 'ein', label: 'EIN', placeholder: 'XX-XXXXXXX' },
  { key: 'uei', label: 'UEI (SAM.gov)', placeholder: '12-character UEI' },
  { key: 'sam_status', label: 'SAM Status', placeholder: 'Active' },
  { key: 'sam_expiration', label: 'SAM Expiration', type: 'date' },
  { key: 'website', label: 'Website', placeholder: 'https://elevateforhumanity.org' },
  { key: 'phone', label: 'Phone', placeholder: '(317) 555-0100' },
  { key: 'general_email', label: 'General Email', placeholder: 'info@elevateforhumanity.org' },
  { key: 'address_line_1', label: 'Address Line 1', placeholder: '123 Main St' },
  { key: 'address_line_2', label: 'Address Line 2', placeholder: 'Suite 100' },
  { key: 'city', label: 'City', placeholder: 'Indianapolis' },
  { key: 'state', label: 'State', placeholder: 'IN' },
  { key: 'zip', label: 'ZIP', placeholder: '46201' },
  { key: 'authorized_signatory_name', label: 'Authorized Signatory', placeholder: 'Jane Smith' },
  { key: 'authorized_signatory_title', label: 'Signatory Title', placeholder: 'Executive Director' },
];

export default function OrgProfileClient({ org, facts: initialFacts }: { org: Org; facts: Fact[] }) {
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(ORG_FIELDS.map(f => [f.key, String((org as Record<string, unknown> | null)?.[f.key] ?? '')]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [facts, setFacts] = useState<Fact[]>(initialFacts);
  const [newFactKey, setNewFactKey] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [addingFact, setAddingFact] = useState(false);
  const [samChecking, setSamChecking] = useState(false);
  const [samResult, setSamResult] = useState<string | null>(null);

  async function saveOrg() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings/organization', {
        method: org ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: org?.id, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addFact() {
    if (!newFactKey.trim() || !newFactValue.trim()) return;
    setAddingFact(true);
    try {
      const res = await fetch('/api/admin/settings/organization/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fact_key: newFactKey.trim(),
          fact_value_json: newFactValue.trim(),
          source_type: 'admin_manual',
          status: 'approved',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { fact } = await res.json();
      setFacts(prev => [...prev.filter(f => f.fact_key !== fact.fact_key), fact]);
      setNewFactKey('');
      setNewFactValue('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add fact');
    } finally {
      setAddingFact(false);
    }
  }

  async function deleteFact(id: string) {
    try {
      const res = await fetch(`/api/admin/settings/organization/facts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setFacts(prev => prev.filter(f => f.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function checkSam() {
    setSamChecking(true);
    setSamResult(null);
    try {
      const uei = form.uei?.trim();
      if (!uei) { setSamResult('Enter a UEI first'); return; }
      const res = await fetch(`/api/admin/grants/sam/entity?uei=${encodeURIComponent(uei)}`);
      const data = await res.json();
      if (!res.ok) { setSamResult(data.error ?? 'SAM lookup failed'); return; }
      setSamResult(`SAM Status: ${data.samStatus ?? 'Unknown'} · Expiry: ${data.expirationDate ?? '—'}`);
      if (data.samStatus) setForm(f => ({ ...f, sam_status: data.samStatus }));
      if (data.expirationDate) setForm(f => ({ ...f, sam_expiration: data.expirationDate }));
    } catch {
      setSamResult('SAM lookup failed');
    } finally {
      setSamChecking(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Core org fields */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Legal Identity</h2>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            <button
              onClick={saveOrg}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ORG_FIELDS.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
              <div className="flex gap-2">
                <input
                  type={field.type ?? 'text'}
                  value={form[field.key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {field.key === 'uei' && (
                  <button
                    onClick={checkSam}
                    disabled={samChecking}
                    title="Verify in SAM.gov"
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-colors disabled:opacity-50"
                  >
                    {samChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {field.key === 'uei' && samResult && (
                <p className="text-xs mt-1 text-slate-500">{samResult}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Org facts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Organization Facts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved facts used to prefill contracts and grant applications.
            </p>
          </div>
          <span className="text-xs text-slate-400">{facts.length} facts</span>
        </div>

        {/* Add new fact */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFactKey}
              onChange={e => setNewFactKey(e.target.value)}
              placeholder="fact_key (e.g. cage_code)"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <input
              type="text"
              value={newFactValue}
              onChange={e => setNewFactValue(e.target.value)}
              placeholder="Value"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <button
              onClick={addFact}
              disabled={addingFact || !newFactKey.trim() || !newFactValue.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {addingFact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </div>

        {facts.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No facts recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {facts.map(fact => (
              <div key={fact.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-48 shrink-0 truncate">
                  {fact.fact_key}
                </code>
                <span className="flex-1 text-sm text-slate-800 truncate">{factStr(fact.fact_value_json)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  fact.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {fact.status}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{fact.source_type ?? '—'}</span>
                <button
                  onClick={() => deleteFact(fact.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
