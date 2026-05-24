/**
 * lib/course-builder/db.ts
 * Service-role Supabase client for the course builder pipeline.
 */

import { requireAdminClient } from '@/lib/supabase/admin';

export function getServiceDb() {
  return await requireAdminClient();
}
