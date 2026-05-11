/**
 * /api/devstudio/chat
 *
 * AI platform controller for Dev Studio. Admin-only.
 *
 * Provider chain:
 *   1. Groq   — llama-3.3-70b-versatile (tool/function calling)
 *   2. Gemini — gemini-1.5-flash         (fallback, no tool calling)
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isGroqConfigured, getGroqClient } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type Groq from 'groq-sdk';

type ToolCallRecord = { tool: string; args: Record<string, unknown>; result: string };

const TOOLS: Groq.Chat.Completions.Tool[] = [
  {
    type: 'function',
    function: {
      name: 'list_programs',
      description: 'List programs with title, slug, category, and status.',
      parameters: {
        type: 'object',
        properties: {
          active_only: { type: 'boolean', description: 'Return only active programs' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_enrollments',
      description: 'List recent enrollments with status and timestamps.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max rows (default 20)' },
          status: { type: 'string', description: 'active | completed | pending' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get headline metrics: enrollments, pending applications, certificates, active programs.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_applications',
      description: 'List recent intake submissions with status and applicant info.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max rows (default 10)' },
          status: { type: 'string', description: 'pending | approved | rejected' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_blueprints',
      description: 'List registered blueprint IDs for course generation.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'design_page_template',
      description:
        'Generate a reusable Next.js page template component aligned to Elevate design conventions.',
      parameters: {
        type: 'object',
        properties: {
          page_type: {
            type: 'string',
            description: 'program | landing | report | onboarding | dashboard',
          },
          page_title: { type: 'string', description: 'Main page title' },
          audience: { type: 'string', description: 'Target user persona' },
          cta_label: { type: 'string', description: 'Primary CTA text' },
          cta_href: { type: 'string', description: 'Primary CTA link path' },
        },
        required: ['page_type', 'page_title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_safe_command',
      description:
        'Run pre-approved read-only diagnostics only (git status/log/diff/branch/remote, ls, node --version, pnpm --version, cat package.json, pnpm lint --dry-run, pnpm build --dry-run).',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Read-only diagnostic command' },
        },
        required: ['command'],
      },
    },
  },
];

const SAFE_COMMAND_ALLOWLIST = [
  /^git (status|log|diff|branch|remote)( .+)?$/,
  /^ls( .+)?$/,
  /^pnpm (lint|build) --dry-run$/,
  /^cat package\.json$/,
  /^node --version$/,
  /^pnpm --version$/,
];

function isSafeCommand(cmd: string): boolean {
  return SAFE_COMMAND_ALLOWLIST.some((rx) => rx.test(cmd.trim()));
}

function buildTemplate(args: Record<string, unknown>): string {
  const pageType = String(args.page_type || 'landing');
  const pageTitle = String(args.page_title || 'New Page');
  const audience = String(args.audience || 'Learners');
  const ctaLabel = String(args.cta_label || 'Apply Now');
  const ctaHref = String(args.cta_href || '/apply');

  const fileName = `${pageType}-template-page.tsx`;

  return JSON.stringify(
    {
      filename: fileName,
      code: `import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${pageTitle} | Elevate for Humanity',
  description: '${pageTitle} for ${audience}.',
};

export default function ${pageTitle.replace(/[^a-zA-Z0-9]/g, '') || 'Template'}Page() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative h-[45vh] min-h-[280px] max-h-[560px] overflow-hidden">
        <img
          src="/images/hero/default-hero.jpg"
          alt="${pageTitle} hero"
          className="h-full w-full object-cover"
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 -mt-20 relative z-10 shadow-sm">
          <p className="text-sm font-semibold text-brand-red-600 uppercase tracking-wide">${audience}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">${pageTitle}</h1>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Replace this copy with your real content. Keep text readable using text-slate-* classes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="${ctaHref}" className="inline-flex items-center rounded-xl bg-brand-red-600 px-5 py-3 text-white font-semibold hover:bg-brand-red-700">
              ${ctaLabel}
            </Link>
            <Link href="/contact" className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-slate-700 font-semibold hover:bg-slate-50">
              Request Information
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
`,
      notes: [
        'Uses required hero height constraints',
        'Uses readable text-slate-* classes',
        'Includes primary + info CTA pattern',
      ],
    },
    null,
    2,
  );
}

async function execTool(name: string, args: Record<string, unknown>): Promise<string> {
  const db = await requireAdminClient();

  switch (name) {
    case 'list_programs': {
      let q = db
        .from('programs')
        .select('id, title, slug, category, is_active, status')
        .order('title');
      if (args.active_only) q = q.eq('is_active', true);
      const { data, error } = await q.limit(50);
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data, null, 2);
    }

    case 'list_enrollments': {
      const limit = typeof args.limit === 'number' ? args.limit : 20;
      let q = db
        .from('program_enrollments')
        .select('id, status, created_at, program_id, user_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (args.status) q = (q as typeof q).eq('status', String(args.status));
      const { data, error } = await q;
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data, null, 2);
    }

    case 'get_dashboard_stats': {
      const [enrollRes, appRes, certRes, progRes] = await Promise.all([
        db.from('program_enrollments').select('id', { count: 'exact', head: true }),
        db.from('intake_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        db.from('program_completion_certificates').select('id', {
          count: 'exact',
          head: true,
        }),
        db.from('programs')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);
      return JSON.stringify(
        {
          total_enrollments: enrollRes.count ?? 0,
          pending_applications: appRes.count ?? 0,
          certificates_issued: certRes.count ?? 0,
          active_programs: progRes.count ?? 0,
        },
        null,
        2,
      );
    }

    case 'get_recent_applications': {
      const limit = typeof args.limit === 'number' ? args.limit : 10;
      let q = db
        .from('intake_submissions')
        .select('id, status, created_at, program_interest, first_name, last_name, email')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (args.status) q = (q as typeof q).eq('status', String(args.status));
      const { data, error } = await q;
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data, null, 2);
    }

    case 'list_blueprints': {
      try {
        const { execSync } = await import('child_process');
        const out = execSync(
          'grep -h "id:" lib/curriculum/blueprints/*.ts 2>/dev/null | head -20',
          { encoding: 'utf8' },
        );
        return `Registered blueprint IDs:\n${out}`;
      } catch {
        return 'Blueprint list unavailable — check lib/curriculum/blueprints/index.ts';
      }
    }

    case 'design_page_template': {
      return buildTemplate(args);
    }

    case 'run_safe_command': {
      const cmd = String(args.command || '');
      if (!isSafeCommand(cmd)) {
        return `Command not permitted: "${cmd}". Only read-only diagnostics are allowed.`;
      }
      try {
        const { execSync } = await import('child_process');
        const out = execSync(cmd, {
          encoding: 'utf8',
          timeout: 10_000,
          cwd: process.cwd(),
        });
        return out.slice(0, 4000);
      } catch (err) {
        return `Command error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(req);
    if (auth.error) return auth.error;

    await hydrateProcessEnv();

    const { messages, fileContext, documentsContext } = await req.json();

    const systemPrompt = `You are an AI platform controller integrated into Dev Studio for Elevate LMS.
You have tools for live platform data and template generation.

Platform stack: Next.js 16 App Router, Supabase, TypeScript, Tailwind, AWS ECS.

When the user asks for page templates or page design:
- call design_page_template first,
- then return the generated code in a fenced code block with the filename.

Current file context:
${fileContext || 'No file currently open'}

Uploaded documents context:
${documentsContext || 'No uploaded documents available'}

Be direct and actionable.`;

    let assistantMessage: string | null = null;
    let provider = 'none';
    const toolCalls: ToolCallRecord[] = [];

    if (isGroqConfigured()) {
      try {
        const groq = getGroqClient();
        const initial = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.4,
          max_tokens: 4096,
        });

        const choice = initial.choices[0];
        const toolCallRequests = choice?.message?.tool_calls ?? [];

        if (toolCallRequests.length > 0) {
          const execResults = await Promise.all(
            toolCallRequests.map(async (tc) => {
              const args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
              const result = await execTool(tc.function.name, args);
              toolCalls.push({ tool: tc.function.name, args, result });
              return {
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: result,
              };
            }),
          );

          const second = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
              {
                role: 'assistant',
                content: choice.message.content ?? '',
                tool_calls: toolCallRequests,
              },
              ...execResults,
            ],
            temperature: 0.4,
            max_tokens: 4096,
          });
          assistantMessage = second.choices[0]?.message?.content ?? null;
        } else {
          assistantMessage = choice?.message?.content ?? null;
        }

        provider = 'groq';
      } catch (err) {
        logger.warn('[devstudio/chat] Groq failed, trying Gemini', err);
      }
    }

    if (!assistantMessage && isGeminiConfigured()) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });
        const history = messages
          .slice(0, -1)
          .map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));
        const chat = model.startChat({ history });
        const last = messages[messages.length - 1];
        const result = await chat.sendMessage(last.content);
        assistantMessage = result.response.text();
        provider = 'gemini';
      } catch (err) {
        logger.warn('[devstudio/chat] Gemini failed', err);
      }
    }

    if (!assistantMessage && isOpenAIConfigured()) {
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature: 0.4,
          max_tokens: 4096,
        });
        assistantMessage = completion.choices[0]?.message?.content ?? null;
        provider = 'openai';
      } catch (err) {
        logger.warn('[devstudio/chat] OpenAI failed', err);
      }
    }

    if (!assistantMessage) {
      logger.error('[devstudio/chat] no provider available', {
        hasGroq: isGroqConfigured(),
        hasGemini: isGeminiConfigured(),
        hasOpenAI: isOpenAIConfigured(),
      });
      return NextResponse.json(
        {
          error:
            'AI Assistant is not configured. Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to the admin service environment.',
          debug: {
            hasGroq: isGroqConfigured(),
            hasGemini: isGeminiConfigured(),
            hasOpenAI: isOpenAIConfigured(),
            service: 'admin',
          },
        },
        { status: 503 },
      );
    }

    try {
      const supabase = await createClient();
      const db = await requireAdminClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userMessage = messages[messages.length - 1]?.content || '';
      await db
        .from('devstudio_chat_log')
        .insert({
          user_id: user?.id || null,
          user_message: userMessage,
          assistant_response: assistantMessage,
          file_context: fileContext || null,
          provider,
        })
        .catch(() => {});
    } catch (err) {
      logger.warn('[devstudio/chat] DB log failed', err);
    }

    return NextResponse.json({ message: assistantMessage, provider, toolCalls });
  } catch (error) {
    logger.error('[devstudio/chat] error', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/devstudio/chat', _POST);
