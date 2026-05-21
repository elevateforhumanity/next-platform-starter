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
import { getAnthropicClient, isAnthropicConfigured } from '@/lib/anthropic-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type Groq from 'groq-sdk';
import { getRAGContext } from '@/lib/platform/rag';
import { getDevIntPromptContext } from '@/lib/devstudio/devint-container';
import {
  ROUTE_DEPENDENCIES,
  lookupRoute,
  lookupTable,
} from '@/lib/platform/knowledge-graph';
import {
  PROGRAM_REGISTRY,
  getProgramBySlug,
} from '@/lib/platform/system-registry';
import {
  buildAdminAiSystemPrompt,
  isOperationalDiagnosticRequest,
} from '@/lib/platform/admin-ai-assistant';
import { existsSync, readFileSync } from 'fs';
import { execFileSync, execSync } from 'child_process';
import path from 'path';

type ToolCallRecord = { tool: string; args: Record<string, unknown>; result: string };
type ChatProvider = 'auto' | 'groq' | 'openai' | 'gemini' | 'anthropic';

const PROVIDER_MODELS: Record<Exclude<ChatProvider, 'auto'>, string[]> = {
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  anthropic: ['claude-sonnet-4-5', 'claude-3-5-haiku-latest'],
};

function normalizeProvider(value: unknown): ChatProvider {
  return ['auto', 'groq', 'openai', 'gemini', 'anthropic'].includes(String(value))
    ? (String(value) as ChatProvider)
    : 'auto';
}

function modelFor(provider: Exclude<ChatProvider, 'auto'>, requested: unknown) {
  const models = PROVIDER_MODELS[provider];
  const candidate = typeof requested === 'string' ? requested : '';
  return models.includes(candidate) ? candidate : models[0];
}

function toChatMessages(messages: { role: string; content: string }[]) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content ?? ''),
    }));
}

const TOOLS: any[] = [
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
      name: 'inspect_platform_registry',
      description:
        'Search the internal system/program registry and knowledge graph for matching routes, tables, programs, and known platform debt.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Route, program slug, table, component, or problem terms to inspect' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_program_by_slug',
      description:
        'Inspect a program by slug using the static program registry and, when available, live Supabase program/course rows.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Program slug, for example barber, cna, or hvac-technician' },
          include_live: { type: 'boolean', description: 'Also query live Supabase program/course metadata' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_route',
      description:
        'Inspect a Next.js route path for owning system, known dependencies, and matching source files.',
      parameters: {
        type: 'object',
        properties: {
          route_path: { type: 'string', description: 'Route path such as /programs/barber or /admin/dev-studio' },
        },
        required: ['route_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_component_source',
      description:
        'Read a bounded excerpt from an app/component/lib/content/data source file for code-level reasoning.',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Repository-relative path to inspect' },
          max_lines: { type: 'number', description: 'Max lines to return, capped at 220' },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_schema',
      description:
        'Search migrations and generated database types for a table, column, or schema object name.',
      parameters: {
        type: 'object',
        properties: {
          term: { type: 'string', description: 'Table, column, view, policy, or function name' },
        },
        required: ['term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_code',
      description:
        'Search repository source files for a technical term, route, component name, or configuration key.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Literal or regex search term' },
          path_hint: { type: 'string', description: 'Optional safe path prefix such as app, apps/admin/app, components, lib, content, data' },
          limit: { type: 'number', description: 'Maximum matching lines, capped at 80' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'audit_auth_flow',
      description:
        'Inspect a route source file for canonical auth, rate-limit, safe-error, and public-route markers.',
      parameters: {
        type: 'object',
        properties: {
          route_path: { type: 'string', description: 'API or page route path to audit' },
        },
        required: ['route_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_build_errors',
      description:
        'Read recent local build/lint log artifacts when present and return the exact command to run when no persisted log exists.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', description: 'build | lint | typecheck' },
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

const REPO_ROOT = process.cwd();
const SAFE_SOURCE_PREFIXES = [
  '.next/',
  'app/',
  'apps/admin/app/',
  'components/',
  'content/',
  'data/',
  'docs/',
  'lib/',
  'logs/',
  'supabase/migrations/',
  'tmp/',
  'types/',
];

function toSafeRelativePath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/workspace\//, '').replace(/^\.\//, '');
  if (normalized.includes('..') || normalized.startsWith('/')) return null;
  if (!SAFE_SOURCE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return null;
  return normalized;
}

function runRipgrep(args: string[]): string {
  try {
    return execFileSync('rg', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 10_000,
      maxBuffer: 512_000,
    }).slice(0, 12_000);
  } catch (err) {
    const maybe = err as { stdout?: string; message?: string };
    if (maybe.stdout) return maybe.stdout.slice(0, 12_000);
    return `No matches or search error: ${maybe.message ?? String(err)}`;
  }
}

function sourceExcerpt(filePath: string, maxLines = 160): string {
  const safePath = toSafeRelativePath(filePath);
  if (!safePath) return `Refused to read unsafe path: ${filePath}`;

  try {
    const absolute = path.join(REPO_ROOT, safePath);
    if (!existsSync(absolute)) return `File not found: ${safePath}`;
    const contents = readFileSync(absolute, 'utf8')
      .split('\n')
      .slice(0, Math.min(Math.max(maxLines, 20), 220))
      .join('\n');
    return `FILE: ${safePath}\n${contents.slice(0, 16_000)}`;
  } catch (err) {
    return `Could not read ${safePath}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function routeFromSourceFile(file: string): string | null {
  const routeFile = file.replace(/\\/g, '/');
  const appPrefix = routeFile.startsWith('apps/admin/app/')
    ? 'apps/admin/app'
    : routeFile.startsWith('app/')
      ? 'app'
      : null;
  if (!appPrefix) return null;

  const suffix = routeFile.slice(appPrefix.length).replace(/\/(page|route)\.tsx?$/, '');
  if (suffix === '') return '/';
  return suffix
    .replace(/\/\([^)]*\)/g, '')
    .replace(/\/page$/, '')
    .replace(/\/route$/, '') || '/';
}

function routePatternMatches(patternRoute: string, requestedRoute: string): boolean {
  const escaped = patternRoute
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\[\\\[\\.\\.\\.([^/]+)\\\]\\\]/g, '(?:/.*)?')
    .replace(/\\\[\\.\\.\\.([^/]+)\\\]/g, '.+')
    .replace(/\\\[([^/]+)\\\]/g, '[^/]+');
  return new RegExp(`^${escaped}$`).test(requestedRoute);
}

function findRouteFiles(routePath: string): string[] {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const files = runRipgrep(['--files', 'app', 'apps/admin/app', '-g', 'page.tsx', '-g', 'route.ts'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return files.filter((file) => {
    const route = routeFromSourceFile(file);
    return route ? route === normalized || routePatternMatches(route, normalized) : false;
  });
}

function inspectPlatformRegistry(query: string): string {
  const terms = query.toLowerCase().split(/[^a-z0-9/_-]+/).filter(Boolean);
  const matchesTerm = (value: string) => terms.some((term) => value.toLowerCase().includes(term));
  const programMatches = PROGRAM_REGISTRY
    .filter((program) => matchesTerm(`${program.slug} ${program.title} ${program.category} ${program.canonical_route}`))
    .slice(0, 12);
  const routeMatches = Object.entries(ROUTE_DEPENDENCIES)
    .filter(([route, deps]) => matchesTerm(`${route} ${deps.tables.join(' ')} ${deps.apis.join(' ')} ${deps.components.join(' ')}`))
    .slice(0, 12);
  const tableMatches = Array.from(new Set(Object.values(ROUTE_DEPENDENCIES).flatMap((deps) => deps.tables)))
    .filter((table) => matchesTerm(table))
    .map((table) => ({ table, owners: lookupTable(table).map((system) => system.id) }))
    .slice(0, 12);

  return JSON.stringify(
    {
      query,
      program_matches: programMatches,
      route_dependency_matches: routeMatches.map(([route, deps]) => ({ route, ...deps, owner: lookupRoute(route)?.id ?? null })),
      table_matches: tableMatches,
    },
    null,
    2,
  );
}

function inspectRoute(routePath: string): string {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const sourceFiles = findRouteFiles(normalized);
  const dependencyEntry = Object.entries(ROUTE_DEPENDENCIES).find(([route]) =>
    route === normalized || routePatternMatches(route, normalized)
  );
  const owningSystem = lookupRoute(normalized)?.id ?? (dependencyEntry ? lookupRoute(dependencyEntry[0])?.id ?? null : null);

  return JSON.stringify(
    {
      route: normalized,
      owning_system: owningSystem,
      known_dependencies: dependencyEntry ? { route_pattern: dependencyEntry[0], ...dependencyEntry[1] } : null,
      source_files: sourceFiles,
      source_excerpts: sourceFiles.slice(0, 3).map((file) => sourceExcerpt(file, 90)),
    },
    null,
    2,
  );
}

function searchCode(query: string, pathHint?: string, limit = 40): string {
  const safeHint = pathHint ? toSafeRelativePath(pathHint.endsWith('/') ? pathHint : `${pathHint}/`) : null;
  const paths = safeHint ? [safeHint] : ['app', 'apps/admin/app', 'components', 'content', 'data', 'lib'];
  return runRipgrep([
    '-n',
    '-F',
    query.slice(0, 160),
    ...paths,
    '-g',
    '*.{ts,tsx,js,jsx,json,md}',
  ])
    .split('\n')
    .slice(0, Math.min(Math.max(limit, 5), 80))
    .join('\n');
}

function inspectBuildErrors(kind: string): string {
  const candidates = [
    `.next/${kind}.log`,
    `logs/${kind}.log`,
    `tmp/${kind}.log`,
    `${kind}.log`,
  ];
  const found = candidates.find((candidate) => existsSync(path.join(REPO_ROOT, candidate)));
  if (!found) {
    const command =
      kind === 'lint'
        ? 'pnpm lint'
        : kind === 'typecheck'
          ? 'NODE_OPTIONS=--max-old-space-size=8192 pnpm typecheck'
          : 'NODE_OPTIONS=--max-old-space-size=6144 pnpm build';
    return `No persisted ${kind || 'build'} log found. Run this command to collect fresh evidence: ${command}`;
  }
  return sourceExcerpt(found, 220);
}

async function collectAutomaticEvidence(query: string): Promise<ToolCallRecord[]> {
  if (!isOperationalDiagnosticRequest(query)) return [];

  const records: ToolCallRecord[] = [];
  const registryResult = await execTool('inspect_platform_registry', { query });
  records.push({ tool: 'inspect_platform_registry', args: { query }, result: registryResult });

  const normalized = query.toLowerCase();
  const mentionedProgram = PROGRAM_REGISTRY.find((program) =>
    normalized.includes(program.slug) || normalized.includes(program.title.toLowerCase())
  );
  if (mentionedProgram) {
    const result = await execTool('query_program_by_slug', {
      slug: mentionedProgram.slug,
      include_live: false,
    });
    records.push({
      tool: 'query_program_by_slug',
      args: { slug: mentionedProgram.slug, include_live: false },
      result,
    });
  }

  if (/\b(hero|banner|video|poster)\b/i.test(query)) {
    const result = await execTool('search_code', {
      query: 'HeroVideo',
      path_hint: 'components',
      limit: 20,
    });
    records.push({
      tool: 'search_code',
      args: { query: 'HeroVideo', path_hint: 'components', limit: 20 },
      result,
    });
  }

  return records;
}

function formatAutomaticEvidence(records: ToolCallRecord[]): string {
  if (!records.length) return '';
  return records
    .map((record) => {
      const args = Object.keys(record.args).length ? ` ${JSON.stringify(record.args)}` : '';
      return `### ${record.tool}${args}\n${record.result.slice(0, 4000)}`;
    })
    .join('\n\n');
}

function enforceEvidenceBoundary(message: string, query: string, records: ToolCallRecord[]): string {
  if (!isOperationalDiagnosticRequest(query)) return message;

  const hasEvidenceStatus = /Evidence used:/i.test(message) || /No live tool was executed/i.test(message);
  if (hasEvidenceStatus) return message;

  const evidenceLine = records.length
    ? `Evidence used: ${records.map((record) => record.tool).join(', ')}.`
    : 'Evidence used: No live tool was executed for this answer.';

  return `Problem:\n${query}\n\n${evidenceLine}\n\n${message}`;
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


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
  switch (name) {
    case 'list_programs': {
      const db = await requireAdminClient();
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
      const db = await requireAdminClient();
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
      const db = await requireAdminClient();
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
      const db = await requireAdminClient();
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

    case 'inspect_platform_registry': {
      return inspectPlatformRegistry(String(args.query || ''));
    }

    case 'query_program_by_slug': {
      const slug = String(args.slug || '').trim().toLowerCase();
      const registry = getProgramBySlug(slug) ?? null;
      let live: Record<string, unknown> | null = null;

      if (args.include_live !== false) {
        try {
          const db = await requireAdminClient();
          const { data: program, error: programError } = await db
            .from('programs')
            .select('id, title, slug, category, is_active, published, status, short_description')
            .eq('slug', slug)
            .maybeSingle();
          const { data: courses, error: courseError } = await db
            .from('courses')
            .select('id, title, slug, program_id, status')
            .eq('program_id', program?.id ?? '00000000-0000-0000-0000-000000000000')
            .limit(10);
          live = {
            program: programError ? { error: programError.message } : program,
            courses: courseError ? { error: courseError.message } : courses,
          };
        } catch (err) {
          live = { error: err instanceof Error ? err.message : String(err) };
        }
      }

      return JSON.stringify(
        {
          slug,
          registry,
          live,
          likely_files: [
            `data/programs/${slug}.ts`,
            `app/programs/${slug}/page.tsx`,
            'app/programs/[program]/page.tsx',
            'components/programs/ProgramDetailPage.tsx',
          ],
        },
        null,
        2,
      );
    }

    case 'inspect_route': {
      return inspectRoute(String(args.route_path || ''));
    }

    case 'get_component_source': {
      return sourceExcerpt(String(args.file_path || ''), typeof args.max_lines === 'number' ? args.max_lines : 160);
    }

    case 'search_schema': {
      const term = String(args.term || '').slice(0, 120);
      const matches = runRipgrep([
        '-n',
        '-F',
        term,
        'supabase/migrations',
        'types/database.generated.ts',
        '-g',
        '*.{sql,ts}',
      ]);
      return matches || `No schema matches for ${term}`;
    }

    case 'search_code': {
      return searchCode(
        String(args.query || ''),
        typeof args.path_hint === 'string' ? args.path_hint : undefined,
        typeof args.limit === 'number' ? args.limit : 40,
      );
    }

    case 'audit_auth_flow': {
      const route = String(args.route_path || '');
      const files = findRouteFiles(route);
      if (!files.length) return `No source file found for route: ${route}`;
      const audits = files.map((file) => {
        const safePath = toSafeRelativePath(file);
        const contents = safePath ? readFileSync(path.join(REPO_ROOT, safePath), 'utf8') : '';
        return {
          file,
          has_apiRequireAdmin: contents.includes('apiRequireAdmin'),
          has_apiAuthGuard: contents.includes('apiAuthGuard'),
          has_apiRequireInstructor: contents.includes('apiRequireInstructor'),
          has_applyRateLimit: contents.includes('applyRateLimit'),
          has_safe_error: /safe(Error|InternalError|DbError)/.test(contents),
          has_public_route_comment: contents.includes('PUBLIC ROUTE:'),
        };
      });
      return JSON.stringify(audits, null, 2);
    }

    case 'inspect_build_errors': {
      return inspectBuildErrors(String(args.kind || 'build'));
    }

    case 'list_blueprints': {
      try {
        const out = runRipgrep(['-n', '-F', 'id:', 'lib/curriculum/blueprints', '-g', '*.ts'])
          .split('\n')
          .slice(0, 20)
          .join('\n');
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

    const { messages, fileContext, documentsContext, provider: rawProvider, model: rawModel } = await req.json();
    const providerPreference = normalizeProvider(rawProvider);

    // Retrieve relevant platform knowledge via RAG before answering
    const lastUserMessage = messages.findLast((m: { role: string }) => m.role === 'user')?.content ?? '';
    const ragContext = await getRAGContext(lastUserMessage);
    const toolCalls: ToolCallRecord[] = [];
    const automaticEvidence = await collectAutomaticEvidence(lastUserMessage);
    toolCalls.push(...automaticEvidence);

    const systemPrompt = buildAdminAiSystemPrompt({
      ragContext: `## DevInt Operating Container\n${getDevIntPromptContext()}\n\n${ragContext || ''}`,
      fileContext,
      documentsContext,
      lastUserMessage,
      automaticEvidence: formatAutomaticEvidence(automaticEvidence),
      toolInventory: TOOLS.map((tool) => tool.function.name),
    });

    let assistantMessage: string | null = null;
    let provider = 'none';
    let model = 'none';
    const providerOrder: Exclude<ChatProvider, 'auto'>[] =
      providerPreference === 'auto'
        ? ['groq', 'openai', 'anthropic', 'gemini']
        : [providerPreference];

    for (const nextProvider of providerOrder) {
      if (assistantMessage) break;

      if (nextProvider === 'groq' && isGroqConfigured()) {
        try {
          const selectedModel = modelFor('groq', rawModel);
          const groq = getGroqClient();
          const initial = await groq.chat.completions.create({
            model: selectedModel,
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
              model: selectedModel,
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
          model = selectedModel;
        } catch (err) {
          logger.warn('[devstudio/chat] Groq failed', err);
        }
      }

      if (nextProvider === 'openai' && isOpenAIConfigured()) {
        try {
          const selectedModel = modelFor('openai', rawModel);
          const openai = getOpenAIClient();
          const completion = await openai.chat.completions.create({
            model: selectedModel,
            messages: [{ role: 'system', content: systemPrompt }, ...toChatMessages(messages)],
            temperature: 0.4,
            max_tokens: 4096,
          });
          assistantMessage = completion.choices[0]?.message?.content ?? null;
          provider = 'openai';
          model = selectedModel;
        } catch (err) {
          logger.warn('[devstudio/chat] OpenAI failed', err);
        }
      }

      if (nextProvider === 'anthropic' && isAnthropicConfigured()) {
        try {
          const selectedModel = modelFor('anthropic', rawModel);
          const anthropic = getAnthropicClient();
          const response = await anthropic.messages.create({
            model: selectedModel,
            max_tokens: 4096,
            system: systemPrompt,
            messages: toChatMessages(messages),
          });
          assistantMessage =
            response.content.find((block) => block.type === 'text')?.text ?? null;
          provider = 'anthropic';
          model = selectedModel;
        } catch (err) {
          logger.warn('[devstudio/chat] Anthropic failed', err);
        }
      }

      if (nextProvider === 'gemini' && isGeminiConfigured()) {
        try {
          const selectedModel = modelFor('gemini', rawModel);
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
          const geminiModel = genAI.getGenerativeModel({
            model: selectedModel,
            systemInstruction: systemPrompt,
          });
          const history = messages
            .slice(0, -1)
            .map((m: { role: string; content: string }) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            }));
          const chat = geminiModel.startChat({ history });
          const last = messages[messages.length - 1];
          const result = await chat.sendMessage(last.content);
          assistantMessage = result.response.text();
          provider = 'gemini';
          model = selectedModel;
        } catch (err) {
          logger.warn('[devstudio/chat] Gemini failed', err);
        }
      }
    }

    if (!assistantMessage) {
      logger.error('[devstudio/chat] no provider available', undefined, {
        hasGroq: isGroqConfigured(),
        hasGemini: isGeminiConfigured(),
        hasOpenAI: isOpenAIConfigured(),
        hasAnthropic: isAnthropicConfigured(),
      });
      return NextResponse.json(
        {
          error:
            'AI Assistant is not configured. Add GROQ_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to the admin service environment.',
          debug: {
            hasGroq: isGroqConfigured(),
            hasOpenAI: isOpenAIConfigured(),
            hasAnthropic: isAnthropicConfigured(),
            hasGemini: isGeminiConfigured(),
            requestedProvider: providerPreference,
            service: 'admin',
          },
        },
        { status: 503 },
      );
    }

    assistantMessage = enforceEvidenceBoundary(assistantMessage, lastUserMessage, toolCalls);

    try {
      const supabase = await createClient();
      const db = await requireAdminClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userMessage = messages[messages.length - 1]?.content || '';
      const { error: logError } = await db
        .from('devstudio_chat_log')
        .insert({
          user_id: user?.id || null,
          user_message: userMessage,
          assistant_response: assistantMessage,
          file_context: fileContext || null,
          provider,
          model,
        });
      if (logError) {
        logger.warn('[devstudio/chat] DB log insert failed', { reason: logError.message });
      }
    } catch (err) {
      logger.warn('[devstudio/chat] DB log failed', err);
    }

    return NextResponse.json({
      message: assistantMessage,
      provider,
      model,
      providerPreference,
      availableProviders: {
        groq: isGroqConfigured(),
        openai: isOpenAIConfigured(),
        anthropic: isAnthropicConfigured(),
        gemini: isGeminiConfigured(),
      },
      toolCalls,
    });
  } catch (error) {
    logger.error('[devstudio/chat] error', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/devstudio/chat', _POST);
