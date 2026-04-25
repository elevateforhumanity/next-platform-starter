import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Shield, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compliance Dashboard | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

export default async function ComplianceDashboardPage() {
  await requireRole(['admin', 'super_admin']);
  const db = getAdminClient();

  const [alertsRes, resolvedRes, wioaRes] = await Promise.all([
    db.from('compliance_alerts')
      .select('id, alert_type, severity, title, description, entity_type, resolved, created_at')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('compliance_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('resolved', true),
    db.from('wioa_participants')
      .select('id, status', { count: 'exact' })
      .limit(1),
  ]);

  const alerts = alertsRes.data ?? [];
  const resolvedCount = resolvedRes.count ?? 0;
  const wioaTotal = wioaRes.count ?? 0;

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;

  const bySeverity: Record<string, typeof alerts> = {};
  for (const a of alerts) {
    if (!bySeverity[a.severity]) bySeverity[a.severity] = [];
    bySeverity[a.severity].push(a);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" /> Compliance Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Active alerts, WIOA status, and regulatory overview</p>
          </div>
          <Link href="/admin/compliance" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            Full compliance center <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open Alerts', value: alerts.length, color: alerts.length > 0 ? 'text-red-600' : 'text-green-600' },
            { label: 'Critical', value: criticalCount, color: criticalCount > 0 ? 'text-red-600' : 'text-slate-400' },
            { label: 'High', value: highCount, color: highCount > 0 ? 'text-orange-600' : 'text-slate-400' },
            { label: 'Resolved (All Time)', value: resolvedCount, color: 'text-green-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* WIOA quick stat */}
        {wioaTotal > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">{wioaTotal} WIOA participants tracked</span>
            </div>
            <Link href="/admin/compliance" className="text-sm text-blue-600 hover:underline">View WIOA →</Link>
          </div>
        )}

        {/* Alerts by severity */}
        {alerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-green-800">No open compliance alerts</p>
            <p className="text-sm text-green-600 mt-1">All compliance checks are passing.</p>
          </div>
        ) : (
          ['critical', 'high', 'medium', 'low'].map((severity) => {
            const group = bySeverity[severity];
            if (!group?.length) return null;
            return (
              <div key={severity} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${severity === 'critical' ? 'text-red-500' : severity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`} />
                  <h2 className="font-semibold text-slate-800 capitalize">{severity} ({group.length})</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.map((alert) => (
                    <div key={alert.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-900">{alert.title}</div>
                        {alert.description && <div className="text-sm text-slate-500 mt-0.5">{alert.description}</div>}
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.created_at).toLocaleDateString()}
                          {alert.entity_type && <span>· {alert.entity_type}</span>}
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[alert.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
