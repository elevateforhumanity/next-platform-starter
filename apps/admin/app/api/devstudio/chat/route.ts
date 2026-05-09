/**
 * /api/devstudio/chat
 *
 * AI platform controller for Dev Studio.  Admin-only.
 *
 * Provider chain:
 *   1. Groq — llama-3.3-70b-versatile  (supports function/tool calling)
 *   2. Gemini — gemini-1.5-flash        (fallback, no tool calling)
 *
 * Tool calling lets the AI actually control the platform:
 *   list_programs, list_enrollments, get_dashboard_stats,
 *   generate_course, run_safe_command, get_recent_applications
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
import { GoogleGenerativeAI } from '@google/generative-ai';
import type Groq from 'groq-sdk';

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: Groq.Chat.Completions.Tool[] = [
  {
    type: 'function',
    function: {
      name: 'list_programs',
      description: 'List all training programs on the platform with their status, enrollment count, and category.',
      parameters: { type: 'object', properties: { active_only: { type: 'boolean', description: 'Only show active/published programs' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_enrollments',
      description: 'List recent student enrollments with program name, student name, status, and date.',
      parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max rows to return (default 20)' }, status: { type: 'string', description: 'Filter by status: active | completed | pending' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get high-level platform stats: total enrollments, pending applications, certificates issued, active programs.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_applications',
      description: 'Get the most recent student applications with their status (pending/approved/rejected).',
      parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max rows (default 10)' }, status: { type: 'string', description: 'pending | approved | rejected' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_safe_command',
      description: 'Run a pre-approved read-only shell command. Only diagnostic commands are permitted (git status, git log, pnpm lint --dry-run, ls, etc). No writes.',
      parameters: { type: 'object', properties: { command: { type: 'string', description: 'The shell command to run' } }, required: ['command'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_blueprints',
      description: 'List all registered course blueprints available for course generation.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ─── Tool executors ──────────────────────────────────────────────────────────

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

async function execTool(name: string, args: Record<string, unknown>): Promise<string> {
  const db = await requireAdminClient();

  switch (name) {
    case 'list_programs': {
      let q = db.from('programs').select('id, title, slug, category, is_active, status').order('title');
      if (args.active_only) q = q.eq('is_active', true);
      const { data, error } = await q.limit(50);
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data, null, 2);
    }

    case 'list_enrollments': {
      const limit = typeof args.limit === 'number' ? args.limit : 20;
      let q = db.from('program_enrollments')
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
        db.from('intake_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
        db.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return JSON.stringify({
        total_enrollments: enrollRes.count ?? 0,
        pending_applications: appRes.count ?? 0,
        certificates_issued: certRes.count ?? 0,
        active_programs: progRes.count ?? 0,
      }, null, 2);
    }

    case 'get_recent_applications': {
      const limit = typeof args.limit === 'number' ? args.limit : 10;
      let q = db.from('intake_submissions')
        .select('id, status, created_at, program_interest, first_name, last_name, email')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (args.status) q = (q as typeof q).eq('status', String(args.status));
      const { data, error } = await q;
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data, null, 2);
    }

    case 'list_blueprints': {
      // Read the blueprint index file for registered blueprints
      try {
        const { execSync } = await import('child_process');
        const out = execSync('grep -h "id:" lib/curriculum/blueprints/*.ts 2>/dev/null | head -20', { encoding: 'utf8' });
        return `Registered blueprint IDs:\n${out}`;
      } catch {
        return 'Blueprint list unavailable — check lib/curriculum/blueprints/index.ts';
      }
    }

    case 'run_safe_command': {
      const cmd = String(args.command || '');
      if (!isSafeCommand(cmd)) {
        return `Command not permitted: "${cmd}". Only read-only diagnostic commands are allowed.`;
      }
      try {
        const { execSync } = await import('child_process');
        const out = execSync(cmd, { encoding: 'utf8', timeout: 10_000, cwd: process.cwd() });
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
You have direct access to platform data and controls via tools.

Platform stack: Next.js 16 App Router · Supabase PostgreSQL · TypeScript · Tailwind CSS · AWS ECS

CAPABILITIES — use tools freely when the admin asks:
- list_programs / list_enrollments / get_dashboard_stats / get_recent_applications
- list_blueprints — see available course blueprints
- run_safe_command — run read-only shell diagnostics

COURSE GENERATION: When asked to generate a course, tell the admin: "Run this command in the terminal tab to spin up the course:"
  pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint <id> --program <programId>
Then explain what it does.

CODE EDITING: When asked to edit a file, respond with the complete updated code in a fenced code block with the filename:
\`\`\`filename.tsx
// complete file content here
\`\`\`

Current file context:
${fileContext || 'No file currently open'}

Uploaded documents context:
${documentsContext || 'No uploaded documents available'}

Be direct, specific, and actionable. Use tools before answering data questions — don't guess.`;

    let assistantMessage: string | null = null;
    let provider = 'none';
    const toolCalls: { tool: string; args: Record<string, unknown>; result: string }[] = [];

    // ── 1. Groq with tool calling ──────────────────────────────────────────
    if (isGroqConfigured()) {
      try {
        const groq = getGroqClient();

        // Initial request with tools
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
          // Execute all tool calls in parallel
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
            })
          );

          // Second pass with tool results
          const second = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
              { role: 'assistant', content: choice.message.content ?? '', tool_calls: toolCallRequests },
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

    // ── 2. Gemini fallback (no tool calling) ──────────────────────────────
    if (!assistantMessage && isGeminiConfigured()) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
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

    if (!assistantMessage) {
      logger.error('[devstudio/chat] no provider available', {
        hasGroq: isGroqConfigured(),
        hasGemini: isGeminiConfigured(),
      });
      return NextResponse.json(
        {
          error: 'AI Assistant is not configured. Add GROQ_API_KEY or GEMINI_API_KEY to the admin service environment (SSM Parameter Store → /elevate/GROQ_API_KEY).',
          debug: { hasGroq: isGroqConfigured(), hasGemini: isGeminiConfigured(), service: 'admin' },
        },
        { status: 503 }
      );
    }

    // Log to DB — non-fatal
    try {
      const supabase = await createClient();
      const db = await requireAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userMessage = messages[messages.length - 1]?.content || '';
      await db.from('devstudio_chat_log').insert({
        user_id: user?.id || null,
        user_message: userMessage,
        assistant_response: assistantMessage,
        file_context: fileContext || null,
        provider,
      }).catch(() => {});
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

    const systemPrompt = `You are an expert coding assistant integrated into Dev Studio, a browser-based IDE for the Elevate LMS platform.
Stack: Next.js 16 App Router, Supabase (PostgreSQL), TypeScript, Tailwind CSS, AWS ECS.

You help admins:
- Write and edit code
- Debug issues
- Explain code
- Suggest improvements

When asked to edit a file, respond with the complete updated code in a fenced code block with the filename:
\`\`\`filename.tsx
// complete file content here
\`\`\`

Current file context:
${fileContext || 'No file currently open'}

Uploaded documents context:
${documentsContext || 'No uploaded documents available'}

Be concise and direct. Provide working code.`;

    let assistantMessage: string | null = null;
    let provider = 'none';

    // 1. Try Groq (free, fast — llama-3.3-70b)
    if (isGroqConfigured()) {
      try {
        const groq = getGroqClient();
        const res = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature: 0.5,
          max_tokens: 4096,
        });
        assistantMessage = res.choices[0]?.message?.content ?? null;
        provider = 'groq';
      } catch (err) {
        logger.warn('[devstudio/chat] Groq failed, trying Gemini', err);
      }
    }

    // 2. Fallback to Gemini (free — gemini-1.5-flash)
    if (!assistantMessage && isGeminiConfigured()) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
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

    if (!assistantMessage) {
      logger.error('[devstudio/chat] no provider available', {
        hasGroq: isGroqConfigured(),
        hasGemini: isGeminiConfigured(),
      });
      return NextResponse.json(
        {
          error: 'AI Assistant is not configured. Add GROQ_API_KEY or GEMINI_API_KEY to the admin service environment (SSM Parameter Store → /elevate/GROQ_API_KEY).',
          debug: { hasGroq: isGroqConfigured(), hasGemini: isGeminiConfigured(), service: 'admin' },
        },
        { status: 503 }
      );
    }

    // Log to DB — non-fatal
    try {
      const supabase = await createClient();
      const db = await requireAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userMessage = messages[messages.length - 1]?.content || '';
      await db.from('devstudio_chat_log').insert({
        user_id: user?.id || null,
        user_message: userMessage,
        assistant_response: assistantMessage,
        file_context: fileContext || null,
        provider,
      }).catch(() => {});
    } catch (err) {
      logger.warn('[devstudio/chat] DB log failed', err);
    }

    return NextResponse.json({ message: assistantMessage, provider });
  } catch (error) {
    logger.error('[devstudio/chat] error', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/devstudio/chat', _POST);
