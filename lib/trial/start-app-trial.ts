/**
 * Shared server-side helper for starting a 14-day app trial.
 * Used by start-trial server actions across all app pages.
 * Single source of truth — TRIAL_DURATION_DAYS defined once here.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const TRIAL_DURATION_DAYS = 14;

export type StartTrialResult =
  | { status: 'started'; trialEndsAt: string }
  | { status: 'exists' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string };

export async function startAppTrial(
  userId: string,
  appSlug: string,
): Promise<StartTrialResult> {
  try {
    const db = await getAdminClient();

    const { data: existing } = await db
      .from('user_app_subscriptions')
      .select('id, status, trial_ends_at')
      .eq('user_id', userId)
      .eq('app_slug', appSlug)
      .maybeSingle();

    if (existing) {
      return { status: 'exists' };
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { error } = await db.from('user_app_subscriptions').insert({
      user_id: userId,
      app_slug: appSlug,
      plan: 'starter',
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    });

    if (error) {
      logger.error('[startAppTrial] insert failed', { appSlug, userId, error });
      return { status: 'error', message: error.message };
    }

    return { status: 'started', trialEndsAt: trialEndsAt.toISOString() };
  } catch (err) {
    logger.error('[startAppTrial] unexpected error', { appSlug, userId, err });
    return { status: 'error', message: 'Unexpected error starting trial' };
  }
}
