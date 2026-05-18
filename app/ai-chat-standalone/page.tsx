import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'AI Chat Redirect',
  description:
    'Get instant help with your courses, career questions, and learning journey from our AI-powered assistant.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AIChatStandalonePage() {
  permanentRedirect('/ai-chat');
}
