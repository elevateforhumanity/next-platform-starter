'use client';

/**
 * Catches Supabase magic-link / OAuth hash-fragment sessions.
 *
 * When Supabase redirects back to the site it appends the session as a URL
 * hash fragment (#access_token=...&type=magiclink). Because hash fragments
 * are never sent to the server, the auth callback route never fires — the
 * browser just renders whatever page the hash landed on.
 *
 * This component:
 *   1. Detects the hash fragment on mount
 *   2. Waits for the Supabase client to exchange it for a session (SIGNED_IN)
 *   3. Reads the user's role from their profile
 *   4. Redirects to the canonical role destination via getRoleDestination()
 *
 * It is mounted in the root layout so it fires on every page, not just the
 * homepage — Supabase can redirect to any allowed URL.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { getRoleDestination } from '@/lib/auth/role-destinations';

export default function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only act when the URL contains a Supabase auth hash fragment
    const hash = window.location.hash;
    if (!hash.includes('access_token') && !hash.includes('error_code')) return;

    // Surface auth errors from the hash (e.g. expired OTP)
    if (hash.includes('error_code')) {
      const params = new URLSearchParams(hash.slice(1));
      const desc = params.get('error_description') ?? 'Link expired or invalid';
      router.replace(`/login?error=${encodeURIComponent(desc)}`);
      return;
    }

    // Check for an explicit ?next= param encoded in the landing URL.
    // Magic links are generated with redirect_to=https://www.elevateforhumanity.org?next=/apprentice
    // Supabase preserves query params on the base URL even when it strips the path.
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get('next');

    const supabase = createBrowserClient();

    // The Supabase client automatically exchanges the hash fragment for a
    // session on init. Listen for the resulting SIGNED_IN event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return;

      subscription.unsubscribe();

      // Clear the hash and next param from the URL immediately so tokens aren't visible
      window.history.replaceState(null, '', window.location.pathname);

      const user = session.user;

      // If an explicit destination was encoded in the link, use it directly.
      // Otherwise fall back to role-based routing.
      let destination: string;
      if (next && next.startsWith('/')) {
        destination = next;
      } else {
        let role = user.user_metadata?.role as string | undefined;
        if (!role) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          role = profile?.role ?? 'student';
        }
        destination = getRoleDestination(role);
      }

      // Cross-origin destinations (e.g. admin subdomain) need a full navigation
      if (destination.startsWith('http')) {
        window.location.href = destination;
      } else {
        router.replace(destination);
      }
    });

    // Cleanup if component unmounts before the event fires
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
