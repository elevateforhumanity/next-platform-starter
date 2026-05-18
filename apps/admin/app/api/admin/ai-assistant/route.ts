import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Admin AI Assistant API
 *
 * Admin-only endpoint. Answers operational questions about live data.
 * Data queries (students, enrollments, applications) are resolved directly
 * from the DB — no LLM required. LLM is only called for synthesis/explanation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isGroqConfigured, getGroqClient } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ── Program aliases ───────────────────────────────────────────────────────────

const PROGRAM_ALIASES: Record<string, string[]> = {
  barber:      ['barber', 'barbering', 'barber apprenticeship', 'barber training', 'barber program'],
  hvac:        ['hvac', 'heating', 'cooling', 'refrigerant', 'epa 608'],
  cosmetology: ['cosmetology', 'cosmetologist', 'beauty', 'esthetics', 'esthetician'],
  cdl:         ['cdl', 'commercial driver', 'truck'],
  healthcare:  ['healthcare', 'cna', 'qma', 'nursing', 'medical'],
  tax:         ['tax', 'enrolled agent', 'irs', 'efin', 'ptin'],
};

// ── Intent detection ──────────────────────────────────────────────────────────

type QueryIntent =
  | { type: 'students';     program?: string; status?: string }
  | { type: 'applications'; status?: string }
  | { type: 'enrollments';  program?: string; status?: string }
  | { type: 'revenue' }
  | { type: 'programs' }
  | { type: 'certificates' }
  | { type: 'unknown' };

function detectProgram(m: string): string | undefined {
  for (const [key, aliases] of Object.entries(PROGRAM_ALIASES)) {
    if (aliases.some(a => m.includes(a))) return key;
  }
  return undefined;
}

function detectStatus(m: string): string | undefined {
  if (/active/.test(m))                        return 'active';
  if (/pending/.test(m))                       return 'pending';
  if (/(complete|completed|graduated)/.test(m)) return 'completed';
  if (/inactive/.test(m))                      return 'inactive';
  if (/at.?risk/.test(m))                      return 'at_risk';
  return undefined;
}

function detectIntent(msg: string): QueryIntent {
  const m = msg.toLowerCase();

  if (/student|learner|enroll|participant|pull.*(student|learner)|list.*(student|learner)|(student|learner).*(list|all|show)/.test(m)) {
    return { type: 'students', program: detectProgram(m), status: detectStatus(m) };
  }
  if (/application|applicant|applied|pending review|submitted/.test(m)) {
    return { type: 'applications', status: detectStatus(m) };
  }
  if (/enrollment|enrolled|active learner/.test(m)) {
    return { type: 'enrollments', program: detectProgram(m), status: detectStatus(m) };
  }
  if (/revenue|payment|paid|income|money|dollar/.test(m)) {
    return { type: 'revenue' };
  }
  if (/program|course|offering/.test(m) && /list|show|all|how many/.test(m)) {
    return { type: 'programs' };
  }
  if (/certif|credential|graduate|completion/.test(m)) {
    return { type: 'certificates' };
  }
  return { type: 'unknown' };
}

// ── Direct DB resolvers ───────────────────────────────────────────────────────

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
    if (!enrollments?.length) {
      return `No ${intent.status ?? ''} students found in ${programs.map((p: { title: string }) => p.title).join(' / ')}.`;
    }

    const programTitle = programs.map((p: { title: string }) => p.title).join(' / ');
    const rows = enrollments.map((e: Record<string, unknown>, i: number) =>
      `${i + 1}. ${e.full_name ?? '(no name)'} — ${e.email ?? '—'} | Status: ${e.status ?? '—'} | Payment: ${e.payment_status ?? '—'} | Enrolled: ${e.enrolled_at ? new Date(e.enrolled_at as string).toLocaleDateString() : '—'}`
    ).join('
');

    return `**${programTitle} — ${enrollments.length} student${enrollments.length !== 1 ? 's' : ''}${intent.status ? ` (${intent.status})` : ''}**

${rows}

View full list: /admin/enrollments`;
  }

  // No program filter — all students
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

  const rows = students.map((s: Record<string, unknown>, i: number) =>
    `${i + 1}. ${s.full_name ?? '(no name)'} — ${s.email ?? '—'} | ${s.enrollment_status ?? '—'}`
  ).join('
');

  return `**All Students — ${students.length} shown${intent.status ? ` (${intent.status})` : ''}**

${rows}

View full list: /admin/students`;
}

async function resolveApplications(
  db: SupabaseClient,
  intent: { status?: string },
): Promise<string> {
  let q = db
    .from('applications')
    .select('id,full_name,email,status,program,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (intent.status) {
    q = q.eq('status', intent.status);
  } else {
    q = q.in('status', ['submitted', 'pending', 'in_review']);
  }

  const { data, error } = await q;
  if (error) return `DB error: ${error.message}`;
  if (!data?.length) return `No ${intent.status ?? 'pending'} applications found.`;

  const rows = data.map((a: Record<string, unknown>, i: number) =>
    `${i + 1}. ${a.full_name ?? '(no name)'} — ${a.email ?? '—'} | ${a.program ?? '—'} | ${a.status}`
  ).join('
');

  return `**Applications — ${data.length} shown${intent.status ? ` (${intent.status})` : ' (pending/in review)'}**

${rows}

Review at: /admin/applications`;
}

async function resolveRevenue(db: SupabaseClient): Promise<string> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [monthRes, allRes] = await Promise.all([
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
  ]);
  const monthTotal = (monthRes.data ?? []).reduce((s: number, r: Record<string, unknown>) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  const allTotal   = (allRes.data   ?? []).reduce((s: number, r: Record<string, unknown>) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  return `**Revenue Summary**

This month: $${(monthTotal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
All time: $${(allTotal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}

View details: /admin/funding`;
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
    `${i + 1}. ${p.title} (${p.slug}) — ${p.published ? 'Published' : '⚠️ Unpublished'}`
  ).join('
');
  return `**Programs — ${data.length} total**

${rows}

Manage at: /admin/programs`;
}

async function resolveCertificates(db: SupabaseClient): Promise<string> {
  const { count, error } = await db
    .from('program_completion_certificates')
    .select('id', { count: 'exact', head: true });
  if (error) return `DB error: ${error.message}`;
  return `**Certificates Issued: ${count ?? 0}**

View at: /admin/certificates`;
}

// ── Live data snapshot for LLM context ───────────────────────────────────────

async function getLiveDataSnapshot(db: SupabaseClient): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [pendingApps, totalApps, activeEnrollments, totalStudents, revenueMonth, revenueAll, certs] =
    await Promise.all([
      db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']),
      db.from('applications').select('id', { count: 'exact', head: true }),
      db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
      db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
      db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]);
  const monthCents = (revenueMonth.data ?? []).reduce((s: number, r: Record<string, unknown>) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  const allCents   = (revenueAll.data   ?? []).reduce((s: number, r: Record<string, unknown>) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  return `LIVE DATA (${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET):
- Pending applications: ${pendingApps.count ?? 0}
- Total applications: ${totalApps.count ?? 0}
- Active enrollments: ${activeEnrollments.count ?? 0}
- Total students: ${totalStudents.count ?? 0}
- Revenue this month: $${(monthCents / 100).toLocaleString('en-US')}
- Revenue all time: $${(allCents / 100).toLocaleString('en-US')}
- Certificates issued: ${certs.count ?? 0}`;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Elevate for Humanity Admin Operations Assistant.
Help admin staff manage day-to-day operations. Be direct and operational — no fluff.
Keep responses to 2-5 sentences unless a detailed breakdown is requested.
Never make up numbers — only use the live data provided.
Navigation: Applications /admin/applications · Students /admin/students · Enrollments /admin/enrollments · Programs /admin/programs · Funding /admin/funding · Compliance /admin/compliance`;

// ── Main handler ──────────────────────────────────────────────────────────────

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

    // ── Resolve data queries directly from DB (no LLM needed) ─────────────
    const intent = detectIntent(message);
    let directReply: string | null = null;

    switch (intent.type) {
      case 'students':
        directReply = await resolveStudents(db, intent); break;
      case 'enrollments':
        directReply = await resolveStudents(db, { program: intent.program, status: intent.status }); break;
      case 'applications':
        directReply = await resolveApplications(db, intent); break;
      case 'revenue':
        directReply = await resolveRevenue(db); break;
      case 'programs':
        directReply = await resolvePrograms(db); break;
      case 'certificates':
        directReply = await resolveCertificates(db); break;
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

    // ── Fall back to LLM for synthesis / explanation ───────────────────────
    const dataSnapshot = await getLiveDataSnapshot(db);
    const systemPrompt = `${SYSTEM_PROMPT}

${dataSnapshot}`;
    const userMessages = [...safeHistory, { role: 'user' as const, content: message }];

    let reply = '';
    let modelUsed = 'none';

    if (isGroqConfigured()) {
      const groq = getGroqClient();
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
        max_tokens: 400,
        temperature: 0.3,
      });
      reply = res.choices?.[0]?.message?.content ?? '';
      modelUsed = 'llama-3.3-70b-versatile';
    } else if (isGeminiConfigured()) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPrompt });
      const result = await model.generateContent(message);
      reply = result.response.text();
      modelUsed = 'gemini-1.5-flash';
    } else if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        logger.error('[ai-assistant] OpenAI error', { status: res.status, body: errBody });
        // Degrade gracefully — return live data snapshot instead of an error
        reply = `AI service unavailable (HTTP ${res.status}). Here's the live data:

${dataSnapshot}`;
      } else {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        reply = data.choices?.[0]?.message?.content ?? '';
        modelUsed = 'gpt-4o-mini';
      }
    } else {
      reply = `No AI provider configured. Live data:

${dataSnapshot}

Set GROQ_API_KEY or GEMINI_API_KEY in platform secrets to enable AI responses.`;
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
