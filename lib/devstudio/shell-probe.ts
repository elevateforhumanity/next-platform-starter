/**
 * HTTP health probe for the studio-shell ECS service (PTY + /repo workspace).
 */

export type ShellProbe = {
  reachable: boolean;
  ready: boolean;
  status: string;
  setupStatus?: string;
  hasGitDir?: boolean;
  gitVersion?: string | null;
  pnpmVersion?: string | null;
  nodeVersion?: string | null;
  error?: string;
};

export function shellHealthUrl(wsUrl: string): string | null {
  if (!wsUrl?.trim()) return null;
  try {
    const url = new URL(wsUrl.trim());
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/health';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

export async function probeStudioShell(wsUrl?: string): Promise<ShellProbe> {
  const url = wsUrl ?? process.env.STUDIO_SHELL_WS_URL ?? '';
  const healthUrl = shellHealthUrl(url);
  if (!healthUrl) {
    return { reachable: false, ready: false, status: 'missing-url', setupStatus: 'STUDIO_SHELL_WS_URL not set' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(healthUrl, { cache: 'no-store', signal: controller.signal });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      reachable: true,
      ready: res.ok && body.ready === true,
      status: String(body.status ?? (res.ok ? 'ok' : 'not-ready')),
      setupStatus: typeof body.setupStatus === 'string' ? body.setupStatus : undefined,
      hasGitDir: body.hasGitDir === true,
      gitVersion: (body.gitVersion as string | null) ?? null,
      pnpmVersion: (body.pnpmVersion as string | null) ?? null,
      nodeVersion: (body.nodeVersion as string | null) ?? null,
    };
  } catch (err) {
    return {
      reachable: false,
      ready: false,
      status: 'unreachable',
      setupStatus: 'Cannot reach studio-shell (check VPC / service discovery / STUDIO_SHELL_WS_URL)',
      error: err instanceof Error ? err.message : 'unknown',
    };
  } finally {
    clearTimeout(timeout);
  }
}
