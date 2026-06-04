# Platform SaaS Blueprint (Elevate)

Elevate already implements most of the “full code” scope as a production LMS + workforce platform (~516 Supabase tables, multi-tenant `tenants`, `licenses.features`, provisioning, Stripe). This document maps the **simplified go-to-market pricing** onto that architecture.

## Pricing (canonical)

Source: `lib/store/platform-pricing.ts`

| Plan | Monthly | Annual |
|------|--------:|-------:|
| Solo | $29 | $290 |
| Business | $59 | $590 |
| Professional | $99 | $990 |

Add-ons are sold separately via the marketplace on `/store/plans#addons`.

## Feature flags

Canonical keys: `lib/platform/features.ts` (`PlatformFeature`).

Runtime check (tenant license):

```typescript
import { hasFeature } from '@/lib/middleware/withLicense';
const allowed = await hasFeature(tenantId, 'lms');
```

Resolve entitlements from plan + add-ons:

```typescript
import { resolveEntitlements } from '@/lib/platform/entitlements';
const { features, maxUsers } = resolveEntitlements('business', ['workforce-development']);
```

After Stripe checkout, fulfillment writes `licenses.features` and `organization_addons` rows: `lib/platform/fulfillment.ts`.

## Database mapping (existing + new)

| Concept | Elevate table / mechanism |
|---------|---------------------------|
| Organizations | `tenants` |
| Users | `auth.users` + `profiles` (`tenant_id`) |
| Plans / subscriptions | `licenses` (`tier`, `stripe_subscription_id`, `features[]`) |
| Add-ons | `organization_addons` (migration `20260702000016`) |
| CRM, courses, WIOA, apprenticeship | Existing domain tables (contacts, `courses`, `program_enrollments`, `progress_entries`, etc.) |

Recommended future tables (optional, not required for v1 pricing UI):

- `saas_plans` — mirror catalog in DB for admin editing
- `usage_meters` — SMS/storage overage

## Checkout flow

1. Customer selects plan + add-ons on `/store/plans`
2. `POST /api/store/platform-checkout` → Stripe Checkout (subscription)
3. `checkout.session.completed` → `app/api/webhooks/store` → `fulfillPlatformSaasSubscription`

**Requirement:** User’s `profiles.tenant_id` must be set (create org via `/store/trial` first if needed).

## Comparison to Marblism

| Marblism | Elevate |
|----------|---------|
| Prompt-to-app SaaS builder | Operational workforce + beauty/trades LMS |
| Next.js + Supabase + Stripe greenfield | Same stack, domain-specific modules already built |
| AI employees / app generation | AI tutor, Dev Studio, content tools (different product lane) |

Elevate is closer to **GoHighLevel + TalentLMS + apprenticeship compliance** than a generic app generator.

## Module delivery order (recommended)

1. ✅ Pricing catalog + store UI + checkout API  
2. Apply migrations `20260702000015`, `20260702000016` in Supabase SQL Editor  
3. Gate routes with `hasFeature` / `withLicense` per module  
4. Metered SMS/storage (Stripe usage records)  
5. Admin UI to view/edit `organization_addons` per tenant  

## Migrations (manual)

- `supabase/migrations/20260702000016_organization_addons.sql`
