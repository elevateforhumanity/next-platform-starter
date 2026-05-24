# Audit System

Four audit utilities exist. Use the right one for the context.

| File | Use for | DB table |
|------|---------|----------|
| `withApiAudit.ts` | Wrap any API route handler — zero-change audit | `admin_audit_events` |
| `../admin/audit-log.ts` | Admin mutations (role changes, approvals, bulk ops) | `admin_audit_events` |
| `../logging/auditLog.ts` | General app events (documents, payments, enrollments) | `audit_logs` |
| `logAction.ts` | Lightweight inline audit for safeguard actions | `audit_logs` |
| `transactional.ts` | Audit events that must commit with a DB transaction | `audit_logs` |
| `ferpa.ts` | FERPA-specific PII access logging | `audit_logs` |
| `api-audit.ts` | Low-level writer used by `withApiAudit` — do not call directly | `admin_audit_events` |

## Canonical patterns

**API route (new routes):**
```ts
import { withApiAudit } from '@/lib/audit/withApiAudit';
async function _POST(req: Request) { ... }
export const POST = withApiAudit('/api/my-route', _POST);
```

**Admin server action:**
```ts
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
await logAdminAudit({ action: AdminAction.ROLE_CHANGED, actorId, entityType: 'profiles', entityId, req });
```

**General app event:**
```ts
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
await auditLog({ actorId: userId, action: AuditAction.DOCUMENT_UPLOADED, entity: AuditEntity.DOCUMENT, entityId: docId });
```

## Deleted (do not re-create)

- `lib/audit-logger.ts` — zero importers, superseded by `withApiAudit`
- `lib/audit/audit-logger.ts` — duplicate of above
- `lib/audit/auditLogger.ts` — duplicate of above
- `lib/audit/logger.ts` — duplicate of above
