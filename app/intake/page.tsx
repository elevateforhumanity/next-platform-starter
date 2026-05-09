import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * ARCHIVED: /app/intake → /apply
 * The old login-required intake form has been consolidated into the main apply flow.
 * All intake traffic now routes through /apply for unified user experience.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function IntakePage() {
  redirect('/apply');
}
        </div>
      </section>
    </div>
  );
}
