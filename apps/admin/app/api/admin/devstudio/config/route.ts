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

function parseJsonSetting<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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
    defaultPreviewUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    previewTargets: [
      { label: 'Public', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org' },
      { label: 'Admin', url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://app.elevateforhumanity.org' },
      { label: 'LMS', url: process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org/lms' },
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

    const settings = new Map((data ?? []).map((r) => [r.key, r.value]));

    const response: DevStudioConfigResponse = {
      quickCommands: parseJsonSetting<string[]>(
        settings.get('DEVSTUDIO_QUICK_COMMANDS_JSON'),
        fallback.quickCommands,
      ),
      workflowButtons: parseJsonSetting<DevStudioConfigResponse['workflowButtons']>(
        settings.get('DEVSTUDIO_WORKFLOW_BUTTONS_JSON'),
        fallback.workflowButtons,
      ),
      defaultPreviewUrl: settings.get('DEVSTUDIO_DEFAULT_PREVIEW_URL') || fallback.defaultPreviewUrl,
      previewTargets: parseJsonSetting<DevStudioConfigResponse['previewTargets']>(
        settings.get('DEVSTUDIO_PREVIEW_TARGETS_JSON'),
        fallback.previewTargets,
      ),
      tabFiles: parseJsonSetting<Record<string, string>>(
        settings.get('DEVSTUDIO_TAB_FILES_JSON'),
        fallback.tabFiles,
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.warn('[devstudio/config] falling back to defaults', error);
    return NextResponse.json(fallback);
  }
}
