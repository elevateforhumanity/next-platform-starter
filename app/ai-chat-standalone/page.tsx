import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  MessageSquare,
  Bot,
  Sparkles,
  Clock,
  BookOpen,
  HelpCircle,
  ArrowRight,
  Zap,
  Phone,
} from 'lucide-react';
import ChatAssistantWrapper from './ChatAssistantWrapper';

export const metadata: Metadata = {
  title: 'AI Learning Assistant | Elevate For Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ai-chat',
  },
  description:
    'Get instant help with your courses, career questions, and learning journey from our AI-powered assistant.',
  robots: {
    index: false,
    import { permanentRedirect } from 'next/navigation';

    export default function AIChatStandalonePage() {
      permanentRedirect('/ai-chat');
    }
    </div>
  );
}
