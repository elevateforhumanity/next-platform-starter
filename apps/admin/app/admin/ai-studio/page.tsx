import Link from 'next/link';
import { Metadata } from 'next';
import { Bot, Wrench, Box, KeyRound, Upload, Download, Printer } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'AI Studio | Admin | Elevate For Humanity',
};

const LINKS = [
  { title: 'AI Builder', href: '/admin/course-builder', description: 'Blueprint/program course generation workspace.', icon: Bot },
  { title: 'Dev Studio — Command', href: '/admin/dev-studio?tab=command', description: 'Operator command center and automation tools.', icon: Wrench },
  { title: 'Dev Studio — Container', href: '/admin/dev-studio?tab=container', description: 'Container runtime and environment control panel.', icon: Box },
  { title: 'Dev Studio — Secrets', href: '/admin/dev-studio?tab=secrets', description: 'AI/provider runtime key management.', icon: KeyRound },
  { title: 'Documents Upload', href: '/admin/documents/upload', description: 'Upload files for OCR, extraction, and review queues.', icon: Upload },
  { title: 'Documents Download', href: '/admin/document-center', description: 'Browse and download documents from the document center.', icon: Download },
  { title: 'Documents Print', href: '/admin/documents/print', description: 'Print-center page for documents and print workflow.', icon: Printer },
];

export default async function AiStudioHubPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">AI Studio</h1>
        <p className="mt-2 text-slate-600">Unified entry point for AI Builder + Dev Studio so mobile and desktop navigation stay consistent.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-brand-blue-50 p-2 text-brand-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
