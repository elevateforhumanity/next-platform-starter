/** @deprecated Use '@/lib/supabase/server' instead. */
import { requireAdminClient } from '@/lib/supabase/admin';

/** @deprecated Use await requireAdminClient() from '@/lib/supabase/admin' instead. */
export function supabaseServer() {
  return requireAdminClient();
}
