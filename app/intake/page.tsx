import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * ARCHIVED: /intake → /apply
 * The old login-required intake form has been consolidated into the main apply flow.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function IntakePage() {
  permanentRedirect('/apply');
}
