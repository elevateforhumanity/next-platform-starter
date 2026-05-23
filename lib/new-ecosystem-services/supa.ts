import { createClient } from '@supabase/supabase-js';

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supaUrl || !supaAnon) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
}

export const supa = createClient(supaUrl, supaAnon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Helper for typed errors
export function must<T>(value: T | null, msg = 'Not found') {
  if (value === null) throw new Error(msg);
  return value;
}
