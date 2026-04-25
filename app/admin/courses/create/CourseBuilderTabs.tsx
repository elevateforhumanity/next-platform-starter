'use client';

import { useState } from 'react';
import { Sparkles, Layers, PenLine } from 'lucide-react';
import CourseIngestionWizard from './CourseIngestionWizard';
import { CourseBuilderPageClient } from '@/app/admin/course-builder/CourseBuilderPageClient';

interface Props {
  programs: { id: string; title: string }[];
  complianceProfiles: { key: string; label: string }[];
}

type Tab = 'ai' | 'blueprint' | 'manual';

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id: 'ai',
    label: 'AI Generate',
    icon: Sparkles,
    desc: 'Paste a prompt, syllabus, script, or document — AI builds the full course draft',
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    icon: Layers,
    desc: 'Select a registered blueprint + program — GPT-4o writes all content, assessments, and queues video',
  },
  {
    id: 'manual',
    label: 'Manual Build',
    icon: PenLine,
    desc: 'Build module-by-module with full regulatory and compliance controls',
  },
];

export default function CourseBuilderTabs({ programs, complianceProfiles }: Props) {
  const [tab, setTab] = useState<Tab>('ai');

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="grid grid-cols-3 gap-3">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${
                active
                  ? 'border-brand-blue-600 bg-brand-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`flex items-center gap-2 font-semibold text-sm ${active ? 'text-brand-blue-700' : 'text-slate-800'}`}>
                <Icon className="w-4 h-4" />
                {t.label}
              </div>
              <p className={`text-xs leading-snug ${active ? 'text-brand-blue-600' : 'text-slate-500'}`}>
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'ai' && (
        <CourseIngestionWizard programs={programs} />
      )}

      {tab === 'blueprint' && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <CourseBuilderPageClient />
        </div>
      )}

      {tab === 'manual' && (
        <div className="bg-white rounded-xl border shadow-sm">
          {/* PageClient is the manual form builder from admin/course-builder */}
          <ManualBuilderWrapper complianceProfiles={complianceProfiles} />
        </div>
      )}
    </div>
  );
}

// ── Manual builder wrapper ────────────────────────────────────────────────────
// Inlines the PageClient form so it lives inside the consolidated page.

import { useEffect, useMemo, useState as useStateAlias } from 'react';
import type {
  ProgramBuilderTemplate,
  BuilderModule,
  BuilderLesson,
} from '@/lib/course-builder/schema';

const emptyLesson = (): BuilderLesson => ({
  slug: '', title: '', orderIndex: 0, lessonType: 'lesson', durationMinutes: 30,
  learningObjectives: [''], content: {}, quizQuestions: [], competencyChecks: [],
  practicalRequired: false, requiredArtifacts: [], activities: [], isRequired: true,
  generationStatus: 'draft', domainKey: null, hourCategory: null, evidenceType: null,
  deliveryMethod: null, requiresInstructorSignoff: false, instructorRequirement: null,
  minimumSeatTimeMinutes: null, fieldworkEligible: false,
});

const emptyModule = (): BuilderModule => ({
  slug: '', title: '', orderIndex: 0, domainKey: '', targetHours: 1,
  quizRequired: false, practicalRequired: false, lessons: [],
});

const initialProgram: ProgramBuilderTemplate = {
  title: '', slug: '', credentialTarget: 'INTERNAL', minimumHours: 1,
  requiresFinalExam: false, finalExam: { required: false },
  certificateRequirements: {
    includeHours: true, includeCompetencies: true, includeInstructorVerification: true,
    includeCompletionDate: true, includeVerificationUrl: true, requireAllCriticalCompetencies: false,
  },
  modules: [], status: 'draft',
  regulatory: {
    complianceProfileKey: 'internal_basic', credentialTarget: 'INTERNAL',
    governingBody: null, governingRegion: null, governingStandardVersion: null,
    retentionPolicyDays: null, auditNotes: null,
  },
};

function ManualBuilderWrapper({ complianceProfiles }: { complianceProfiles: { key: string; label: string }[] }) {
  const [program, setProgram] = useStateAlias<ProgramBuilderTemplate>(initialProgram);
  const [selMod, setSelMod] = useStateAlias(0);
  const [selLes, setSelLes] = useStateAlias(0);
  const [auditResult, setAuditResult] = useStateAlias<any>(null);
  const [busy, setBusy] = useStateAlias(false);
  const [saveResult, setSaveResult] = useStateAlias<{ ok: boolean; courseId?: string; error?: string } | null>(null);

  const mod = program.modules[selMod];
  const les = mod?.lessons?.[selLes];
  const totalMinutes = useMemo(
    () => program.modules.reduce((s, m) => s + m.lessons.reduce((ls, l) => ls + (l.durationMinutes || 0), 0), 0),
    [program],
  );

  const upProg = (p: Partial<ProgramBuilderTemplate>) => setProgram(prev => ({ ...prev, ...p }));
  const upReg  = (p: Partial<ProgramBuilderTemplate['regulatory']>) =>
    setProgram(prev => ({ ...prev, regulatory: { ...prev.regulatory, ...p } }));
  const upMod  = (i: number, p: Partial<BuilderModule>) =>
    setProgram(prev => ({ ...prev, modules: prev.modules.map((m, mi) => mi === i ? { ...m, ...p } : m) }));
  const upLes  = (mi: number, li: number, p: Partial<BuilderLesson>) =>
    setProgram(prev => ({
      ...prev,
      modules: prev.modules.map((m, mIdx) =>
        mIdx !== mi ? m : { ...m, lessons: m.lessons.map((l, lIdx) => lIdx !== li ? l : { ...l, ...p }) },
      ),
    }));

  const addModule = () => {
    const idx = program.modules.length;
    setProgram(prev => ({
      ...prev,
      modules: [...prev.modules, { ...emptyModule(), orderIndex: idx, slug: `module-${idx + 1}`, title: `Module ${idx + 1}` }],
    }));
    setSelMod(idx); setSelLes(0);
  };

  const addLesson = () => {
    if (!mod) return;
    const idx = mod.lessons.length;
    upMod(selMod, {
      lessons: [...mod.lessons, { ...emptyLesson(), orderIndex: idx, slug: `lesson-${idx + 1}`, title: `Lesson ${idx + 1}` }],
    });
    setSelLes(idx);
  };

  const deleteModule = (i: number) => {
    setProgram(prev => ({ ...prev, modules: prev.modules.filter((_, mi) => mi !== i) }));
    setSelMod(Math.max(0, i - 1));
    setSelLes(0);
  };

  const deleteLesson = (mi: number, li: number) => {
    upMod(mi, { lessons: mod.lessons.filter((_, idx) => idx !== li) });
    setSelLes(Math.max(0, li - 1));
  };

  const runAudit = async () => {
    setBusy(true); setAuditResult(null);
    const res = await fetch('/api/admin/course-builder/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(program),
    });
    const j = await res.json();
    setAuditResult(j.audit ?? j);
    setBusy(false);
  };

  const saveDraft = async () => {
    setBusy(true); setSaveResult(null); setAuditResult(null);
    const res = await fetch('/api/admin/course-builder/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(program),
    });
    const j = await res.json();
    setSaveResult(j);
    setAuditResult(j.audit ?? null);
    setBusy(false);
  };

  const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent';
  const sel = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500';
  const profiles = complianceProfiles.length > 0 ? complianceProfiles : [
    { key: 'internal_basic', label: 'Internal Basic' },
    { key: 'state_board_strict', label: 'State Board Strict' },
    { key: 'dol_apprenticeship', label: 'DOL Apprenticeship' },
    { key: 'icrc_peer_recovery', label: 'IC&RC Peer Recovery' },
    { key: 'naadac_peer_support', label: 'NAADAC Peer Support' },
    { key: 'custom_regulated', label: 'Custom Regulated' },
  ];

  return (
    <div className="grid grid-cols-12 gap-0 min-h-[700px] text-sm divide-x divide-slate-200">

      {/* Col 1 — Module list */}
      <div className="col-span-3 p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Modules</h3>
          <button
            onClick={addModule}
            className="text-xs bg-brand-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            + Add
          </button>
        </div>
        {program.modules.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">No modules yet. Add one to start.</p>
        )}
        {program.modules.map((m, i) => (
          <div key={i} className="group relative">
            <button
              onClick={() => { setSelMod(i); setSelLes(0); }}
              className={`w-full text-left border rounded-lg p-2.5 text-xs transition-colors ${
                i === selMod ? 'border-brand-blue-400 bg-brand-blue-50 font-medium' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900 truncate">{m.title || '(untitled)'}</div>
              <div className="text-slate-500 mt-0.5">{m.lessons.length} lesson{m.lessons.length !== 1 ? 's' : ''}</div>
            </button>
            <button
              onClick={() => deleteModule(i)}
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs px-1 transition-opacity"
              title="Delete module"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Col 2 — Program + Module fields */}
      <div className="col-span-4 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        <h3 className="font-semibold text-slate-900 mb-1">Program</h3>
        <input className={inp} placeholder="Course title *" value={program.title} onChange={e => upProg({ title: e.target.value })} />
        <input className={inp} placeholder="Slug (e.g. hvac-technician-v2)" value={program.slug} onChange={e => upProg({ slug: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inp} type="number" placeholder="Min hours" value={program.minimumHours} onChange={e => upProg({ minimumHours: Number(e.target.value) })} />
          <select className={sel} value={program.credentialTarget} onChange={e => upProg({ credentialTarget: e.target.value as any })}>
            {['INTERNAL','STATE_BOARD','IC&RC','NAADAC','DOL_APPRENTICESHIP','CUSTOM'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <select className={sel} value={program.regulatory.complianceProfileKey} onChange={e => upReg({ complianceProfileKey: e.target.value })}>
          {profiles.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <input className={inp} placeholder="Governing body (e.g. Indiana PLA)" value={program.regulatory.governingBody ?? ''} onChange={e => upReg({ governingBody: e.target.value || null })} />
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={program.requiresFinalExam}
            onChange={e => upProg({ requiresFinalExam: e.target.checked, finalExam: { ...program.finalExam, required: e.target.checked } })} />
          Requires final exam
        </label>
        {program.requiresFinalExam && (
          <input className={inp} type="number" placeholder="Passing score (%)" value={program.finalExam.passingScore ?? ''}
            onChange={e => upProg({ finalExam: { ...program.finalExam, passingScore: Number(e.target.value) } })} />
        )}

        {/* Module fields */}
        {mod && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <h3 className="font-semibold text-slate-900">Module {selMod + 1}</h3>
            <input className={inp} placeholder="Module title *" value={mod.title} onChange={e => upMod(selMod, { title: e.target.value })} />
            <input className={inp} placeholder="Slug" value={mod.slug} onChange={e => upMod(selMod, { slug: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="Domain key" value={mod.domainKey} onChange={e => upMod(selMod, { domainKey: e.target.value })} />
              <input className={inp} type="number" placeholder="Target hours" value={mod.targetHours} onChange={e => upMod(selMod, { targetHours: Number(e.target.value) })} />
            </div>
            <div className="flex gap-4 text-xs text-slate-700">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={mod.quizRequired} onChange={e => upMod(selMod, { quizRequired: e.target.checked })} /> Quiz required</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={mod.practicalRequired} onChange={e => upMod(selMod, { practicalRequired: e.target.checked })} /> Practical required</label>
            </div>

            {/* Lesson list within module */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Lessons</span>
                <button onClick={addLesson} className="text-xs text-brand-blue-600 hover:text-brand-blue-700 font-medium">+ Add lesson</button>
              </div>
              {mod.lessons.map((l, i) => (
                <div key={i} className="group relative">
                  <button onClick={() => setSelLes(i)}
                    className={`w-full text-left border rounded-lg p-2 text-xs transition-colors ${
                      i === selLes ? 'border-brand-blue-400 bg-brand-blue-50 font-medium' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="truncate text-slate-900">{l.title || '(untitled)'}</div>
                    <div className="text-slate-500">{l.lessonType} · {l.durationMinutes}min</div>
                  </button>
                  <button onClick={() => deleteLesson(selMod, i)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs px-1 transition-opacity"
                    title="Delete lesson">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Col 3 — Lesson editor + actions */}
      <div className="col-span-5 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        {les ? (
          <>
            <h3 className="font-semibold text-slate-900">Lesson {selLes + 1}</h3>
            <input className={inp} placeholder="Lesson title *" value={les.title} onChange={e => upLes(selMod, selLes, { title: e.target.value })} />
            <input className={inp} placeholder="Slug" value={les.slug} onChange={e => upLes(selMod, selLes, { slug: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={sel} value={les.lessonType} onChange={e => upLes(selMod, selLes, { lessonType: e.target.value as any })}>
                {['lesson','video','reading','quiz','checkpoint','exam','lab','assignment','practical','live_session','fieldwork','observation'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input className={inp} type="number" placeholder="Duration (min)" value={les.durationMinutes}
                onChange={e => upLes(selMod, selLes, { durationMinutes: Number(e.target.value) })} />
            </div>
            <textarea className={`${inp} min-h-[70px] resize-y`} placeholder="Learning objectives (one per line)"
              value={les.learningObjectives.join('\n')}
              onChange={e => upLes(selMod, selLes, { learningObjectives: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={sel} value={les.hourCategory ?? ''} onChange={e => upLes(selMod, selLes, { hourCategory: (e.target.value || null) as any })}>
                <option value="">Hour category</option>
                {['didactic','practical','clinical','fieldwork','observation','supervision','self_study','exam'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select className={sel} value={les.deliveryMethod ?? ''} onChange={e => upLes(selMod, selLes, { deliveryMethod: (e.target.value || null) as any })}>
                <option value="">Delivery method</option>
                {['online_async','online_live','in_person','hybrid','field_based'].map(dm => <option key={dm} value={dm}>{dm}</option>)}
              </select>
            </div>
            <div className="flex gap-4 text-xs text-slate-700">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={!!les.practicalRequired} onChange={e => upLes(selMod, selLes, { practicalRequired: e.target.checked })} />
                Practical required
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={!!les.requiresInstructorSignoff}
                  onChange={e => upLes(selMod, selLes, {
                    requiresInstructorSignoff: e.target.checked,
                    instructorRequirement: e.target.checked
                      ? { required: true, approvalAuthority: 'lesson', supervisionMethod: 'observation', roleTypes: ['instructor'] }
                      : null,
                  })} />
                Instructor signoff
              </label>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
            <PenLine className="w-8 h-8 mb-2 opacity-30" />
            <p>Select or add a lesson to edit it</p>
          </div>
        )}

        {/* Stats + Actions */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{program.modules.length} modules · {program.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons</span>
            <span>{(totalMinutes / 60).toFixed(1)}h total</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runAudit}
              disabled={busy || program.modules.length === 0}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              {busy ? 'Running…' : 'Audit'}
            </button>
            <button
              onClick={saveDraft}
              disabled={busy || !program.title || program.modules.length === 0}
              className="flex-1 bg-brand-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
            >
              {busy ? 'Saving…' : 'Save to DB'}
            </button>
          </div>

          {saveResult && (
            <div className={`rounded-lg p-3 text-xs ${saveResult.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {saveResult.ok ? (
                <span>
                  ✅ Course saved.{' '}
                  {saveResult.courseId && (
                    <a href={`/admin/courses/${saveResult.courseId}`} className="underline font-semibold">
                      Open in editor →
                    </a>
                  )}
                </span>
              ) : (
                <span>❌ {saveResult.error ?? 'Save failed'}</span>
              )}
            </div>
          )}

          {auditResult && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                Audit result {auditResult.ok ? '✅' : '⚠️'}
              </summary>
              <pre className="mt-2 border rounded-lg p-3 overflow-auto bg-slate-50 text-slate-700" style={{ maxHeight: '300px' }}>
                {JSON.stringify(auditResult, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
