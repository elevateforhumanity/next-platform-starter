import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Admin AI Assistant API
 *
 * Admin-only endpoint. Answers operational questions about live data.
 * Data queries (students, enrollments, applications) are resolved directly
 * from the DB -- no LLM required. LLM is only called for synthesis/explanation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv, refreshSecrets } from '@/lib/secrets';
import { aiChat, resetProviders } from '@/lib/ai/ai-service';
import { SLUG_ALIASES } from '@/lib/programs/resolve';

export const runtime = 'nodejs';
export const maxDuration = 30;

// -- Program keyword groups ---------------------------------------------------
// Derived from SLUG_ALIASES (lib/programs/resolve.ts) so intent detection
// stays in sync with the canonical program resolver. No separate copy.

function buildProgramAliases(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const [keyword, slug] of Object.entries(SLUG_ALIASES)) {
    // Use the first segment of the slug as the group key (e.g. 'barber-apprenticeship' -> 'barber')
    const group = slug.split('-')[0];
    if (!groups[group]) groups[group] = [];
    if (!groups[group].includes(keyword)) groups[group].push(keyword);
    // Also ensure the slug itself is a keyword
    if (!groups[group].includes(slug)) groups[group].push(slug);
  }
  return groups;
}

const PROGRAM_ALIASES = buildProgramAliases();

// -- Intent detection ---------------------------------------------------------

type QueryIntent =
  | { type: 'students';     program?: string; status?: string }
  | { type: 'applications'; status?: string }
  | { type: 'enrollments';  program?: string; status?: string }
  | { type: 'revenue' }
  | { type: 'programs' }
  | { type: 'certificates' }
  | { type: 'compliance' }
  | { type: 'contracts' }
  | { type: 'grants' }
  | { type: 'documents' }
  | { type: 'signatures' }
  | { type: 'workflows' }
  | { type: 'crm' }
  | { type: 'curriculum' }
  | { type: 'at_risk' }
  | { type: 'wioa' }
  | { type: 'payroll' }
  | { type: 'reports'; reportType?: string }
  | { type: 'unknown' };

function detectProgram(m: string): string | undefined {
  for (const [key, aliases] of Object.entries(PROGRAM_ALIASES)) {
    if (aliases.some(a => m.includes(a))) return key;
  }
  return undefined;
}

function detectStatus(m: string): string | undefined {
  if (/\bactive\b/.test(m))                         return 'active';
  if (/\bpending\b/.test(m))                        return 'pending';
  if (/\b(complete|completed|graduated)\b/.test(m)) return 'completed';
  if (/\binactive\b/.test(m))                       return 'inactive';
  if (/\bat.?risk\b/.test(m))                       return 'at_risk';
  return undefined;
}

function detectIntent(msg: string): QueryIntent {
  const m = msg.toLowerCase();

  // Specific domains first (more specific before more general)
  if (/at.?risk|inactive.*learner|learner.*inactive|flag.*risk|risk.*flag/.test(m))
    return { type: 'at_risk' };
  if (/wioa|workforce.*innov|individual.*training|itta/.test(m))
    return { type: 'wioa' };
  if (/compliance|audit|policy|acknowledgement|expired.*cred|cred.*expir|corrective|violation/.test(m))
    return { type: 'compliance' };
  if (/contract|agreement|mou|memorandum|countersign|executed/.test(m))
    return { type: 'contracts' };
  if (/grant|grants\.gov|funding.*opportunit|rfp|rfq|proposal|narrative|budget.*grant/.test(m))
    return { type: 'grants' };
  if (/document|upload|ocr|extract|pdf|docx|scan|file.*upload|upload.*file/.test(m))
    return { type: 'documents' };
  if (/signature|sign.*document|document.*sign|esign|pending.*sign|signer/.test(m))
    return { type: 'signatures' };
  if (/workflow|pipeline|orchestrat|automat.*workflow|workflow.*status/.test(m))
    return { type: 'workflows' };
  if (/crm|lead|follow.?up|prospect|outreach|partner.*contact|contact.*partner/.test(m))
    return { type: 'crm' };
  if (/curriculum|lesson|course.*content|syllabus|quiz.*generat|generat.*quiz|lesson.*plan/.test(m))
    return { type: 'curriculum' };
  if (/payroll|pay.*period|hours.*export|wage|compensation/.test(m))
    return { type: 'payroll' };
  if (/report|summary|metric|kpi|analytic|dashboard.*data|data.*dashboard/.test(m)) {
    const reportType = /enrollment/.test(m) ? 'enrollment'
      : /financial|revenue|payment/.test(m) ? 'financial'
      : /workforce|placement|outcome/.test(m) ? 'workforce'
      : /compliance/.test(m) ? 'compliance'
      : 'overall';
    return { type: 'reports', reportType };
  }
  if (/student|learner|participant|pull.*(student|learner)|list.*(student|learner)|(student|learner).*(list|all|show)/.test(m))
    return { type: 'students', program: detectProgram(m), status: detectStatus(m) };
  if (/application|applicant|applied|pending review|submitted/.test(m))
    return { type: 'applications', status: detectStatus(m) };
  if (/enrollment|enrolled|active learner/.test(m))
    return { type: 'enrollments', program: detectProgram(m), status: detectStatus(m) };
  if (/revenue|payment|paid|income|money|dollar/.test(m))
    return { type: 'revenue' };
  if (/program|course|offering/.test(m) && /list|show|all|how many/.test(m))
    return { type: 'programs' };
  if (/certif|credential|graduate|completion/.test(m))
    return { type: 'certificates' };
  return { type: 'unknown' };
}

// -- Direct DB resolvers ------------------------------------------------------

async function resolveStudents(
  db: SupabaseClient,
  intent: { program?: string; status?: string },
): Promise<string> {
  if (intent.program) {
    const aliases = PROGRAM_ALIASES[intent.program] ?? [intent.program];
    let programQuery = db.from('programs').select('id,title');
    for (const alias of aliases) {
      programQuery = programQuery.or(`title.ilike.%${alias}%,slug.ilike.%${alias}%`);
    }
    const { data: programs } = await programQuery.limit(5);
    if (!programs?.length) {
      return `No programs found matching "${intent.program}". Check /admin/programs for the full list.`;
    }

    const programIds = programs.map((p: { id: string }) => p.id);
    let q = db
      .from('program_enrollments')
      .select('id,full_name,email,phone,status,payment_status,enrolled_at,program_id')
      .in('program_id', programIds)
      .order('enrolled_at', { ascending: false })
      .limit(50);
    if (intent.status) q = q.eq('status', intent.status);

    const { data: enrollments, error } = await q;
    if (error) return `DB error: ${error.message}`;

    const programTitle = programs.map((p: { title: string }) => p.title).join(' / ');
    if (!enrollments?.length) {
      return `No ${intent.status ?? ''} students found in ${programTitle}.`;
    }

    const rows = enrollments.map((e: Record<string, unknown>, i: number) => {
      const name    = String(e.full_name    ?? '(no name)');
      const email   = String(e.email        ?? '--');
      const status  = String(e.status       ?? '--');
      const payment = String(e.payment_status ?? '--');
      const date    = e.enrolled_at
        ? new Date(e.enrolled_at as string).toLocaleDateString()
        : '--';
      return `${i + 1}. ${name} | ${email} | Status: ${status} | Payment: ${payment} | Enrolled: ${date}`;
    }).join('\n');

    const suffix = intent.status ? ` (${intent.status})` : '';
    const count  = enrollments.length;
    return `**${programTitle} -- ${count} student${count !== 1 ? 's' : ''}${suffix}**\n\n${rows}\n\nView full list: /admin/enrollments`;
  }

  // No program filter -- all students from profiles
  let q = db
    .from('profiles')
    .select('id,full_name,email,phone,enrollment_status,created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(50);
  if (intent.status) q = q.eq('enrollment_status', intent.status);

  const { data: students, error } = await q;
  if (error) return `DB error: ${error.message}`;
  if (!students?.length) return 'No students found.';

  const rows = students.map((s: Record<string, unknown>, i: number) => {
    const name   = String(s.full_name         ?? '(no name)');
    const email  = String(s.email             ?? '--');
    const status = String(s.enrollment_status ?? '--');
    return `${i + 1}. ${name} | ${email} | ${status}`;
  }).join('\n');

  const suffix = intent.status ? ` (${intent.status})` : '';
  return `**All Students -- ${students.length} shown${suffix}**\n\n${rows}\n\nView full list: /admin/students`;
}

async function resolveApplications(
  db: SupabaseClient,
  intent: { status?: string },
): Promise<string> {
  // Live status values: submitted, pending_admin_review, under_review, approved, enrolled, rejected
  const pendingStatuses = ['submitted', 'pending_admin_review', 'under_review'];
  const statusMap: Record<string, string[]> = {
    pending:  ['submitted', 'pending_admin_review'],
    review:   ['under_review', 'pending_admin_review'],
    approved: ['approved'],
    enrolled: ['enrolled'],
    rejected: ['rejected'],
  };

  let q = db
    .from('applications')
    .select('id,full_name,email,status,program_interest,program_slug,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (intent.status) {
    const mapped = statusMap[intent.status] ?? [intent.status];
    q = mapped.length === 1 ? q.eq('status', mapped[0]) : q.in('status', mapped);
  } else {
    q = q.in('status', pendingStatuses);
  }

  const { data, error } = await q;
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return `No ${intent.status ?? 'pending'} applications found.`;

  const rows = data.map((a: Record<string, unknown>, i: number) => {
    const name    = String(a.full_name ?? '(no name)');
    const email   = String(a.email    ?? '--');
    const program = String(a.program_interest ?? a.program_slug ?? '--');
    const status  = String(a.status   ?? '--');
    return `${i + 1}. ${name} | ${email} | ${program} | ${status}`;
  }).join('\n');

  const suffix = intent.status ? ` (${intent.status})` : ' (pending/in review)';
  return `**Applications -- ${data.length} shown${suffix}**\n\n${rows}\n\nReview at: /admin/applications`;
}

async function resolveRevenue(db: SupabaseClient): Promise<string> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [monthRes, allRes] = await Promise.all([
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
  ]);
  const sum = (rows: Record<string, unknown>[]) =>
    rows.reduce((s, r) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  return `**Revenue Summary**\n\nThis month: ${fmt(sum(monthRes.data ?? []))}\nAll time: ${fmt(sum(allRes.data ?? []))}\n\nView details: /admin/funding`;
}

async function resolvePrograms(db: SupabaseClient): Promise<string> {
  const { data, error } = await db
    .from('programs')
    .select('id,title,slug,published,status')
    .neq('status', 'archived')
    .order('title');
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return 'No programs found.';
  const rows = data.map((p: Record<string, unknown>, i: number) =>
    `${i + 1}. ${String(p.title)} (${String(p.slug)}) -- ${p.published ? 'Published' : 'Unpublished'}`
  ).join('\n');
  return `**Programs -- ${data.length} total**\n\n${rows}\n\nManage at: /admin/programs`;
}

async function resolveCertificates(db: SupabaseClient): Promise<string> {
  const { count, error } = await db
    .from('program_completion_certificates')
    .select('id', { count: 'exact', head: true });
  if (error) return `DB error: ${error.message}`;
  return `**Certificates Issued: ${count ?? 0}**\n\nView at: /admin/certificates`;
}

async function resolveAtRisk(db: SupabaseClient): Promise<string> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from('program_enrollments')
    .select('full_name,email,status,last_activity_at,program_id')
    .eq('status', 'active')
    .or(`last_activity_at.lt.${cutoff},last_activity_at.is.null`)
    .order('last_activity_at', { ascending: true })
    .limit(30);
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return '✅ No at-risk learners detected (all active learners had activity in the last 7 days).';
  const rows = data.map((r: Record<string, unknown>, i: number) => {
    const last = r.last_activity_at
      ? new Date(r.last_activity_at as string).toLocaleDateString()
      : 'Never';
    return `${i + 1}. ${String(r.full_name ?? '(no name)')} | ${String(r.email ?? '--')} | Last active: ${last}`;
  }).join('\n');
  return `**At-Risk Learners — ${data.length} flagged (inactive 7+ days)**\n\n${rows}\n\nView full list: /admin/at-risk`;
}

async function resolveCompliance(db: SupabaseClient): Promise<string> {
  const [alerts, wioa, unverifiedDocs] = await Promise.all([
    db.from('compliance_alerts').select('id,title,severity,status,created_at').neq('status', 'resolved').order('created_at', { ascending: false }).limit(20),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('verified', false),
  ]);
  const alertRows = (alerts.data ?? []).map((a: Record<string, unknown>, i: number) =>
    `${i + 1}. [${String(a.severity ?? 'info').toUpperCase()}] ${String(a.title ?? '--')}`
  ).join('\n') || 'None';
  return `**Compliance Status**\n\nOpen alerts: ${alerts.data?.length ?? 0}\nPending WIOA docs: ${wioa.count ?? 0}\nUnverified documents: ${unverifiedDocs.count ?? 0}\n\nAlerts:\n${alertRows}\n\nManage at: /admin/compliance`;
}

async function resolveContracts(db: SupabaseClient): Promise<string> {
  // contracts table not yet in schema — surface mou_documents instead
  const { data, error } = await db
    .from('mou_documents')
    .select('id,title,status,counterparty_name,created_at,expires_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return `No contracts table found yet.\n\nManage MOUs at: /admin/mou\nContracts: /admin/contracts`;
  if (!data?.length) return 'No MOUs/contracts found.\n\nManage at: /admin/mou';
  const rows = data.map((c: Record<string, unknown>, i: number) => {
    const expires = c.expires_at ? new Date(c.expires_at as string).toLocaleDateString() : 'No expiry';
    return `${i + 1}. ${String(c.title ?? '--')} | ${String(c.counterparty_name ?? '--')} | ${String(c.status ?? '--')} | Expires: ${expires}`;
  }).join('\n');
  return `**MOUs/Contracts — ${data.length} shown**\n\n${rows}\n\nManage at: /admin/mou`;
}

async function resolveGrants(db: SupabaseClient): Promise<string> {
  const { data, error } = await db
    .from('grants')
    .select('id,agency,status,due_date,draft,submitted,ready,created_at')
    .order('due_date', { ascending: true })
    .limit(20);
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return 'No grants found.\n\nManage at: /admin/grants';
  const rows = data.map((g: Record<string, unknown>, i: number) => {
    const deadline = g.due_date ? new Date(g.due_date as string).toLocaleDateString() : 'No deadline';
    const flags = [g.draft && 'draft', g.submitted && 'submitted', g.ready && 'ready'].filter(Boolean).join(', ') || String(g.status ?? '--');
    return `${i + 1}. ${String(g.agency ?? '--')} | Due: ${deadline} | ${flags}`;
  }).join('\n');
  return `**Grants — ${data.length} shown**\n\n${rows}\n\nManage at: /admin/grants`;
}

async function resolveDocuments(db: SupabaseClient): Promise<string> {
  const { data, error } = await db
    .from('documents')
    .select('id,title,file_name,document_type,status,verification_status,created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return 'No documents found.\n\nManage at: /admin/document-center';
  const rows = data.map((d: Record<string, unknown>, i: number) => {
    const date = d.created_at ? new Date(d.created_at as string).toLocaleDateString() : '--';
    const name = String(d.title ?? d.file_name ?? '--');
    return `${i + 1}. ${name} | ${String(d.document_type ?? '--')} | ${String(d.verification_status ?? d.status ?? '--')} | ${date}`;
  }).join('\n');
  return `**Documents — ${data.length} recent**\n\n${rows}\n\nManage at: /admin/document-center`;
}

async function resolveSignatures(db: SupabaseClient): Promise<string> {
  // document_signatures table — tracks who signed what
  const { data, error } = await db
    .from('document_signatures')
    .select('id,document_type,document_id,signer_id,signed_at,created_at')
    .is('signed_at', null)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return '✅ No pending signatures.\n\nManage at: /admin/signatures';
  const rows = data.map((s: Record<string, unknown>, i: number) =>
    `${i + 1}. ${String(s.document_type ?? '--')} (doc: ${String(s.document_id ?? '--')}) | Signer: ${String(s.signer_id ?? '--')} | Pending`
  ).join('\n');
  return `**Pending Signatures — ${data.length}**\n\n${rows}\n\nManage at: /admin/signatures`;
}

async function resolveWorkflows(db: SupabaseClient): Promise<string> {
  const { data, error } = await db
    .from('workflows')
    .select('id,name,status,owner,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return 'No workflows found.\n\nManage at: /admin/workflows';
  const rows = data.map((w: Record<string, unknown>, i: number) =>
    `${i + 1}. ${String(w.name ?? '--')} | ${String(w.status ?? '--')} | Owner: ${String(w.owner ?? '--')}`
  ).join('\n');
  return `**Workflows — ${data.length} shown**\n\n${rows}\n\nManage at: /admin/workflows`;
}

async function resolveCrm(db: SupabaseClient): Promise<string> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [stale, total] = await Promise.all([
    db.from('crm_leads').select('id,full_name,email,status,last_contact_at').or(`last_contact_at.lt.${cutoff},last_contact_at.is.null`).neq('status', 'closed').order('last_contact_at', { ascending: true }).limit(20),
    db.from('crm_leads').select('id', { count: 'exact', head: true }),
  ]);
  if (stale.error) return `DB error: ${stale.error.message}`;
  const rows = (stale.data ?? []).map((l: Record<string, unknown>, i: number) => {
    const last = l.last_contact_at ? new Date(l.last_contact_at as string).toLocaleDateString() : 'Never';
    return `${i + 1}. ${String(l.full_name ?? '--')} | ${String(l.email ?? '--')} | Last contact: ${last}`;
  }).join('\n') || 'None';
  return `**CRM — ${total.count ?? 0} total leads, ${stale.data?.length ?? 0} need follow-up**\n\n${rows}\n\nManage at: /admin/crm/leads`;
}

async function resolveCurriculum(db: SupabaseClient): Promise<string> {
  const [lessons, modules] = await Promise.all([
    db.from('curriculum_lessons').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('modules').select('id', { count: 'exact', head: true }),
  ]);
  return `**Curriculum**\n\nPublished lessons: ${lessons.count ?? 0}\nModules: ${modules.count ?? 0}\n\nManage at: /admin/curriculum\nCourse builder: /admin/course-builder`;
}

async function resolveWioa(db: SupabaseClient): Promise<string> {
  const [pending, total] = await Promise.all([
    db.from('wioa_documents').select('id,student_name,document_type,status,created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }),
  ]);
  if (pending.error) return `DB error: ${pending.error.message}`;
  const rows = (pending.data ?? []).map((w: Record<string, unknown>, i: number) =>
    `${i + 1}. ${String(w.student_name ?? '--')} | ${String(w.document_type ?? '--')} | ${new Date(w.created_at as string).toLocaleDateString()}`
  ).join('\n') || 'None pending';
  return `**WIOA Documents — ${total.count ?? 0} total, ${pending.data?.length ?? 0} pending**\n\n${rows}\n\nManage at: /admin/wioa`;
}

async function resolvePayroll(db: SupabaseClient): Promise<string> {
  const { data, error } = await db
    .from('payroll_records')
    .select('id,employee_name,period_start,period_end,gross_pay,status')
    .order('period_end', { ascending: false })
    .limit(10);
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return 'No payroll records found.\n\nManage at: /admin/payroll';
  const rows = data.map((p: Record<string, unknown>, i: number) => {
    const gross = p.gross_pay ? `$${Number(p.gross_pay).toLocaleString()}` : '--';
    return `${i + 1}. ${String(p.employee_name ?? '--')} | ${gross} | ${String(p.status ?? '--')}`;
  }).join('\n');
  return `**Payroll — ${data.length} recent records**\n\n${rows}\n\nManage at: /admin/payroll`;
}

async function resolveReports(db: SupabaseClient, reportType = 'overall'): Promise<string> {
  const now = new Date();
  const _monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  if (reportType === 'enrollment') {
    const [active, completed, pending] = await Promise.all([
      db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    return `**Enrollment Report**\n\nActive: ${active.count ?? 0}\nCompleted: ${completed.count ?? 0}\nPending: ${pending.count ?? 0}\n\nFull report: /admin/reports`;
  }
  if (reportType === 'financial') {
    const [month, allTime] = await Promise.all([
      db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
      db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
    ]);
    const sum = (rows: Record<string, unknown>[]) => rows.reduce((s, r) => s + ((r.amount_paid_cents as number) ?? 0), 0);
    const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return `**Financial Report**\n\nThis month: ${fmt(sum(month.data ?? []))}\nAll time: ${fmt(sum(allTime.data ?? []))}\n\nFull report: /admin/reports`;
  }
  if (reportType === 'workforce') {
    const [placements, outcomes] = await Promise.all([
      db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      db.from('program_outcomes').select('id', { count: 'exact', head: true }),
    ]);
    return `**Workforce Report**\n\nCompletions: ${placements.count ?? 0}\nOutcomes recorded: ${outcomes.count ?? 0}\n\nFull report: /admin/reports\nOutcomes: /admin/outcomes`;
  }
  // Overall
  const [students, enrollments, apps, certs] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending_admin_review']),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
  ]);
  return `**Platform Summary Report**\n\nTotal students: ${students.count ?? 0}\nActive enrollments: ${enrollments.count ?? 0}\nPending applications: ${apps.count ?? 0}\nCertificates issued: ${certs.count ?? 0}\n\nFull reports: /admin/reports`;
}

// -- Live data snapshot for LLM context --------------------------------------

async function getLiveDataSnapshot(db: SupabaseClient): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    pendingApps, totalApps, activeEnrollments, totalStudents,
    revenueMonth, revenueAll, certs,
    atRisk, complianceAlerts, pendingWioa,
    pendingSignatures, openContracts, activeGrants,
    staleLeads, pendingWorkflows, publishedLessons,
  ] = await Promise.all([
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending_admin_review', 'under_review']),
    db.from('applications').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').or(`last_activity_at.lt.${cutoff7d},last_activity_at.is.null`),
    db.from('compliance_alerts').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('document_signatures').select('id', { count: 'exact', head: true }).is('signed_at', null),
    db.from('mou_documents').select('id', { count: 'exact', head: true }),
    db.from('grants').select('id', { count: 'exact', head: true }).in('status', ['draft', 'in_progress', 'submitted']),
    db.from('crm_leads').select('id', { count: 'exact', head: true }).or(`last_contact_at.lt.${cutoff7d},last_contact_at.is.null`).neq('status', 'closed'),
    db.from('workflows').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    db.from('curriculum_lessons').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  const sum = (rows: Record<string, unknown>[]) =>
    rows.reduce((s, r) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  const monthCents = sum(revenueMonth.data ?? []);
  const allCents   = sum(revenueAll.data   ?? []);

  return `LIVE DATA (${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET):

STUDENTS & ENROLLMENT
- Total students: ${totalStudents.count ?? 0}
- Active enrollments: ${activeEnrollments.count ?? 0}
- At-risk learners (inactive 7d+): ${atRisk.count ?? 0}
- Certificates issued: ${certs.count ?? 0}

APPLICATIONS
- Pending applications: ${pendingApps.count ?? 0}
- Total applications: ${totalApps.count ?? 0}

REVENUE
- This month: $${(monthCents / 100).toLocaleString('en-US')}
- All time: $${(allCents / 100).toLocaleString('en-US')}

COMPLIANCE & DOCUMENTS
- Open compliance alerts: ${complianceAlerts.count ?? 0}
- Pending WIOA documents: ${pendingWioa.count ?? 0}
- Pending signatures: ${pendingSignatures.count ?? 0}

CONTRACTS & GRANTS
- Active contracts: ${openContracts.count ?? 0}
- Active/in-progress grants: ${activeGrants.count ?? 0}

CRM & WORKFLOWS
- Stale CRM leads (7d+ no contact): ${staleLeads.count ?? 0}
- Active workflows: ${pendingWorkflows.count ?? 0}

CURRICULUM
- Published lessons: ${publishedLessons.count ?? 0}`;
}

// -- System prompt ------------------------------------------------------------

const SYSTEM_PROMPT = `You are the Elevate for Humanity AI Operations Assistant — the operational command center for the entire organization.

You are NOT a chatbot. You are an operations coordinator, compliance assistant, workflow orchestrator, document intelligence engine, grant assistant, reporting engine, and automation layer.

CORE RULES
- Never fabricate legal, compliance, or financial data. Only use live data provided.
- Never auto-submit documents, contracts, or grants without explicit admin approval.
- Never overwrite records silently. Always log actions.
- Always preserve auditability. Always allow human override.
- Be direct and operational — no fluff. 2-5 sentences unless detail is requested.
- If data is missing, say so clearly. Never hide gaps.

CAPABILITIES YOU HAVE ACCESS TO
1. STUDENTS & ENROLLMENT — query students, enrollments, at-risk learners, attendance, progress, placement
2. APPLICATIONS — review queue, approve/reject, status tracking
3. COMPLIANCE — alerts, policy acknowledgements, expired credentials, audit packets, WIOA docs
4. CONTRACTS & MOUs — view, generate, countersign, track status, expiration dates
5. GRANTS — search opportunities, match to programs, track deadlines, generate narratives/budgets
6. DOCUMENTS — upload, OCR, extract fields, classify, detect signatures, route to workflows
7. SIGNATURES — pending requests, signer status, audit trails, finalize PDFs
8. WORKFLOWS — orchestrate multi-step processes, track status, approvals, notifications
9. CRM & PARTNERS — leads, follow-ups, outreach, partnership proposals, employer relationships
10. CURRICULUM — lessons, modules, quizzes, syllabi, learning paths, course generation
11. REPORTING — enrollment, financial, workforce, compliance, grant status, KPI summaries
12. PAYROLL — records, hours export, pay periods
13. DEV & REPO — route audits, build issues, migrations, deployments (via Dev Studio)

ORGANIZATION CONTEXT
- Organization: Elevate for Humanity
- Mission: Workforce development and career training for underserved communities
- Programs: HVAC, CNA, Barber, Tax Preparation, Apprenticeships, and more
- Compliance frameworks: WIOA, DOL, ETPL, state licensing, FERPA
- Funding: DOL grants, JRI, WIOA ITA, employer partnerships

NAVIGATION MAP
Students: /admin/students | Enrollments: /admin/enrollments | Applications: /admin/applications
Programs: /admin/programs | Compliance: /admin/compliance | Contracts: /admin/contracts
Grants: /admin/grants | Documents: /admin/document-center | Signatures: /admin/signatures
Workflows: /admin/workflows | CRM: /admin/crm/leads | Curriculum: /admin/curriculum
Reports: /admin/reports | Payroll: /admin/payroll | WIOA: /admin/wioa
At-Risk: /admin/at-risk | Certificates: /admin/certificates | Funding: /admin/funding
Course Builder: /admin/course-builder | Dev Studio: /admin/dev-studio | AI Console: /admin/ai-console

EXAMPLE COMMANDS YOU CAN HANDLE
"Generate CNA compliance packet" → summarize compliance status, list missing docs, link to /admin/compliance
"Find grants for reentry workforce programs" → query grants table, suggest matches, link to /admin/grants
"Who are my at-risk learners?" → query inactive enrollments, list names/emails, link to /admin/at-risk
"Summarize pending signatures" → query signature_requests, list pending, link to /admin/signatures
"Generate workforce board report" → pull enrollment/completion/placement metrics, format as report
"What contracts are expiring?" → query contracts with expires_at, flag near-expiry, link to /admin/contracts
"Show me stale CRM leads" → query crm_leads with no recent contact, list them, link to /admin/crm/leads
"How many WIOA documents are pending?" → query wioa_documents, return count and list
"Deploy admin dashboard" → redirect to Dev Studio: /admin/dev-studio
"Fix build issues" → redirect to Dev Studio: /admin/dev-studio`;

// -- Main handler -------------------------------------------------------------

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const db = await requireAdminClient();
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile?.role || !['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const { message, history = [] } = await req.json();
    if (!message?.trim()) return safeError('Message required', 400);

    const safeHistory = (Array.isArray(history) ? history : [])
      .filter((m: unknown) =>
        m !== null && typeof m === 'object' &&
        ['user', 'assistant'].includes((m as Record<string, unknown>).role as string) &&
        typeof (m as Record<string, unknown>).content === 'string',
      )
      .slice(-8);

    // -- Resolve data queries directly from DB (no LLM needed) ---------------
    const intent = detectIntent(message);
    let directReply: string | null = null;

    switch (intent.type) {
      case 'students':
        directReply = await resolveStudents(db, intent); break;
      case 'enrollments':
        directReply = await resolveStudents(db, { program: (intent as { program?: string }).program, status: (intent as { status?: string }).status }); break;
      case 'applications':
        directReply = await resolveApplications(db, intent); break;
      case 'revenue':
        directReply = await resolveRevenue(db); break;
      case 'programs':
        directReply = await resolvePrograms(db); break;
      case 'certificates':
        directReply = await resolveCertificates(db); break;
      case 'at_risk':
        directReply = await resolveAtRisk(db); break;
      case 'compliance':
        directReply = await resolveCompliance(db); break;
      case 'contracts':
        directReply = await resolveContracts(db); break;
      case 'grants':
        directReply = await resolveGrants(db); break;
      case 'documents':
        directReply = await resolveDocuments(db); break;
      case 'signatures':
        directReply = await resolveSignatures(db); break;
      case 'workflows':
        directReply = await resolveWorkflows(db); break;
      case 'crm':
        directReply = await resolveCrm(db); break;
      case 'curriculum':
        directReply = await resolveCurriculum(db); break;
      case 'wioa':
        directReply = await resolveWioa(db); break;
      case 'payroll':
        directReply = await resolvePayroll(db); break;
      case 'reports':
        directReply = await resolveReports(db, (intent as { reportType?: string }).reportType); break;
    }

    if (directReply) {
      db.from('audit_logs').insert({
        actor_id: user.id,
        action: 'ai_assistant_query',
        metadata: { source: 'direct_db', intent: intent.type, prompt: message.slice(0, 200) },
        ip_address: req.headers.get('x-forwarded-for') ?? null,
      }).then(({ error }) => { if (error) logger.error('[ai-assistant] audit failed', error); });
      return NextResponse.json({ reply: directReply });
    }

    // -- Fall back to LLM for synthesis / explanation -------------------------
    const dataSnapshot = await getLiveDataSnapshot(db);
    const systemPrompt = `${SYSTEM_PROMPT}\n\n${dataSnapshot}`;
    const userMessages = [...safeHistory, { role: 'user' as const, content: message }];

    let reply = '';
    let modelUsed = 'none';

    try {
      const result = await aiChat({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
        temperature: 0.3,
        maxTokens: 1200,
      });
      reply = result.content ?? '';
      modelUsed = result.model ?? result.provider ?? 'ai-service';
    } catch (initialError) {
      // Admin may have rotated provider keys in dashboard moments ago.
      await refreshSecrets();
      resetProviders();
      try {
        const retry = await aiChat({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
          temperature: 0.3,
          maxTokens: 1200,
        });
        reply = retry.content ?? '';
        modelUsed = retry.model ?? retry.provider ?? 'ai-service';
      } catch (retryError) {
        logger.error('[ai-assistant] AI unavailable after secret refresh', retryError as Error, {
          initialError: initialError instanceof Error ? initialError.message : String(initialError),
        });
        reply = `AI service unavailable. Here is the live data:\n\n${dataSnapshot}\n\nOpen /admin/api-keys and /admin/ai-console to verify provider keys are active.`;
      }
    }

    if (!reply) reply = 'No response generated. Try rephrasing your question.';

    db.from('audit_logs').insert({
      actor_id: user.id,
      action: 'ai_assistant_query',
      metadata: { source: 'llm', model: modelUsed, prompt: message.slice(0, 500), reply: reply.slice(0, 500) },
      ip_address: req.headers.get('x-forwarded-for') ?? null,
    }).then(({ error }) => { if (error) logger.error('[ai-assistant] audit failed', error); });

    return NextResponse.json({ reply });
  } catch (err) {
    return safeInternalError(err, 'Admin AI assistant failed');
  }
}
