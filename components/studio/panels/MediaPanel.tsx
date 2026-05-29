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

// VideoManagerClient was consolidated into the Studio media tab.
// Inline a lightweight video list here; full management is at /admin/studio.
const VideoManagerClient = dynamic(
  () => import('@/components/admin/AdvancedVideoUploader').then(m => ({ default: m.default ?? m })),
  { ssr: false, loading: () => <PanelSkeleton label="Media" /> }
);

export function MediaPanel() {
  const { state, appendAIMemory } = useCourse();
  const { videos } = state;

  // Map StudioVideo → VideoRecord shape expected by VideoManagerClient
  const initialVideos = videos.map(v => ({
    id: v.id,
    title: v.title,
    url: v.url ?? v.video_url ?? '',
    created_at: v.created_at,
    duration_minutes: v.duration_seconds != null ? Math.round(v.duration_seconds / 60) : null,
  }));

  return (
    <div className="p-6">
      <PanelHeader
        icon={<Video className="w-5 h-5" />}
        title="Media"
        subtitle={`${videos.length} video${videos.length !== 1 ? 's' : ''} available`}
      />
      <VideoManagerClient
        embedded
        initialVideos={initialVideos}
        onVideoAttached={(videoUrl: string) => {
          appendAIMemory({
            role: 'action',
            content: `Video URL copied for attachment: ${videoUrl}`,
            source: 'media',
          });
        }}
      />
    </div>
  );
}
