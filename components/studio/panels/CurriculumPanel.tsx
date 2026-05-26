'use client';

/**
 * CurriculumPanel — wraps LessonManagerClient
 * Reads modules/lessons from CourseProvider, writes via upsertLesson.
 */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import { BookOpen } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const LessonManagerClient = dynamic(
  () => import('@/apps/admin/app/admin/courses/[courseId]/content/LessonManagerClient').then(m => ({ default: m.default ?? m })),
  { ssr: false, loading: () => <PanelSkeleton label="Curriculum" /> }
);

export function CurriculumPanel() {
  const { state, upsertLesson, deleteLesson, appendAIMemory } = useCourse();
  const { course, modules, lessons } = state;

  return (
    <div className="p-6">
      <PanelHeader
        icon={<BookOpen className="w-5 h-5" />}
        title="Curriculum"
        subtitle={`${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} across ${modules.length} module${modules.length !== 1 ? 's' : ''}`}
      />
      <LessonManagerClient
        course={course}
        courseId={course.id}
        initialLessons={lessons}
        onLessonSaved={(lesson) => {
          upsertLesson(lesson as Parameters<typeof upsertLesson>[0]);
          appendAIMemory({
            role: 'action',
            content: `Lesson saved: "${lesson.title}"`,
            source: 'curriculum',
          });
        }}
        onLessonDeleted={(lessonId) => {
          deleteLesson(lessonId);
          appendAIMemory({
            role: 'action',
            content: `Lesson deleted: ${lessonId}`,
            source: 'curriculum',
          });
        }}
      />
    </div>
  );
}
