'use client';

/**
 * AutomationPanel — wraps existing automation/workflow pages as a panel.
 * Reads automationRules + workflows from CourseProvider.
 */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import { Zap } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const AutomationClient = dynamic(
  () => import('@/apps/admin/app/admin/automation/AutomationClient').then(m => ({ default: m.default ?? m })).catch(() => ({ default: AutomationFallback })),
  { ssr: false, loading: () => <PanelSkeleton label="Automation" /> }
);

function AutomationFallback() {
  const { state } = useCourse();
  const { automationRules, workflows } = state;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{automationRules.length}</p>
          <p className="text-sm text-slate-500 mt-1">Automation Rules</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{workflows.length}</p>
          <p className="text-sm text-slate-500 mt-1">Workflows</p>
        </div>
      </div>
      {automationRules.length > 0 && (
        <div className="space-y-2">
          {automationRules.slice(0, 5).map(rule => (
            <div key={rule.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 bg-white">
              <div>
                <p className="text-sm font-medium text-slate-800">{rule.name}</p>
                <p className="text-xs text-slate-500">{rule.trigger_type} → {rule.action_type}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {rule.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      )}
      <a
        href="/admin/automation"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:underline"
      >
        Manage all automation rules →
      </a>
    </div>
  );
}

export function AutomationPanel() {
  const { state } = useCourse();
  const { automationRules, workflows } = state;

  return (
    <div className="p-6">
      <PanelHeader
        icon={<Zap className="w-5 h-5" />}
        title="Automation"
        subtitle={`${automationRules.length} rule${automationRules.length !== 1 ? 's' : ''} · ${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}`}
      />
      <AutomationClient courseId={state.course.id} />
    </div>
  );
}
