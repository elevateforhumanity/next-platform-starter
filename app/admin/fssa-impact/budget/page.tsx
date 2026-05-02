import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import BudgetForm from '@/components/admin/fssa/BudgetForm';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Budget Tracker | FSSA SNAP E&T | Admin',
};

function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function currentFY() {
  const now = new Date();
  return now.getMonth() >= 6 ? `FY${now.getFullYear() + 1}` : `FY${now.getFullYear()}`;
}

export default async function FssaBudgetPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();
  if (!db) notFound();
  const fy = currentFY();

  const { data: rows } = await db
    .from('fssa_budget')
    .select('id, fiscal_year, quarter, category, line_item, budgeted_amount, expended_amount, encumbered, notes, created_at')
    .order('fiscal_year', { ascending: false })
    .order('category')
    .limit(200);

  const budgetRows = rows ?? [];

  const totalBudgeted = budgetRows.reduce((s, r) => s + (r.budgeted_amount ?? 0), 0);
  const totalExpended = budgetRows.reduce((s, r) => s + (r.expended_amount ?? 0), 0);
  const totalEncumbered = budgetRows.reduce((s, r) => s + (r.encumbered ?? 0), 0);
  const estimatedReimbursement = totalExpended * 0.5;

  const CATEGORY_LABELS: Record<string, string> = {
    personnel: 'Personnel / Instruction',
    training: 'Training Materials',
    support_services: 'Support Services',
    admin: 'Administrative',
    testing: 'Credential Testing',
    other: 'Other',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
              { label: 'Budget' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/fssa-impact" className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Budget Tracker</h1>
            <p className="text-sm text-slate-500">SNAP E&T cost tracking and 50% reimbursement calculation</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Budgeted', value: fmt$(totalBudgeted), color: 'slate' },
            { label: 'Expended', value: fmt$(totalExpended), color: 'amber' },
            { label: 'Encumbered', value: fmt$(totalEncumbered), color: 'blue' },
            { label: 'Est. Reimbursement (50%)', value: fmt$(estimatedReimbursement), color: 'green' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className="text-xl font-bold text-slate-900">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add line */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Add Budget Line</h2>
            <BudgetForm />
          </div>

          {/* By category summary */}
          {budgetRows.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">By Category — {fy}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4 text-right">Budgeted</th>
                    <th className="pb-2 text-right">Expended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(
                    budgetRows
                      .filter((r) => r.fiscal_year === fy)
                      .reduce((acc, r) => {
                        const cat = r.category ?? 'other';
                        if (!acc[cat]) acc[cat] = { budgeted: 0, expended: 0 };
                        acc[cat].budgeted += r.budgeted_amount ?? 0;
                        acc[cat].expended += r.expended_amount ?? 0;
                        return acc;
                      }, {} as Record<string, { budgeted: number; expended: number }>)
                  ).map(([cat, totals]) => (
                    <tr key={cat}>
                      <td className="py-2 pr-4 text-slate-700">{CATEGORY_LABELS[cat] ?? cat}</td>
                      <td className="py-2 pr-4 text-right text-slate-600">{fmt$(totals.budgeted)}</td>
                      <td className="py-2 text-right font-medium text-slate-800">{fmt$(totals.expended)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Full ledger */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Full Ledger</h2>
          {budgetRows.length === 0 ? (
            <p className="text-sm text-slate-400">No budget lines entered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="pb-2 pr-3">FY</th>
                    <th className="pb-2 pr-3">Q</th>
                    <th className="pb-2 pr-3">Category</th>
                    <th className="pb-2 pr-3">Line Item</th>
                    <th className="pb-2 pr-3 text-right">Budgeted</th>
                    <th className="pb-2 pr-3 text-right">Expended</th>
                    <th className="pb-2 text-right">Reimb. (50%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgetRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 text-slate-500">{r.fiscal_year}</td>
                      <td className="py-2 pr-3 text-slate-500">{r.quarter ?? '—'}</td>
                      <td className="py-2 pr-3 text-slate-600">{CATEGORY_LABELS[r.category] ?? r.category}</td>
                      <td className="py-2 pr-3 text-slate-800 font-medium">{r.line_item}</td>
                      <td className="py-2 pr-3 text-right text-slate-600">{fmt$(r.budgeted_amount ?? 0)}</td>
                      <td className="py-2 pr-3 text-right text-slate-800">{fmt$(r.expended_amount ?? 0)}</td>
                      <td className="py-2 text-right font-semibold text-emerald-700">{fmt$((r.expended_amount ?? 0) * 0.5)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold">
                    <td colSpan={4} className="pt-3 text-slate-700">Total</td>
                    <td className="pt-3 pr-3 text-right text-slate-700">{fmt$(totalBudgeted)}</td>
                    <td className="pt-3 pr-3 text-right text-slate-900">{fmt$(totalExpended)}</td>
                    <td className="pt-3 text-right text-emerald-700">{fmt$(estimatedReimbursement)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
