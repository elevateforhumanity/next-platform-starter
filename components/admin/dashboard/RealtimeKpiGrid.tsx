'use client';

/**
 * Wraps KpiGrid with Supabase realtime subscriptions.
 * Patches KPI values in-place as DB rows change — no full page reload needed.
 *
 * Subscribed tables → KPI label mapping:
 *   program_enrollments (INSERT/UPDATE) → "Active Learners"
 *   applications        (INSERT/UPDATE) → "Applications"
 *   payment_transactions (INSERT)       → "Revenue This Month"
 *   program_completion_certificates (INSERT) → "Certificates Issued"
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { KpiGrid } from './KpiGrid';
import type { KPICard } from './types';

interface Props {
  kpis: KPICard[];
}

function patchKpi(cards: KPICard[], labelFragment: string, updater: (v: number) => number): KPICard[] {
  return cards.map(c =>
    c.label.toLowerCase().includes(labelFragment)
      ? { ...c, value: Math.max(0, updater(c.value)) }
      : c
  );
}

export function RealtimeKpiGrid({ kpis: initialKpis }: Props) {
  const [kpis, setKpis] = useState<KPICard[]>(initialKpis);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const sb = createClient(url, key);

    const channel = sb.channel('dashboard-kpi-realtime')
      // ── Enrollments ──────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'program_enrollments' }, () => {
        setKpis(k => patchKpi(k, 'learner', v => v + 1));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'program_enrollments' }, (payload) => {
        // program_enrollments uses enrollment_state, not status
        const ACTIVE_STATES = ['active', 'enrolled', 'onboarding'];
        const wasActive = ACTIVE_STATES.includes(payload.old?.enrollment_state);
        const isActive  = ACTIVE_STATES.includes(payload.new?.enrollment_state);
        if (!wasActive && isActive)  setKpis(k => patchKpi(k, 'learner', v => v + 1));
        if (wasActive  && !isActive) setKpis(k => patchKpi(k, 'learner', v => v - 1));

        // Revenue delta on same UPDATE event
        const prev: number = payload.old?.amount_paid_cents ?? 0;
        const next: number = payload.new?.amount_paid_cents ?? 0;
        const delta = next - prev;
        if (delta > 0) setKpis(k => patchKpi(k, 'revenue', v => v + delta));
      })
      // ── Applications ─────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, (payload) => {
        if (['pending', 'submitted'].includes(payload.new?.status)) {
          setKpis(k => patchKpi(k, 'application', v => v + 1));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, (payload) => {
        const pending = ['pending', 'submitted'];
        const wasPending = pending.includes(payload.old?.status);
        const isPending  = pending.includes(payload.new?.status);
        if (!wasPending && isPending)  setKpis(k => patchKpi(k, 'application', v => v + 1));
        if (wasPending  && !isPending) setKpis(k => patchKpi(k, 'application', v => v - 1));
      })
      // ── Certificates ──────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'program_completion_certificates' }, () => {
        setKpis(k => patchKpi(k, 'certificate', v => v + 1));
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, []);

  return <KpiGrid kpis={kpis} />;
}
