'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Repeat,
  FileText,
} from 'lucide-react';

interface Charge {
  id: string;
  amountCents: number;
  amountFormatted: string;
  status: string;
  paid: boolean;
  created: string;
  description: string | null;
  receiptUrl: string | null;
  failureMessage: string | null;
}

interface Invoice {
  id: string;
  amountPaidCents: number;
  amountDueCents: number;
  amountPaidFormatted: string;
  status: string;
  paid: boolean;
  created: string;
  description: string | null;
  hostedInvoiceUrl: string | null;
}

interface Subscription {
  id: string;
  status: string;
  isActive: boolean;
  weeklyAmountCents: number;
  weeklyAmountFormatted: string;
  currentPeriodEnd: string;
  created: string;
}

interface Student {
  customerId: string;
  name: string;
  email: string;
  enrollmentId: string;
  totalPaidCents: number;
  totalPaidFormatted: string;
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  charges: Charge[];
  invoices: Invoice[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    succeeded: { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    paid: { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    active: { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
    incomplete_expired: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
    void: { color: 'bg-slate-100 text-slate-500', icon: <XCircle className="w-3 h-3" /> },
    canceled: { color: 'bg-slate-100 text-slate-500', icon: <XCircle className="w-3 h-3" /> },
    pending: { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
    open: { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
  };
  const style = map[status] ?? { color: 'bg-slate-100 text-slate-500', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.color}`}>
      {style.icon}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ApprenticePaymentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stripe-apprentice-payments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setStudents(data.students);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalCollected = students.reduce((s, st) => s + st.totalPaidCents, 0);
  const activeSubCount = students.filter((s) => s.hasActiveSubscription).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading Stripe data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button onClick={load} className="mt-3 text-xs text-red-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-violet-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Barber Apprentice Payments</h1>
            <p className="text-sm text-slate-500">Live data from Stripe</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 border rounded-lg px-3 py-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Collected</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCollected / 100)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">successful charges only</p>
        </div>
        <div className="rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Active Subscriptions</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeSubCount} / {students.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">weekly billing active</p>
        </div>
        <div className="rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Students</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{students.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">barber apprentices</p>
        </div>
      </div>

      {/* Per-student cards */}
      {students.map((student) => {
        const isOpen = expanded === student.customerId;
        const successfulCharges = student.charges.filter((c) => c.paid && c.status === 'succeeded');
        const failedCharges = student.charges.filter((c) => !c.paid || c.status === 'failed');
        const paidInvoices = student.invoices.filter((i) => i.paid && i.amountPaidCents > 0);

        return (
          <div key={student.customerId} className="rounded-xl border shadow-sm overflow-hidden">
            {/* Student header row */}
            <button
              className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-50 text-left"
              onClick={() => setExpanded(isOpen ? null : student.customerId)}
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                  {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{student.totalPaidFormatted}</p>
                  <p className="text-xs text-slate-400">collected</p>
                </div>
                <div>
                  {student.subscription ? (
                    <StatusBadge status={student.subscription.status} />
                  ) : (
                    <span className="text-xs text-slate-400">no subscription</span>
                  )}
                </div>
                <div className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t bg-slate-50 px-6 py-5 space-y-6">
                {/* Subscription */}
                {student.subscription && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" /> Subscription
                    </h3>
                    <div className="rounded-lg border bg-white p-4 flex flex-wrap gap-6 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">ID</p>
                        <p className="font-mono text-xs text-slate-600">{student.subscription.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Status</p>
                        <StatusBadge status={student.subscription.status} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Weekly Amount</p>
                        <p className="font-medium text-slate-900">{student.subscription.weeklyAmountFormatted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Current Period End</p>
                        <p className="text-slate-700">{fmt(student.subscription.currentPeriodEnd)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Created</p>
                        <p className="text-slate-700">{fmt(student.subscription.created)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Stripe Dashboard</p>
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${student.subscription.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charges */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Charges ({student.charges.length})
                  </h3>
                  {student.charges.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No charges on record.</p>
                  ) : (
                    <div className="rounded-lg border bg-white overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Date</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Amount</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Status</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Description</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {student.charges.map((c) => (
                            <tr key={c.id} className={c.paid ? '' : 'bg-red-50'}>
                              <td className="px-4 py-2 text-slate-600">{fmt(c.created)}</td>
                              <td className="px-4 py-2 font-medium text-slate-900">{c.amountFormatted}</td>
                              <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                              <td className="px-4 py-2 text-slate-500 text-xs max-w-xs truncate">
                                {c.description ?? '—'}
                                {c.failureMessage && (
                                  <span className="block text-red-500">{c.failureMessage}</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {c.receiptUrl ? (
                                  <a href={c.receiptUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
                                    View <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Invoices ({student.invoices.length})
                  </h3>
                  {student.invoices.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No invoices on record.</p>
                  ) : (
                    <div className="rounded-lg border bg-white overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Date</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Amount Paid</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Amount Due</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Status</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Description</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {student.invoices.map((i) => (
                            <tr key={i.id}>
                              <td className="px-4 py-2 text-slate-600">{fmt(i.created)}</td>
                              <td className="px-4 py-2 font-medium text-slate-900">{i.amountPaidFormatted}</td>
                              <td className="px-4 py-2 text-slate-500">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(i.amountDueCents / 100)}
                              </td>
                              <td className="px-4 py-2"><StatusBadge status={i.status ?? 'unknown'} /></td>
                              <td className="px-4 py-2 text-slate-500 text-xs max-w-xs truncate">{i.description ?? '—'}</td>
                              <td className="px-4 py-2">
                                {i.hostedInvoiceUrl ? (
                                  <a href={i.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
                                    View <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Stripe customer link */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://dashboard.stripe.com/customers/${student.customerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:underline font-medium"
                  >
                    Open full customer in Stripe Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs text-slate-400 font-mono">{student.customerId}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
