/** @deprecated Use '@/lib/supabase/server' instead. */
import { requireAdminClient } from '@/lib/supabase/admin';

/** @deprecated Use await requireAdminClient() from '@/lib/supabase/admin' instead. */
export async function supabaseServer() {
  return requireAdminClient();
}

/** @deprecated Use await requireAdminClient() from '@/lib/supabase/admin' instead. */
export async function getSupabaseServerClient() {
  return requireAdminClient();
}
