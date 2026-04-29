/** @deprecated Import from '@/lib/supabase/server' instead. */
import { requireAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/** @deprecated Use await requireAdminClient() from '@/lib/supabase/admin' instead. */
export function createSupabaseClient(): SupabaseClient<any> {
  return requireAdminClient();
}
