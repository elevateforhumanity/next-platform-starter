import fs from 'fs';
import path from 'path';
import type {
  CourseSeed,
  LessonSeed,
  CheckpointSeed,
  ModuleSeed,
} from '../../../lib/curriculum/course-builder-types';
import { module1 } from './module-1.seed';
import { module2 } from './module-2.seed';
import { module3 } from './module-3.seed';
import { module4 } from './module-4.seed';
import { module5 } from './module-5.seed';
import { module6 } from './module-6.seed';
import { module7 } from './module-7.seed';
import { module8 } from './module-8.seed';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Sidecar merger ────────────────────────────────────────────────────────────
// Generated quiz/flashcard content lives in seeds/content/<slug>.json.
// TypeScript seed files are never modified by the generator.

const SIDECAR_DIR = path.resolve(__dirname, 'content');

const MILADY_CHAPTER_FALLBACK_BY_SLUG: Record<string, string> = {
  'barber-lesson-1': 'Foundations Ch. 1 — Life Skills',
  'barber-lesson-2': 'Foundations Ch. 5 — Infection Control',
  'barber-lesson-3': 'Foundations Ch. 5 — Infection Control',
  'barber-lesson-4': 'Foundations Ch. 5 — Infection Control',
  'barber-lesson-5': 'Foundations Ch. 5 — Infection Control',
  'barber-lesson-6': 'Foundations Ch. 10 — The Beauty Business',
  'barber-lesson-8': 'Barbering Ch. 5 — Properties of the Hair and Scalp',
  'barber-lesson-9': 'Barbering Ch. 5 — Properties of the Hair and Scalp',
  'barber-lesson-10': 'Barbering Ch. 5 — Properties of the Hair and Scalp',
  'barber-lesson-11': 'Barbering Ch. 6 — Hair and Scalp Disorders & Diseases',
  'barber-lesson-12': 'Foundations Ch. 3 — Communicating for Success',
  'barber-lesson-13': 'Barbering Ch. 8 — Shampooing and Conditioning',
  'barber-lesson-15': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-16': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-17': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-18': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-19': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-20': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-22': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-23': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-24': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-25': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-26': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-27': 'Barbering Ch. 9 — Haircutting',
  'barber-lesson-29': 'Barbering Ch. 12 — Shaving and Facial Hair Design',
  'barber-lesson-30': 'Barbering Ch. 12 — Shaving and Facial Hair Design',
  'barber-lesson-31': 'Barbering Ch. 12 — Shaving and Facial Hair Design',
  'barber-lesson-32': 'Barbering Ch. 12 — Shaving and Facial Hair Design',
  'barber-lesson-33': 'Barbering Ch. 12 — Shaving and Facial Hair Design',
  'barber-lesson-35': 'Barbering Ch. 15 — Haircoloring',
  'barber-lesson-36': 'Foundations Ch. 6 — Chemistry & Chemical Safety',
  'barber-lesson-37': 'Barbering Ch. 14 — Chemical Texture Services',
  'barber-lesson-38': 'Barbering Ch. 6 — Hair and Scalp Disorders & Diseases',
  'barber-lesson-40': 'Foundations Ch. 10 — The Beauty Business',
  'barber-lesson-41': 'Foundations Ch. 10 — The Beauty Business',
  'barber-lesson-42': 'Foundations Ch. 10 — The Beauty Business',
  'barber-lesson-43': 'Foundations Ch. 10 — The Beauty Business',
  'barber-lesson-44': 'Barbering Ch. 10 — Hairstyling',
  'barber-lesson-46': 'Milady Barbering — State Board Review',
  'barber-lesson-47': 'Milady Barbering — State Board Review',
  'barber-lesson-48': 'Milady Barbering — State Board Review',
  'barber-lesson-49': 'Milady Barbering — State Board Review',
};

function loadSidecar(slug: string): Record<string, unknown> {
  const p = path.join(SIDECAR_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function mergeLesson(lesson: LessonSeed): LessonSeed {
  const s = loadSidecar(lesson.slug);
  const sidecarMiladyChapter = typeof s.miladyChapter === 'string' ? s.miladyChapter : undefined;
  return {
    ...lesson,
    miladyChapter:
      lesson.miladyChapter ?? sidecarMiladyChapter ?? MILADY_CHAPTER_FALLBACK_BY_SLUG[lesson.slug],
    // Sidecar content wins if it's longer than the seed content
    content: (() => {
      const sidecarContent = s.content as string | undefined;
      if (!sidecarContent) return lesson.content;
      const sidecarWords = sidecarContent.trim().split(/\s+/).length;
      const seedWords = lesson.content?.trim().split(/\s+/).length ?? 0;
      return sidecarWords > seedWords ? sidecarContent : lesson.content;
    })(),
    quiz: (s.quiz as LessonSeed['quiz']) ?? lesson.quiz,
    flashcards: (s.flashcards as LessonSeed['flashcards']) ?? lesson.flashcards,
    procedures: (s.procedures as LessonSeed['procedures']) ?? lesson.procedures,
  };
}

function mergeCheckpoint(cp: CheckpointSeed): CheckpointSeed {
  const s = loadSidecar(cp.slug);
  const sq = s.quiz as
    | { passingScore?: number; questions?: CheckpointSeed['questions'] }
    | undefined;
  return {
    ...cp,
    questions: sq?.questions ?? cp.questions,
    passingScore: sq?.passingScore ?? cp.passingScore,
  };
}

function mergeModule(mod: ModuleSeed): ModuleSeed {
  return {
    ...mod,
    lessons: mod.lessons.map(mergeLesson),
    checkpoint: mod.checkpoint ? mergeCheckpoint(mod.checkpoint) : undefined,
  };
}

export const barberCourse: CourseSeed = {
  slug: 'barber-apprenticeship',
  title: 'Indiana Registered Barber License — Apprenticeship Program',
  hoursTotal: 14.5,
  modules: [module1, module2, module3, module4, module5, module6, module7, module8].map(
    mergeModule,
  ),
};
