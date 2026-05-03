import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import AiConsoleClient from './AiConsoleClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Console | Elevate For Humanity',
};

export default async function AiConsolePage() {
  await requireAdmin();
  return <AiConsoleClient />;
}
