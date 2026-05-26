import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TemplateGallery from '@/components/admin/course-builder/TemplateGallery';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Templates | Admin | Elevate For Humanity',
  description: 'Pre-built course templates and blueprints to get started quickly.',
};

export default async function CourseTemplatesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <Link
          href="/admin/studio"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course Builder
        </Link>
      </div>
      <TemplateGallery />
    </div>
  );
}
