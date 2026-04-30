/**
 * auditLogger — lightweight PII audit logging
 *
 * Thin wrapper over the audit_logs table. Designed for inline use inside
 * route handlers. Never throws — a logging failure must not break the request.
 *
 * Usage:
 *
 *   await auditLog({ user, action: 'VIEW_LEARNER', resource: 'learner', resourceId: id, req });
 *   await auditLog({ user, action: 'UPDATE_WIOA_CASE', resource: 'wioa_case', resourceId: caseId,
 *                    metadata: { fieldsChanged: ['status', 'funding'] }, req });
 *   await auditLog({ user, action: 'INITIATE_PAYMENT', resource: 'checkout',
 *                    metadata: { programId }, req });
 *
 * High-risk actions to always log:
 *   - Any read of PII (learner profile, SSN, DOB, address)
 *   - Any write to WIOA / IEP / support-services records
 *   - Any payment initiation or refund
 *   - Any role change or admin action
 *   - Any data export
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface AuditUser {
  id: string;
  role?: string;
  tenant_id?: string | null;
}

export interface AuditLogOptions {
  /** Authenticated user performing the action. */
  user: AuditUser | null | undefined;
  /** Action identifier — use SCREAMING_SNAKE_CASE. e.g. VIEW_LEARNER, UPDATE_WIOA_CASE */
  action: string;
  /** Resource type being acted on. e.g. 'learner', 'wioa_case', 'checkout' */
  resource: string;
  /** Primary key of the resource, if applicable. */
  resourceId?: string;
  /** Additional structured context. Keep PII out of metadata — use resourceId instead. */
  metadata?: Record<string, unknown>;
  /** Incoming request — used to extract IP and user-agent. */
  req?: Request | { headers: { get(name: string): string | null } };
}

export async function auditLog({
  user,
  action,
  resource,
  resourceId,
  metadata = {},
  req,
}: AuditLogOptions): Promise<void> {
  try {
    const supabase = await createClient();

    const ip =
      req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req?.headers.get('x-real-ip') ||
      null;

    const userAgent = req?.headers.get('user-agent') || null;

    await supabase.from('audit_logs').insert({
      user_id: user?.id ?? null,
      tenant_id: user?.tenant_id ?? null,
      role: user?.role ?? null,
      action,
      resource_type: resource,
      resource_id: resourceId ?? null,
      details: metadata,
      ip_address: ip,
      user_agent: userAgent,
      success: true,
    });
  } catch (err) {
    // Never let audit failure break the request
    logger.error('[auditLog] Failed to write audit log', { action, resource, err });
  }
}
