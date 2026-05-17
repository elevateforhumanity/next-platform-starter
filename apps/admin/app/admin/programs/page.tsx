import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ProgramsTable } from './programs-table';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/programs',
  },
  title: 'Programs Management | Admin',
  description: 'Manage training programs, courses, and curriculum',
};

export default async function ProgramsPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const [
    { data: programs },
    { count: totalPrograms },
    { count: activePrograms },
    { count: featuredPrograms },
  ] = await Promise.all([
    supabase.from('programs').select('*').order('created_at', { ascending: false }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('featured', true),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Programs' }]} />
        </div>
      </div>

      {/* Hero Image */}

      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Programs Management</h1>
              <p className="text-black mt-1">Manage training programs and curriculum</p>
            </div>
            <Link
              href="/admin/programs/new"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + Create Program
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Programs</h3>
              <p className="text-base md:text-lg font-bold text-black">{totalPrograms || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Active</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">
                {activePrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Featured</h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {featuredPrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Inactive</h3>
              <p className="text-base md:text-lg font-bold text-black">
                {(totalPrograms || 0) - (activePrograms || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Programs Table */}
        <ProgramsTable programs={programs || []} />

        {/* Related sections */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Related</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/program-holders" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Program Holders</p>
                <p className="text-xs text-slate-500 mt-0.5">Partner organizations delivering programs</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/program-holder-documents" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Program Holder Documents</p>
                <p className="text-xs text-slate-500 mt-0.5">MOU, compliance, and onboarding docs</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/programs/builder" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Program Builder</p>
                <p className="text-xs text-slate-500 mt-0.5">Blueprint-driven course scaffolding</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/programs/catalog" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Programs Catalog</p>
                <p className="text-xs text-slate-500 mt-0.5">Public-facing program catalog</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/curriculum" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Curriculum</p>
                <p className="text-xs text-slate-500 mt-0.5">Lessons, modules, and content</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/enrollments" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Enrollments</p>
                <p className="text-xs text-slate-500 mt-0.5">Student program enrollments</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
