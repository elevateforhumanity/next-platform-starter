/**
 * Typed confirmation guard for production-mutating actions.
 *
 * The AI cannot set confirmationText — it must come from a human
 * typing it explicitly in the UI. This prevents autonomous execution
 * of deploys, migrations, and other destructive actions.
 */

export type ConfirmationAction = 'CONFIRM DEPLOY' | 'CONFIRM MIGRATION' | 'CONFIRM ROLLBACK' | 'CONFIRM BULK EMAIL';

const ACTION_PHRASES: Record<string, ConfirmationAction> = {
  deploy_autopilot:              'CONFIRM DEPLOY',
  run_migration:                 'CONFIRM MIGRATION',
  apply_all_pending_migrations:  'CONFIRM MIGRATION',
  rollback:                      'CONFIRM ROLLBACK',
  send_bulk_email:               'CONFIRM BULK EMAIL',
};

export function getConfirmationPhrase(action: string): ConfirmationAction | null {
  return ACTION_PHRASES[action] ?? null;
}

export function requireTypedConfirmation(
  userInput: string | undefined,
  action: string,
): { ok: true } | { ok: false; required: string } {
  const required = getConfirmationPhrase(action);
  if (!required) return { ok: true }; // action doesn't need confirmation

  if (userInput !== required) {
    return { ok: false, required };
  }

  return { ok: true };
}
