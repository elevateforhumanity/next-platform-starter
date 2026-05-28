'use client';

/**
 * SpeechCanceller
 *
 * Cancels any active Web Speech API utterance whenever the route changes.
 * Mounted once in RootWidgets so it covers all page navigations globally.
 * Renders nothing — side-effect only.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SpeechCanceller() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [pathname]);

  return null;
}
