import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import ProgramHolderDocumentsClient from './ProgramHolderDocumentsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Program Holder Documents | Admin | Elevate For Humanity' };

export default async function ProgramHolderDocumentsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const [
    { count: pending },
    { count: approved },
    { count: rejected },
    { data: docs },
  ] = await Promise.all([
    db.from('program_holder_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('program_holder_documents').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('program_holder_documents').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    db.from('program_holder_documents')
      .select('id, user_id, document_type, file_name, file_path, file_size, mime_type, status, reviewed_at, created_at, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const stats = [
    { label: 'Pending Review', value: pending ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: approved ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: rejected ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/program-holders" className="hover:text-slate-700">Program Holders</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Documents</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Program Holder Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve documents submitted by program holders</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <ProgramHolderDocumentsClient initialDocs={docs ?? []} />
    </div>
  );
}
