import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Points to the LMS barber course, not orientation
export default function BarberPwaTrainingRedirectPage() {
  permanentRedirect('/lms/courses/3fb5ce19-1cde-434c-a8c6-f138d7d7aa17');
}
