/**
 * Elevate Dev Cloud workspace subscription tiers.
 * @see docs/platform-owner-tenant-model.md
 */

export type WorkspaceSubscriptionTier = 'builder' | 'pro' | 'agency';

export type WorkspaceTierLimits = {
  maxWorkspaces: number;
  maxDatabaseGb: number;
  customDomains: boolean;
  teamAccess: boolean;
  whiteLabel: boolean;
  aiOperator: boolean;
  aiAutopilot: boolean;
};

export const WORKSPACE_TIER_LIMITS: Record<WorkspaceSubscriptionTier, WorkspaceTierLimits> = {
  builder: {
    maxWorkspaces: 1,
    maxDatabaseGb: 1,
    customDomains: false,
    teamAccess: false,
    whiteLabel: false,
    aiOperator: false,
    aiAutopilot: false,
  },
  pro: {
    maxWorkspaces: 10,
    maxDatabaseGb: 10,
    customDomains: true,
    teamAccess: true,
    whiteLabel: false,
    aiOperator: true,
    aiAutopilot: false,
  },
  agency: {
    maxWorkspaces: Number.POSITIVE_INFINITY,
    maxDatabaseGb: 50,
    customDomains: true,
    teamAccess: true,
    whiteLabel: true,
    aiOperator: true,
    aiAutopilot: true,
  },
};

export const WORKSPACE_TIER_PRICING_USD_MONTHLY: Record<WorkspaceSubscriptionTier, number> = {
  builder: 49,
  pro: 149,
  agency: 499,
};

export function getWorkspaceTierLimits(tier: WorkspaceSubscriptionTier): WorkspaceTierLimits {
  return WORKSPACE_TIER_LIMITS[tier];
}
