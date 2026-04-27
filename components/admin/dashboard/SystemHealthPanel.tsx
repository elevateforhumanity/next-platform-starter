// Server component — no "use client"
import Link from "next/link";
import {
  CheckCircle2, XCircle, AlertTriangle, Info,
  Wifi, Key, Clock, FileText, Award, Flag,
} from "lucide-react";
import type { SystemHealth } from "./types";

const SEVERITY_STYLES = {
  critical: {
    row: "bg-rose-50 border-rose-200",
    icon: "text-rose-500",
    text: "text-rose-800",
    sub: "text-rose-600",
    Icon: XCircle,
  },
  warning: {
    row: "bg-amber-50 border-amber-200",
    icon: "text-amber-500",
    text: "text-amber-800",
    sub: "text-amber-600",
    Icon: AlertTriangle,
  },
  info: {
    row: "bg-blue-50 border-blue-200",
    icon: "text-blue-500",
    text: "text-blue-800",
    sub: "text-blue-600",
    Icon: Info,
  },
} as const;

const CODE_ICONS: Record<string, React.ElementType> = {
  missing_env_vars:              Key,
  stripe_webhook_secret_missing: Wifi,
  stale_jobs:                    Clock,
  missing_documents:             FileText,
  missing_certifications:        Award,
  unresolved_flags:              Flag,
};

interface Props {
  health: SystemHealth;
}

export function SystemHealthPanel({ health }: Props) {
  const alerts = health.alerts ?? [];
  const isOk = !health.degraded && alerts.length === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">System Health</h2>
        <div className="flex items-center gap-2">
          {isOk ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> All systems operational
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-100 text-rose-700">
              <XCircle className="w-3.5 h-3.5" /> {alerts.length} issue{alerts.length !== 1 ? "s" : ""}
            </span>
          )}
          <Link
            href="/admin/system-health"
            className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
          >
            Details →
          </Link>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Status grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[
            {
              label: "Stripe Webhook",
              ok: health.stripeWebhookOk,
              href: "/admin/integrations/stripe",
            },
            {
              label: "Build Env",
              ok: health.buildEnvOk,
              href: "/admin/integrations/env-manager",
            },
            {
              label: "Stale Jobs",
              ok: health.staleJobs === 0,
              value: health.staleJobs > 0 ? `${health.staleJobs} stuck` : "Clear",
              href: "/admin/automation",
            },
            {
              label: "Missing Docs",
              ok: health.missingDocuments === 0,
              value: health.missingDocuments > 0 ? `${health.missingDocuments} missing` : "Clear",
              href: "/admin/program-holder-documents",
            },
            {
              label: "Certifications",
              ok: health.missingCertifications === 0,
              value: health.missingCertifications > 0 ? `${health.missingCertifications} pending` : "Clear",
              href: "/admin/certificates",
            },
            {
              label: "Compliance Flags",
              ok: health.unresolvedFlags === 0,
              value: health.unresolvedFlags > 0 ? `${health.unresolvedFlags} open` : "Clear",
              href: "/admin/compliance",
            },
          ].map(({ label, ok, value, href }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors hover:shadow-sm ${
                ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span className="truncate">{label}</span>
              {!ok && value && (
                <span className="ml-auto font-bold flex-shrink-0">{value}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Alert list */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const styles = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
              const AlertIcon = CODE_ICONS[alert.code] ?? styles.Icon;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${styles.row}`}
                >
                  <AlertIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.icon}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${styles.text}`}>
                      {alert.code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className={`text-xs mt-0.5 ${styles.sub}`}>{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isOk && (
          <p className="text-xs text-slate-400 text-center py-2">
            No active alerts. All checks passed.
          </p>
        )}
      </div>
    </div>
  );
}
