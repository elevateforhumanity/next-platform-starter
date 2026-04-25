'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ProgramBuilderTemplate,
  BuilderModule,
  BuilderLesson,
} from '@/lib/course-builder/schema';

const emptyLesson = (): BuilderLesson => ({
  slug: '', title: '', orderIndex: 0, lessonType: 'reading', durationMinutes: 30,
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

const initialState: ProgramBuilderTemplate = {
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

interface BlueprintMeta { id: string; title: string; state: string; slug: string; modules: number; lessons: number; }
interface ProgramMeta   { id: string; title: string; slug: string; }
interface GenerateResult {
  ok: boolean; courseId?: string; title?: string; modules?: number;
  lessonsInserted?: number; contentFailures?: { slug: string }[];
  generationFailures?: { slug: string; error: string }[];
  assessmentsGenerated?: number; videosQueued?: number;
  videoStudioUrl?: string; courseUrl?: string; error?: string;
}

const STEPS = [
  'Loading blueprint…',
  'Generating lesson content with GPT-4o…',
  'Generating lesson content with GPT-4o…',
  'Building course structure in DB…',
  'Generating assessment banks…',
  'Queuing video generation…',
  'Finalizing…',
];

export function CourseBuilderPageClient() {
  const [program, setProgram]             = useState<ProgramBuilderTemplate>(initialState);
  const [selMod, setSelMod]               = useState(0);
  const [selLes, setSelLes]               = useState(0);
  const [auditResult, setAuditResult]     = useState<any>(null);
  const [busy, setBusy]                   = useState(false);
  const [complianceProfiles, setComplianceProfiles] = useState<{ key: string; label: string }[]>([]);
  const [blueprints, setBlueprints]       = useState<BlueprintMeta[]>([]);
  const [programs, setPrograms]           = useState<ProgramMeta[]>([]);
  const [selBlueprint, setSelBlueprint]   = useState('');
  const [selProgram, setSelProgram]       = useState('');
  const [generating, setGenerating]       = useState(false);
  const [genStep, setGenStep]             = useState('');
  const [genResult, setGenResult]         = useState<GenerateResult | null>(null);

  useEffect(() => {
    fetch('/api/admin/course-builder/profiles').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.profiles) setComplianceProfiles(d.profiles.map((p: any) => ({ key: p.key, label: p.label ?? p.key }))); }).catch(() => {});
    fetch('/api/admin/course-builder/load-blueprint').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.blueprints) setBlueprints(d.blueprints); }).catch(() => {});
    fetch('/api/admin/programs?limit=100').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.programs) setPrograms(d.programs); }).catch(() => {});
  }, []);

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
    setProgram(prev => ({ ...prev, modules: [...prev.modules, { ...emptyModule(), orderIndex: idx, slug: `module-${idx + 1}`, title: `Module ${idx + 1}` }] }));
    setSelMod(idx); setSelLes(0);
  };

  const addLesson = () => {
    if (!mod) return;
    const idx = mod.lessons.length;
    upMod(selMod, { lessons: [...mod.lessons, { ...emptyLesson(), orderIndex: idx, slug: `lesson-${idx + 1}`, title: `Lesson ${idx + 1}` }] });
    setSelLes(idx);
  };

  const generateFullCourse = async () => {
    if (!selBlueprint || !selProgram) return;
    setGenerating(true); setGenResult(null);
    let si = 0; setGenStep(STEPS[0]);
    const t = setInterval(() => { si = Math.min(si + 1, STEPS.length - 1); setGenStep(STEPS[si]); }, 20000);
    try {
      const res = await fetch('/api/admin/course-builder/generate-from-blueprint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId: selBlueprint, programId: selProgram, mode: 'replace' }),
      });
      setGenResult(await res.json());
    } catch (err) {
      setGenResult({ ok: false, error: err instanceof Error ? err.message : 'Generation failed' });
    } finally { clearInterval(t); setGenStep(''); setGenerating(false); }
  };

  const runAudit = async () => {
    setBusy(true); setAuditResult(null);
    const res = await fetch('/api/admin/course-builder/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(program) });
    const j = await res.json(); setAuditResult(j.audit ?? j); setBusy(false);
  };

  const publish = async () => {
    setBusy(true); setAuditResult(null);
    const res = await fetch('/api/admin/course-builder/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(program) });
    setAuditResult(await res.json()); setBusy(false);
  };

  const inp = 'w-full border rounded px-3 py-2 text-sm';
  const sel = 'w-full border rounded px-3 py-2 text-sm';
  const btn = 'border rounded px-3 py-1.5 text-xs font-medium';

  return (
    <div className="p-6 space-y-4 text-sm">

      {/* Generate Full Course */}
      <div className="border-2 border-indigo-200 rounded-2xl p-5 bg-indigo-50 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-base text-indigo-900">⚡ Generate Full Premium Course</h2>
            <p className="text-xs text-indigo-700 mt-0.5">
              Select a blueprint + program → GPT-4o writes all lesson content → course builds in DB → assessments generated → videos queued automatically
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-indigo-800 mb-1">Blueprint</label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={selBlueprint}
              onChange={e => setSelBlueprint(e.target.value)} disabled={generating}>
              <option value="">— Select blueprint —</option>
              {blueprints.map(b => (
                <option key={b.id} value={b.id}>{b.title} ({b.state}) — {b.modules}M / {b.lessons}L</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-indigo-800 mb-1">Program</label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={selProgram}
              onChange={e => setSelProgram(e.target.value)} disabled={generating}>
              <option value="">— Select program —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>

        <button onClick={generateFullCourse} disabled={!selBlueprint || !selProgram || generating}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {generating
            ? <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block">⟳</span>{genStep}</span>
            : '⚡ Generate Full Course Now'}
        </button>

        {genResult && (
          <div className={`rounded-xl p-4 space-y-2 ${genResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {genResult.ok ? (
              <>
                <div className="font-bold text-green-800">✅ {genResult.title}</div>
                <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
                  <div><b>{genResult.modules}</b> modules</div>
                  <div><b>{genResult.lessonsInserted}</b> lessons</div>
                  <div><b>{genResult.assessmentsGenerated}</b> quiz questions</div>
                  <div><b>{genResult.videosQueued}</b> videos queued</div>
                  <div><b>{genResult.contentFailures?.length ?? 0}</b> content failures</div>
                  <div><b>{genResult.generationFailures?.length ?? 0}</b> gen failures</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <a href={genResult.courseUrl} target="_blank" className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-green-700">View Course ↗</a>
                  <a href={genResult.videoStudioUrl} target="_blank" className="flex-1 text-center bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700">Video Studio ↗</a>
                  <a href="/admin/media-studio" target="_blank" className="flex-1 text-center border py-2 rounded-lg text-xs font-semibold hover:bg-gray-50">Media Studio ↗</a>
                </div>
                {(genResult.contentFailures?.length ?? 0) > 0 && (
                  <details className="text-xs text-amber-700">
                    <summary className="cursor-pointer font-semibold">⚠️ {genResult.contentFailures!.length} lessons need review</summary>
                    <ul className="mt-1 pl-3 space-y-0.5">{genResult.contentFailures!.map(f => <li key={f.slug}>• {f.slug}</li>)}</ul>
                  </details>
                )}
              </>
            ) : (
              <div className="text-red-700 font-semibold">❌ {genResult.error ?? 'Generation failed'}</div>
            )}
          </div>
        )}
      </div>

      {/* Manual Builder */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-3 border rounded-2xl p-4 space-y-2">
          <h2 className="font-semibold text-base mb-2">Modules</h2>
          <button className={`${btn} w-full`} onClick={addModule}>+ Add Module</button>
          {program.modules.map((m, i) => (
            <button key={i} onClick={() => { setSelMod(i); setSelLes(0); }}
              className={`w-full text-left border rounded p-2 text-xs ${i === selMod ? 'bg-gray-100 font-medium' : ''}`}>
              <div>{m.title || '(untitled)'}</div>
              <div className="text-slate-500">{m.slug} · {m.lessons.length}L</div>
            </button>
          ))}
        </div>

        <div className="col-span-4 border rounded-2xl p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <h2 className="font-semibold text-base">Program</h2>
          <input className={inp} placeholder="Title" value={program.title} onChange={e => upProg({ title: e.target.value })} />
          <input className={inp} placeholder="Slug" value={program.slug} onChange={e => upProg({ slug: e.target.value })} />
          <input className={inp} type="number" placeholder="Min hours" value={program.minimumHours} onChange={e => upProg({ minimumHours: Number(e.target.value) })} />
          <select className={sel} value={program.credentialTarget} onChange={e => upProg({ credentialTarget: e.target.value as any })}>
            {['INTERNAL','STATE_BOARD','IC&RC','NAADAC','DOL_APPRENTICESHIP','CUSTOM'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className={sel} value={program.regulatory.complianceProfileKey} onChange={e => upReg({ complianceProfileKey: e.target.value })}>
            {(complianceProfiles.length > 0 ? complianceProfiles : [
              { key: 'internal_basic', label: 'Internal Basic' },
              { key: 'state_board_strict', label: 'State Board Strict' },
              { key: 'dol_apprenticeship', label: 'DOL Apprenticeship' },
              { key: 'naadac_peer_support', label: 'NAADAC Peer Support' },
              { key: 'custom_regulated', label: 'Custom Regulated' },
            ]).map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <input className={inp} placeholder="Governing body" value={program.regulatory.governingBody ?? ''} onChange={e => upReg({ governingBody: e.target.value || null })} />
          <input className={inp} type="number" placeholder="Retention policy days" value={program.regulatory.retentionPolicyDays ?? ''} onChange={e => upReg({ retentionPolicyDays: e.target.value ? Number(e.target.value) : null })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={program.requiresFinalExam} onChange={e => upProg({ requiresFinalExam: e.target.checked, finalExam: { ...program.finalExam, required: e.target.checked } })} />
            Requires final exam
          </label>
          {program.requiresFinalExam && (
            <input className={inp} type="number" placeholder="Passing score" value={program.finalExam.passingScore ?? ''} onChange={e => upProg({ finalExam: { ...program.finalExam, passingScore: Number(e.target.value) } })} />
          )}
          {mod && (
            <div className="pt-3 border-t space-y-2">
              <h3 className="font-semibold">Module</h3>
              <input className={inp} placeholder="Title" value={mod.title} onChange={e => upMod(selMod, { title: e.target.value })} />
              <input className={inp} placeholder="Slug" value={mod.slug} onChange={e => upMod(selMod, { slug: e.target.value })} />
              <input className={inp} placeholder="Domain key" value={mod.domainKey} onChange={e => upMod(selMod, { domainKey: e.target.value })} />
              <input className={inp} type="number" placeholder="Target hours" value={mod.targetHours} onChange={e => upMod(selMod, { targetHours: Number(e.target.value) })} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={mod.quizRequired} onChange={e => upMod(selMod, { quizRequired: e.target.checked })} /> Quiz required</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={mod.practicalRequired} onChange={e => upMod(selMod, { practicalRequired: e.target.checked })} /> Practical required</label>
              <button className={`${btn} w-full`} onClick={addLesson}>+ Add Lesson</button>
              {mod.lessons.map((l, i) => (
                <button key={i} onClick={() => setSelLes(i)}
                  className={`w-full text-left border rounded p-2 text-xs ${i === selLes ? 'bg-gray-100 font-medium' : ''}`}>
                  <div>{l.title || '(untitled)'}</div>
                  <div className="text-slate-500">{l.lessonType} · {l.durationMinutes}min</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-5 border rounded-2xl p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <h2 className="font-semibold text-base">Lesson</h2>
          {les ? (
            <>
              <input className={inp} placeholder="Title" value={les.title} onChange={e => upLes(selMod, selLes, { title: e.target.value })} />
              <input className={inp} placeholder="Slug" value={les.slug} onChange={e => upLes(selMod, selLes, { slug: e.target.value })} />
              <select className={sel} value={les.lessonType} onChange={e => upLes(selMod, selLes, { lessonType: e.target.value as any })}>
                {['video','reading','quiz','assignment','practical','checkpoint','exam','live_session','fieldwork','observation','lesson','lab'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className={inp} type="number" placeholder="Duration (min)" value={les.durationMinutes} onChange={e => upLes(selMod, selLes, { durationMinutes: Number(e.target.value) })} />
              <textarea className={`${inp} min-h-[60px]`} placeholder="Learning objective"
                value={les.learningObjectives.join('\n')}
                onChange={e => upLes(selMod, selLes, { learningObjectives: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} />
              <select className={sel} value={les.domainKey ?? ''} onChange={e => upLes(selMod, selLes, { domainKey: e.target.value || null })}>
                <option value="">Domain key</option>
                {['foundations','advocacy','mentoring','education','wellness','ethics','cultural','professional_growth','infection_control','haircutting','shaving','chemical_services','consultation'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className={sel} value={les.hourCategory ?? ''} onChange={e => upLes(selMod, selLes, { hourCategory: (e.target.value || null) as any })}>
                <option value="">Hour category</option>
                {['didactic','practical','clinical','fieldwork','observation','supervision','self_study','exam'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select className={sel} value={les.deliveryMethod ?? ''} onChange={e => upLes(selMod, selLes, { deliveryMethod: (e.target.value || null) as any })}>
                <option value="">Delivery method</option>
                {['online_async','online_live','in_person','hybrid','field_based'].map(dm => <option key={dm} value={dm}>{dm}</option>)}
              </select>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!les.practicalRequired} onChange={e => upLes(selMod, selLes, { practicalRequired: e.target.checked })} /> Practical required</label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!les.requiresInstructorSignoff}
                  onChange={e => upLes(selMod, selLes, {
                    requiresInstructorSignoff: e.target.checked,
                    instructorRequirement: e.target.checked ? { required: true, approvalAuthority: 'lesson', supervisionMethod: 'observation', roleTypes: ['instructor'] } : null,
                  })} />
                Instructor signoff
              </label>
              <div className="flex gap-2 pt-3 border-t">
                <button className={`${btn} flex-1`} onClick={runAudit} disabled={busy}>{busy ? '…' : 'Audit'}</button>
                <button className={`${btn} flex-1 bg-black text-white disabled:opacity-40`} onClick={publish} disabled={busy}>{busy ? 'Publishing…' : 'Publish'}</button>
              </div>
              <div className="text-xs text-slate-500">Total: {(totalMinutes / 60).toFixed(2)}h · {program.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons</div>
            </>
          ) : (
            <div className="text-slate-500">Select or add a lesson.</div>
          )}
          {auditResult && (
            <pre className="mt-4 border rounded p-3 text-xs overflow-auto bg-gray-50" style={{ maxHeight: '300px' }}>
              {JSON.stringify(auditResult, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
