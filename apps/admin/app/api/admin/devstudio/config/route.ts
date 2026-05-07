import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type WorkflowKey = 'deploy-lms' | 'deploy-admin' | 'ci' | 'lint';

interface DevStudioConfigResponse {
  quickCommands: string[];
  workflowButtons: { key: WorkflowKey; label: string; description: string }[];
  defaultPreviewUrl: string;
  previewTargets: { label: string; url: string }[];
  tabFiles: Record<string, string>;
}

function parseJsonSetting<T>(
  value: string | null | undefined,
  fallback: T,
  key: string,
  validate?: (parsed: unknown) => parsed is T,
): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (validate && !validate(parsed)) {
      logger.warn(`[devstudio/config] invalid shape for ${key}, using fallback`);
      return fallback;
    }
    return parsed as T;
  } catch (error) {
    logger.warn(`[devstudio/config] failed to parse ${key}, using fallback`, error);
    return fallback;
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

function isWorkflowButtons(
  v: unknown,
): v is { key: WorkflowKey; label: string; description: string }[] {
  const validKeys: WorkflowKey[] = ['deploy-lms', 'deploy-admin', 'ci', 'lint'];
  return (
    Array.isArray(v) &&
    v.every(
      (item): item is { key: WorkflowKey; label: string; description: string } => {
        if (!item || typeof item !== 'object') return false;
        if (!('key' in item) || !('label' in item) || !('description' in item)) return false;
        const key = item.key;
        const label = item.label;
        const description = item.description;
        return (
          typeof key === 'string' &&
          validKeys.includes(key as WorkflowKey) &&
          typeof label === 'string' &&
          typeof description === 'string'
        );
      },
    )
  );
}

function isPreviewTargets(v: unknown): v is { label: string; url: string }[] {
  return (
    Array.isArray(v) &&
    v.every(
      (item): item is { label: string; url: string } => {
        if (!item || typeof item !== 'object') return false;
        if (!('label' in item) || !('url' in item)) return false;
        return typeof item.label === 'string' && typeof item.url === 'string';
      },
    )
  );
}

function isRecordString(v: unknown): v is Record<string, string> {
  return !!v && typeof v === 'object' && Object.values(v).every((val) => typeof val === 'string');
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const fallback: DevStudioConfigResponse = {
    quickCommands: [
      'Show git status',
      'List recent files changed',
      'Run pnpm lint',
      'Show build errors',
      'List open ports',
      'Show loaded secrets (key names only)',
    ],
    workflowButtons: [
      { key: 'deploy-lms', label: 'Deploy LMS', description: 'Build + push LMS to ECS' },
      { key: 'deploy-admin', label: 'Deploy Admin', description: 'Build + push Admin to ECS' },
      { key: 'ci', label: 'Run CI', description: 'Full CI pipeline' },
      { key: 'lint', label: 'Lint', description: 'Run pnpm lint' },
    ],
    // In dev, default to localhost so the iframe isn't blocked by X-Frame-Options on the
    // production site. In production the admin app itself is on the same origin, so
    // pointing at the LMS port (3000) is the safest embeddable target.
    defaultPreviewUrl:
      process.env.NODE_ENV === 'development'
        ? (process.env.DEVSTUDIO_PREVIEW_URL || 'http://localhost:3000')
        : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'),
    previewTargets: [
      ...(process.env.NODE_ENV === 'development'
        ? [
            { label: 'Local :3000', url: process.env.DEVSTUDIO_PREVIEW_URL || 'http://localhost:3000' },
            { label: 'Local :3001', url: 'http://localhost:3001' },
          ]
        : []),
      { label: 'Public', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org' },
      { label: 'Admin', url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org' },
      { label: 'LMS', url: process.env.NEXT_PUBLIC_LMS_URL || 'https://admin.elevateforhumanity.org/lms' },
    ],
    tabFiles: {
      command: 'command.sh',
      chat: 'ai-chat.md',
      terminal: 'terminal.sh',
      files: 'explorer',
      website: 'preview.html',
      container: 'devcontainer.json',
    },
  };

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'DEVSTUDIO_QUICK_COMMANDS_JSON',
        'DEVSTUDIO_WORKFLOW_BUTTONS_JSON',
        'DEVSTUDIO_DEFAULT_PREVIEW_URL',
        'DEVSTUDIO_PREVIEW_TARGETS_JSON',
        'DEVSTUDIO_TAB_FILES_JSON',
      ]);

    if (error) throw error;

    const settings = new Map<string, string>((data ?? []).map((r) => [r.key, r.value ?? '']));

    const response: DevStudioConfigResponse = {
      quickCommands: parseJsonSetting<string[]>(
        settings.get('DEVSTUDIO_QUICK_COMMANDS_JSON'),
        fallback.quickCommands,
        'DEVSTUDIO_QUICK_COMMANDS_JSON',
        isStringArray,
      ),
      workflowButtons: parseJsonSetting<DevStudioConfigResponse['workflowButtons']>(
        settings.get('DEVSTUDIO_WORKFLOW_BUTTONS_JSON'),
        fallback.workflowButtons,
        'DEVSTUDIO_WORKFLOW_BUTTONS_JSON',
        isWorkflowButtons,
      ),
      defaultPreviewUrl: settings.get('DEVSTUDIO_DEFAULT_PREVIEW_URL') || fallback.defaultPreviewUrl,
      previewTargets: parseJsonSetting<DevStudioConfigResponse['previewTargets']>(
        settings.get('DEVSTUDIO_PREVIEW_TARGETS_JSON'),
        fallback.previewTargets,
        'DEVSTUDIO_PREVIEW_TARGETS_JSON',
        isPreviewTargets,
      ),
      tabFiles: parseJsonSetting<Record<string, string>>(
        settings.get('DEVSTUDIO_TAB_FILES_JSON'),
        fallback.tabFiles,
        'DEVSTUDIO_TAB_FILES_JSON',
        isRecordString,
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.warn('[devstudio/config] falling back to defaults', error);
    return NextResponse.json(fallback);
  }
}
