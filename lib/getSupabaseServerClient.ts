/** @deprecated Use '@/lib/supabase/admin' instead. */
// lib/getSupabaseServerClient.ts
import { requireAdminClient } from '@/lib/supabase/admin';

export async function getSupabaseServerClient() {
  return requireAdminClient();
}
