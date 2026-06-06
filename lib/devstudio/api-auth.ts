/**
 * DevStudio API authentication — platform operator only.
 * Customer tenant admins must never reach these routes.
 *
 * @see docs/platform-owner-tenant-model.md
 */

export {
  apiRequirePlatformOperator as apiRequireDevStudio,
  type GuardedUser,
} from '@/lib/admin/guards';
