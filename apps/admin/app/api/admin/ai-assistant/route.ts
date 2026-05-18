import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Admin AI Assistant API
 *
 * Admin-only endpoint. Answers operational questions about live data:
 * applications, enrollments, students, revenue, programs, compliance.
 * Has read access to real DB counts via adminClient.
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

const ADMIN_SYSTEM_PROMPT = `You are the Elevate for Humanity Admin Operations Assistant. You help admin staff manage day-to-day operations.

You have access to live data summaries provided in each message. Use them to answer questions accurately.

Your capabilities:
- Summarize application pipeline (pending, in review, approved, rejected counts)
- Report on enrollment numbers and active learners
- Summarize revenue collected vs pending
- Identify at-risk or inactive learners
- Report on program enrollment breakdown
- Summarize compliance and WIOA status
- Guide admins to the right page for specific actions

Navigation shortcuts you can reference:
- Applications: /admin/applications
- Students: /admin/students
- Enrollments: /admin/enrollments
- Programs: /admin/programs
- WIOA: /admin/wioa
- Funding: /admin/funding
- Compliance: /admin/compliance
- Reports: /admin/reports
- Certificates: /admin/certificates
- At-Risk: /admin/at-risk

Rules:
- Be direct and operational. No fluff.
- Always cite the data provided when answering questions about counts or status.
- If you don't have the data to answer, say so and link to the relevant admin page.
- Keep responses concise — 2-5 sentences unless a detailed breakdown is requested.
- Never make up numbers. Only use the live data snapshot provided.`;

async function getLiveDataSnapshot(db: SupabaseClient) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    pendingApps,
    totalApps,
    activeEnrollments,
    totalStudents,
    revenueMonth,
    revenueAll,
    certs,
    unpublishedPrograms,
    inactiveCount,
  ] = await Promise.all([
    db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'pending', 'in_review']),
    db.from('applications').select('id', { count: 'exact', head: true }),
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db
      .from('program_enrollments')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    db
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('published', false)
      .neq('status', 'archived'),
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('updated_at', new Date(Date.now() - 3 * 86400000).toISOString()),
  ]);

  const revenueMonthCents = (revenueMonth.data ?? []).reduce(
    (s: number, r: any) => s + (r.amount_paid_cents ?? 0),
    0,
  );
  const revenueAllCents = (revenueAll.data ?? []).reduce(
    (s: number, r: any) => s + (r.amount_paid_cents ?? 0),
    0,
  );

  return `
LIVE DATA SNAPSHOT (as of ${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET):
- Pending applications (awaiting review): ${pendingApps.count ?? 0}
- Total applications (all time): ${totalApps.count ?? 0}
- Active enrollments: ${activeEnrollments.count ?? 0}
- Total students in system: ${totalStudents.count ?? 0}
- Revenue this month: $${(revenueMonthCents / 100).toLocaleString('en-US')}
- Revenue all time: $${(revenueAllCents / 100).toLocaleString('en-US')}
- Certificates issued (all time): ${certs.count ?? 0} (program completion certificates)
- Unpublished programs (blocking enrollment): ${unpublishedPrograms.count ?? 0}
- Inactive learners (no activity 3+ days): ${inactiveCount.count ?? 0}
`.trim();
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    // Allow admin, super_admin, and staff — all have legitimate need for
    // operational Q&A. The live data snapshot contains counts only (no PII).
    const ALLOWED_ROLES = ['admin', 'super_admin', 'staff', 'org_admin'];
    if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const { message, history = [] } = await req.json();
    if (!message?.trim()) return safeError('Message required', 400);

    // Strip any system-role entries injected by the client — only 'user' and
    // 'assistant' turns are valid history. Allowing client-supplied system
    // messages would let a crafted request override the system prompt.
    const safeHistory = (Array.isArray(history) ? history : [])
      .filter((m: unknown) =>
        m !== null &&
        typeof m === 'object' &&
        ['user', 'assistant'].includes((m as Record<string, unknown>).role as string) &&
        typeof (m as Record<string, unknown>).content === 'string',
      )
      .slice(-8);

    // Require at least one AI provider — Groq (primary, free) or Gemini (fallback)
    if (!isGroqConfigured() && !isGeminiConfigured() && !process.env.OPENAI_API_KEY) {
      return safeError('AI not configured — set GROQ_API_KEY or GEMINI_API_KEY in platform_secrets', 503);
    }

    // Get live data snapshot to inject into context
    const dataSnapshot = await getLiveDataSnapshot(db);

    const systemPrompt = `${ADMIN_SYSTEM_PROMPT}\n\n${dataSnapshot}`;
    const userMessages = [
      ...safeHistory,
      { role: 'user' as const, content: message },
    ];

    let reply = '';

    // Provider priority: Groq → Gemini → OpenAI
    if (isGroqConfigured()) {
      const groq = getGroqClient();
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
        max_tokens: 400,
        temperature: 0.3,
      });
      reply = res.choices?.[0]?.message?.content ?? 'No response generated.';
    } else if (isGeminiConfigured()) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPrompt });
      const result = await model.generateContent(message);
      reply = result.response.text();
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, ...userMessages], max_tokens: 400, temperature: 0.3 }),
      });
      if (!res.ok) { logger.error('OpenAI error:', await res.text()); return safeError('AI service error', 502); }
      const data = await res.json();
      reply = data.choices?.[0]?.message?.content ?? 'No response generated.';
    }

    // Audit log — write to audit_logs (ai_audit_log is a view over it)
    db.from('audit_logs').insert({
      actor_id: user.id,
      action: 'ai_assistant_query',
      metadata: {
        source: 'ai',
        prompt: message.slice(0, 500),
        reply: reply.slice(0, 500),
        model: isGroqConfigured() ? 'llama-3.3-70b-versatile' : isGeminiConfigured() ? 'gemini-1.5-flash' : 'gpt-4o-mini',
      },
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
    }).then(({ error }) => {
      if (error) logger.error('[ai-assistant] Audit log insert failed', error);
    });

    return NextResponse.json({ reply });
  } catch (err) {
    return safeInternalError(err, 'Admin AI assistant failed');
  }
}
