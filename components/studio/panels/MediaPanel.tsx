'use client';

/**
 * MediaPanel — wraps VideoManagerClient + MediaStudioClient
 * Reads videos from CourseProvider. Attaching a video to a lesson
 * writes back via upsertLesson so curriculum stays in sync.
 */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import { Video } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const VideoManagerClient = dynamic(
  () => import('@/apps/admin/app/admin/video-manager/VideoManagerClient').then(m => ({ default: m.default ?? m })),
  { ssr: false, loading: () => <PanelSkeleton label="Media" /> }
);

export function MediaPanel() {
  const { state, upsertLesson, appendAIMemory } = useCourse();
  const { course, videos, lessons } = state;

  return (
    <div className="p-6">
      <PanelHeader
        icon={<Video className="w-5 h-5" />}
        title="Media"
        subtitle={`${videos.length} video${videos.length !== 1 ? 's' : ''} available`}
      />
      <VideoManagerClient
        courseId={course.id}
        videos={videos}
        lessons={lessons}
        onVideoAttached={(lessonId: string, videoUrl: string) => {
          const lesson = lessons.find(l => l.id === lessonId);
          if (lesson) {
            upsertLesson({ ...lesson, video_url: videoUrl });
            appendAIMemory({
              role: 'action',
              content: `Video attached to lesson "${lesson.title}": ${videoUrl}`,
              source: 'media',
            });
          }
        }}
      />
    </div>
  );
}
