'use client';

/**
 * QuizPanel — wraps QuizManagerClient
 * Reads lessons from CourseProvider so quiz builder knows which lessons exist.
 */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import { HelpCircle } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const QuizManagerClient = dynamic(
  () => import('@/apps/admin/app/admin/courses/[courseId]/quizzes/QuizManagerClient').then(m => ({ default: m.default ?? m })),
  { ssr: false, loading: () => <PanelSkeleton label="Quizzes" /> }
);

export function QuizPanel() {
  const { state, upsertLesson, appendAIMemory } = useCourse();
  const { course, lessons } = state;

  const quizLessons = lessons.filter(l =>
    ['quiz', 'checkpoint', 'exam'].includes(l.lesson_type)
  );

  return (
    <div className="p-6">
      <PanelHeader
        icon={<HelpCircle className="w-5 h-5" />}
        title="Quizzes & Assessments"
        subtitle={`${quizLessons.length} assessment lesson${quizLessons.length !== 1 ? 's' : ''}`}
      />
      <QuizManagerClient
        courseId={course.id}
        lessons={lessons}
        onQuizSaved={(lessonId: string, questions: unknown[]) => {
          const lesson = lessons.find(l => l.id === lessonId);
          if (lesson) {
            upsertLesson({ ...lesson, quiz_questions: questions });
            appendAIMemory({
              role: 'action',
              content: `Quiz updated for lesson "${lesson.title}": ${questions.length} question${questions.length !== 1 ? 's' : ''}`,
              source: 'quiz',
            });
          }
        }}
      />
    </div>
  );
}
