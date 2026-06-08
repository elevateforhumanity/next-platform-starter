#!/usr/bin/env tsx
/**
 * Read-only verification of program-holder and partner portal readiness (no email, no writes).
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/verify-portal-dashboards.ts
 */
import { createClient } from '@supabase/supabase-js';
import { outboundSiteUrl } from './outbound-site-url';

const SITE = outboundSiteUrl();

type Row = { label: string; ok: boolean; detail: string };

const EXPECTED_HOLDERS: { email: string; minPrograms: number; org?: string }[] = [
  { email: 'mesmerizedbybeautyl@yahoo.com', minPrograms: 3, org: 'Jozanna' },
  { email: 'info@centerofdestiny.org', minPrograms: 4, org: 'Carlina' },
  { email: 'indyondemandservices@gmail.com', minPrograms: 1, org: 'David / INDY ON DEMAND' },
  { email: 'amecosenterprise@gmail.com', minPrograms: 10, org: 'Ameco' },
  { email: 'doreen.hawkins01@outlook.com', minPrograms: 2, org: 'Doreen Hawkins' },
  { email: 'info@enchantedheartstraining.com', minPrograms: 0, org: 'Shawndra (MOU may block)' },
];

const EXPECTED_PARTNERS: { email: string; label: string }[] = [
  { email: 'info@prestigeelevation.com', label: 'Prestige / Elizabeth Greene barber' },
  { email: 'calvincutz1985@gmail.com', label: 'Calvin barber host' },
  { email: 'christopherd.newkirk@gmail.com', label: 'Chris barber host' },
];

function gateHolderDashboard(holder: {
  status: string | null;
  mou_signed: boolean | null;
  approved_at: string | null;
}): { canDashboard: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!holder.approved_at) blockers.push('not approved');
  if (!['approved', 'active'].includes(holder.status ?? '')) blockers.push(`status=${holder.status}`);
  if (!holder.mou_signed) blockers.push('MOU unsigned');
  return { canDashboard: blockers.length === 0, blockers };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env');
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const rows: Row[] = [];
  let fail = 0;

  console.log(`\nPortal verification (read-only) · ${SITE}\n`);

  for (const exp of EXPECTED_HOLDERS) {
    const { data: holder } = await db
      .from('program_holders')
      .select('id, organization_name, contact_email, status, mou_signed, approved_at, user_id')
      .eq('contact_email', exp.email)
      .maybeSingle();

    if (!holder) {
      rows.push({ label: exp.org ?? exp.email, ok: false, detail: 'no program_holders row' });
      fail++;
      continue;
    }

    const { count: progCount } = await db
      .from('program_holder_programs')
      .select('id', { count: 'exact', head: true })
      .eq('program_holder_id', holder.id)
      .eq('status', 'active');

    const programsOk = (progCount ?? 0) >= exp.minPrograms;
    const gate = gateHolderDashboard(holder);

    let mouSigOk = true;
    if (holder.mou_signed && holder.user_id) {
      const { data: sig } = await db
        .from('mou_signatures')
        .select('id')
        .eq('user_id', holder.user_id)
        .maybeSingle();
      mouSigOk = Boolean(sig);
    }

    const { data: prof } = await db
      .from('profiles')
      .select('role, program_holder_id')
      .eq('email', exp.email)
      .maybeSingle();

    const roleOk = prof?.role === 'program_holder' && prof.program_holder_id === holder.id;
    const ok = programsOk && mouSigOk && roleOk && (exp.minPrograms === 0 || programsOk);

    const parts = [
      `programs=${progCount ?? 0}${exp.minPrograms ? ` (need ≥${exp.minPrograms})` : ''}`,
      gate.canDashboard ? 'dashboard=OK' : `dashboard=BLOCKED (${gate.blockers.join(', ')})`,
      mouSigOk ? 'mou_sig=OK' : 'mou_sig=MISSING',
      roleOk ? 'profile=OK' : `profile=bad role=${prof?.role ?? '?'}`,
      `login ${SITE}/login`,
    ];

    if (!ok) fail++;
    rows.push({ label: `${holder.organization_name} <${exp.email}>`, ok, detail: parts.join(' · ') });
  }

  for (const exp of EXPECTED_PARTNERS) {
    const { data: prof } = await db.from('profiles').select('id, role').eq('email', exp.email).maybeSingle();
    let userId = prof?.id;
    if (!userId) {
      const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = listed?.users?.find((u) => u.email?.toLowerCase() === exp.email)?.id;
    }

    const { data: pu } = userId
      ? await db.from('partner_users').select('partner_id, status').eq('user_id', userId).maybeSingle()
      : { data: null };

    const { data: partner } = pu?.partner_id
      ? await db.from('partners').select('partner_type, type, name').eq('id', pu.partner_id).maybeSingle()
      : { data: null };

    const { data: app } = await db
      .from('barbershop_partner_applications')
      .select('status, mou_signed_at')
      .eq('contact_email', exp.email)
      .maybeSingle();

    const roleOk = prof?.role === 'partner';
    const wired = Boolean(pu?.partner_id);
    const barberType =
      partner?.partner_type === 'barber' ||
      partner?.partner_type === 'barbershop' ||
      partner?.type === 'barber';

    const ok = Boolean(userId) && roleOk && wired && barberType;
    if (!ok) fail++;

    rows.push({
      label: exp.label,
      ok,
      detail: [
        userId ? 'auth=OK' : 'auth=MISSING',
        roleOk ? 'role=partner' : `role=${prof?.role ?? '?'}`,
        wired ? `partner_users=${pu?.partner_id?.slice(0, 8)}…` : 'partner_users=MISSING',
        barberType ? 'partner_type=barber' : `partner_type=${partner?.partner_type ?? '?'}`,
        app ? `application=${app.status} mou=${app.mou_signed_at ? 'signed' : 'unsigned'}` : 'no barber application row',
        `dashboard ${SITE}/partner/dashboard`,
      ].join(' · '),
    });
  }

  const w = Math.max(...rows.map((r) => r.label.length), 20);
  for (const r of rows) {
    const mark = r.ok ? '✅' : '❌';
    console.log(`${mark} ${r.label.padEnd(w)}  ${r.detail}`);
  }

  console.log(`\n${fail ? `❌ ${fail} issue(s)` : '✅ All checks passed'} · no emails sent\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
