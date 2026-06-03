'use client';

import { useEffect } from 'react';
import { hydrateBrowserSupabaseConfig } from '@/lib/supabase/public-config';

/**
 * Ensures browser Supabase config is loaded when build-time NEXT_PUBLIC_* was placeholder.
 * Runs once on mount on every public page (including /login).
 */
export default function SupabaseConfigBootstrap() {
  useEffect(() => {
    void hydrateBrowserSupabaseConfig();
  }, []);

  return null;
}
