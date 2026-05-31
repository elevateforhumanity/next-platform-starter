/**
 * Routes a single Ellie message to the correct existing backend:
 * - command → /api/devstudio/execute (SSE deploy, smoke, bulk ops)
 * - ops     → /api/admin/ai-assistant (live data + staged approvals)
 * - platform → /api/devstudio/chat (tools, code, schema, course gen)
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';

const COMMAND_RE =
  /^(deploy\b|run smoke|smoke\s*test|force[- ]?redeploy|build courses?\b|generate course|check system health|system health|run tests?\b|git push|trigger (the )?(lms|admin|studio) deploy)/i;

const OPS_RE =
  /\b(pending application|approve application|reject application|at[- ]?risk|send reminder|how many (student|enrollment|application)|dashboard stat|live data|schedule exam|cancel exam|magic link|case manager|program holder|wioa|compliance alert|hot lead)\b/i;

const PLATFORM_RE =
  /\b(fix|bug|broken|error|failing|route\.ts|middleware|migration|schema|rls|component|search code|inspect|blueprint|generate video|course id|supabase|deploy did not|ecs|container|build spec)\b/i;

export function routeEllieMessage(message: string): EllieMessageRoute {
  const text = message.trim();
  if (!text) return 'platform';
  if (COMMAND_RE.test(text)) return 'command';
  if (OPS_RE.test(text) && !PLATFORM_RE.test(text)) return 'ops';
  if (PLATFORM_RE.test(text)) return 'platform';
  // Short operational questions
  if (/^(how many|what('s| is) the|show (me )?|list )/i.test(text) && text.length < 120) return 'ops';
  return 'platform';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Command',
  ops: 'Ops',
  platform: 'Platform',
};
