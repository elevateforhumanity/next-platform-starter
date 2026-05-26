'use client';

/**
 * BlueprintPanel — wraps CourseBuilderClient + CourseBuilderPageClient
 * Plugged into CourseProvider: reads course/modules, writes via upsertModule.
 */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import { Layers } from 'lucide-react';

const CourseBuilderClient = dynamic(
  () => import('@/apps/admin/app/admin/course-builder/CourseBuilderClient').then(m => ({ default: m.default ?? m })),
  { ssr: false, loading: () => <PanelSkeleton label="Blueprint" /> }
);

export function BlueprintPanel() {
  const { state, updateCourse, appendAIMemory } = useCourse();
  const { course, modules } = state;

  return (
    <div className="p-6">
      <PanelHeader
        icon={<Layers className="w-5 h-5" />}
        title="Blueprint"
        subtitle={`${modules.length} module${modules.length !== 1 ? 's' : ''} · ${state.lessons.length} lessons`}
      />
      <CourseBuilderClient
        courseId={course.id}
        onUpdate={(patch: Record<string, unknown>) => {
          updateCourse(patch as Parameters<typeof updateCourse>[0]);
          appendAIMemory({
            role: 'action',
            content: `Blueprint updated: ${Object.keys(patch).join(', ')}`,
            source: 'blueprint',
          });
        }}
      />
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function PanelHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-blue-50 rounded-lg text-brand-blue-600">{icon}</div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg" />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Loading {label}…</p>
    </div>
  );
}
