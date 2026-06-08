import { Metadata } from 'next';
import LogsClient from './LogsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Audit Logs | Dev Studio' };

export default function LogsPage() {
  return <LogsClient />;
}
