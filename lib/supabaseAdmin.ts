/** @deprecated Use '@/lib/supabase/admin' instead. */
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/** @deprecated Use await requireAdminClient() from '@/lib/supabase/admin' instead. */
export async function getDeprecatedSupabaseAdminClient(): Promise<SupabaseClient<any>> {
  return requireAdminClient();
}

/** @deprecated Use await requireAdminClient() from '@/lib/supabase/admin' instead. */
export const supabaseAdmin: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop) {
    if (!_client) _client = createAdminClient();
    return (_client as any)[prop];
  },
});
