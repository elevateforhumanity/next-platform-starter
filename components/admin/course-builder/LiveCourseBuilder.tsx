'use client';

/**
 * LiveCourseBuilder — Durable-style three-panel course editor.
 *
 * Left:   Module/lesson tree (drag to reorder, click to select)
 * Center: Live student-view preview of the selected lesson
 * Right:  Inline edit panel for the selected lesson's fields
 *
 * All saves go to /api/admin/course-builder/lesson (PATCH) without
 * leaving the page. The preview iframe refreshes after each save.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Save, RefreshCw,
  Eye, Edit3, GripVertical, Video, FileText, CheckSquare,
  FlaskConical, BookOpen, Award, Loader2, ExternalLink,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  slug: string;
  lesson_order: number;
  step_type: 'lesson' | 'quiz' | 'checkpoint' | 'lab' | 'assignment' | 'exam' | 'certification';
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  passing_score?: number;
  status: 'draft' | 'published';
}

interface Module {
  id: string;
  title: string;
  slug: string;
  module_order: number;
  lessons: Lesson[];
}

interface Props {
  courseId: string;
  courseTitle: string;
  initialModules: Module[];
  lmsBaseUrl?: string;
}

// ── Step type config ─────────────────────────────────────────────────────────

const STEP_TYPES = [
  { value: 'lesson',        label: 'Lesson',       icon: BookOpen,     color: 'text-blue-500' },
  { value: 'quiz',          label: 'Quiz',         icon: CheckSquare,  color: 'text-purple-500' },
  { value: 'checkpoint',    label: 'Checkpoint',   icon: CheckSquare,  color: 'text-orange-500' },
  { value: 'lab',           label: 'Lab',          icon: FlaskConical, color: 'text-green-500' },
  { value: 'assignment',    label: 'Assignment',   icon: FileText,     color: 'text-yellow-500' },
  { value: 'exam',          label: 'Exam',         icon: Award,        color: 'text-red-500' },
  { value: 'certification', label: 'Certification',icon: Award,        color: 'text-brand-red-500' },
] as const;

function stepIcon(type: Lesson['step_type']) {
  const cfg = STEP_TYPES.find(s => s.value === type);
  if (!cfg) return <BookOpen className="w-3.5 h-3.5" />;
  const Icon = cfg.icon;
  return <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function LiveCourseBuilder({ courseId, courseTitle, initialModules, lmsBaseUrl = '' }: Props) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(initialModules[0]?.id ?? null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    initialModules[0]?.lessons[0]?.id ?? null,
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(initialModules.map(m => m.id)),
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editPanelOpen, setEditPanelOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [previewKey, setPreviewKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editStepType, setEditStepType] = useState<Lesson['step_type']>('lesson');
  const [editDuration, setEditDuration] = useState('');
  const [editPassingScore, setEditPassingScore] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Derived: selected lesson
  const selectedLesson = modules
    .flatMap(m => m.lessons)
    .find(l => l.id === selectedLessonId) ?? null;

  const selectedModule = modules.find(m => m.id === selectedModuleId) ?? null;

  // Populate edit form when selection changes
  useEffect(() => {
    if (!selectedLesson) return;
    setEditTitle(selectedLesson.title);
    setEditContent(selectedLesson.content ?? '');
    setEditVideoUrl(selectedLesson.video_url ?? '');
    setEditStepType(selectedLesson.step_type);
    setEditDuration(String(selectedLesson.duration_minutes ?? ''));
    setEditPassingScore(String(selectedLesson.passing_score ?? ''));
    setEditStatus(selectedLesson.status);
  }, [selectedLessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preview URL for the selected lesson
  const previewUrl = selectedLessonId
    ? `${lmsBaseUrl}/lms/courses/${courseId}/lessons/${selectedLessonId}?preview=1`
    : null;

  function toggleModule(id: string) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectLesson(moduleId: string, lessonId: string) {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    setSaveStatus('idle');
  }

  const refreshPreview = useCallback(() => {
    setPreviewKey(k => k + 1);
  }, []);

  async function saveLesson() {
    if (!selectedLessonId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/admin/course-builder/lesson-patch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          title: editTitle,
          content: editContent,
          video_url: editVideoUrl || null,
          step_type: editStepType,
          duration_minutes: editDuration ? parseInt(editDuration) : null,
          passing_score: editPassingScore ? parseInt(editPassingScore) : null,
          status: editStatus,
        }),
      });
      if (!res.ok) throw new Error('Save failed');

      // Update local state
      setModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons.map(l =>
          l.id === selectedLessonId
            ? {
                ...l,
                title: editTitle,
                content: editContent,
                video_url: editVideoUrl || undefined,
                step_type: editStepType,
                duration_minutes: editDuration ? parseInt(editDuration) : undefined,
                passing_score: editPassingScore ? parseInt(editPassingScore) : undefined,
                status: editStatus,
              }
            : l,
        ),
      })));

      setSaveStatus('saved');
      refreshPreview();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-100 overflow-hidden">

      {/* ── LEFT SIDEBAR: Module/Lesson Tree ─────────────────────────── */}
      <aside
        className={`flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Course</p>
            <p className="text-sm font-bold text-slate-800 truncate">{courseTitle}</p>
          </div>
        </div>

        {/* Module/lesson tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {modules.map((mod, mi) => (
            <div key={mod.id}>
              {/* Module row */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 group"
              >
                <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                {expandedModules.has(mod.id)
                  ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                }
                <span className="text-xs font-bold text-slate-600 truncate flex-1">
                  {mi + 1}. {mod.title}
                </span>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{mod.lessons.length}</span>
              </button>

              {/* Lesson rows */}
              {expandedModules.has(mod.id) && mod.lessons.map((les, li) => (
                <button
                  key={les.id}
                  onClick={() => selectLesson(mod.id, les.id)}
                  className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left transition-colors ${
                    selectedLessonId === les.id
                      ? 'bg-brand-red-50 border-r-2 border-brand-red-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <GripVertical className="w-3 h-3 text-slate-200 flex-shrink-0" />
                  {stepIcon(les.step_type)}
                  <span className={`text-xs truncate flex-1 ${
                    selectedLessonId === les.id ? 'text-brand-red-700 font-semibold' : 'text-slate-600'
                  }`}>
                    {li + 1}. {les.title}
                  </span>
                  {les.status === 'draft' && (
                    <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                      DRAFT
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Add lesson button */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={() => window.open(`/admin/curriculum/${courseId}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 rounded-lg hover:bg-slate-50 border border-dashed border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Manage in Curriculum Builder
          </button>
        </div>
      </aside>

      {/* ── CENTER: Preview ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-4 h-4" />
              : <PanelLeftOpen className="w-4 h-4" />
            }
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 flex-1">
            {selectedModule && (
              <>
                <span className="font-medium text-slate-700 truncate">{selectedModule.title}</span>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              </>
            )}
            {selectedLesson && (
              <span className="font-semibold text-slate-900 truncate">{selectedLesson.title}</span>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={refreshPreview}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open in new tab */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Preview iframe / Edit panel */}
        <div className="flex-1 overflow-hidden flex">

          {/* Preview */}
          <div className={`flex-1 ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
            {previewUrl ? (
              <iframe
                key={previewKey}
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Lesson preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Select a lesson to preview
              </div>
            )}
          </div>

          {/* Edit panel (mobile / no right panel) */}
          {activeTab === 'edit' && (
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <EditPanel
                lesson={selectedLesson}
                title={editTitle} setTitle={setEditTitle}
                content={editContent} setContent={setEditContent}
                videoUrl={editVideoUrl} setVideoUrl={setEditVideoUrl}
                stepType={editStepType} setStepType={setEditStepType}
                duration={editDuration} setDuration={setEditDuration}
                passingScore={editPassingScore} setPassingScore={setEditPassingScore}
                status={editStatus} setStatus={setEditStatus}
                saving={saving} saveStatus={saveStatus}
                onSave={saveLesson}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Edit (desktop) ───────────────────────────────── */}
      {editPanelOpen && (
        <aside className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden hidden lg:flex">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Edit Lesson</p>
            <button
              onClick={() => setEditPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <EditPanel
              lesson={selectedLesson}
              title={editTitle} setTitle={setEditTitle}
              content={editContent} setContent={setEditContent}
              videoUrl={editVideoUrl} setVideoUrl={setEditVideoUrl}
              stepType={editStepType} setStepType={setEditStepType}
              duration={editDuration} setDuration={setEditDuration}
              passingScore={editPassingScore} setPassingScore={setEditPassingScore}
              status={editStatus} setStatus={setEditStatus}
              saving={saving} saveStatus={saveStatus}
              onSave={saveLesson}
            />
          </div>
        </aside>
      )}

      {/* Re-open right panel button */}
      {!editPanelOpen && (
        <button
          onClick={() => setEditPanelOpen(true)}
          className="fixed right-4 bottom-4 bg-brand-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 hover:bg-brand-red-700 transition-colors z-50"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Panel
        </button>
      )}
    </div>
  );
}

// ── Edit Panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
  lesson: Lesson | null;
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  videoUrl: string; setVideoUrl: (v: string) => void;
  stepType: Lesson['step_type']; setStepType: (v: Lesson['step_type']) => void;
  duration: string; setDuration: (v: string) => void;
  passingScore: string; setPassingScore: (v: string) => void;
  status: 'draft' | 'published'; setStatus: (v: 'draft' | 'published') => void;
  saving: boolean;
  saveStatus: 'idle' | 'saved' | 'error';
  onSave: () => void;
}

function EditPanel({
  lesson, title, setTitle, content, setContent, videoUrl, setVideoUrl,
  stepType, setStepType, duration, setDuration, passingScore, setPassingScore,
  status, setStatus, saving, saveStatus, onSave,
}: EditPanelProps) {
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
        <BookOpen className="w-8 h-8 opacity-30" />
        <p>Select a lesson to edit</p>
      </div>
    );
  }

  const needsPassingScore = ['quiz', 'checkpoint', 'exam'].includes(stepType);

  return (
    <div className="space-y-5">

      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
          placeholder="Lesson title"
        />
      </div>

      {/* Step type */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Type</label>
        <select
          value={stepType}
          onChange={e => setStepType(e.target.value as Lesson['step_type'])}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
        >
          {STEP_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" /> Video URL
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
          placeholder="https://..."
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Content
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400 font-mono resize-y"
          placeholder="Lesson content (HTML or markdown)..."
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Duration (minutes)</label>
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
          placeholder="30"
          min={1}
        />
      </div>

      {/* Passing score — only for quiz/checkpoint/exam */}
      {needsPassingScore && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Passing Score (%)</label>
          <input
            type="number"
            value={passingScore}
            onChange={e => setPassingScore(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-400"
            placeholder="70"
            min={1}
            max={100}
          />
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Status</label>
        <div className="flex gap-2">
          {(['draft', 'published'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                status === s
                  ? s === 'published'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
          saveStatus === 'saved'
            ? 'bg-green-600 text-white'
            : saveStatus === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
        }`}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saveStatus === 'saved' ? (
          '✓ Saved'
        ) : saveStatus === 'error' ? (
          '✗ Error — try again'
        ) : (
          <><Save className="w-4 h-4" /> Save Changes</>
        )}
      </button>

      {/* Quick links */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quick Links</p>
        <a
          href={`/admin/courses/${lesson.id}/quizzes`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 py-1"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Manage Quiz Questions
        </a>
        <a
          href={`/admin/video-manager`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 py-1"
        >
          <Video className="w-3.5 h-3.5" /> Video Manager
        </a>
      </div>
    </div>
  );
}
