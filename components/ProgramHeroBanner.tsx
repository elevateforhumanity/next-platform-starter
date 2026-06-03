'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';
interface ProgramHeroBannerProps {
  videoSrc: string;
  /** @deprecated Posters are not used — video-only hero frame. */
  posterImage?: string;
  pageKey?: string;
  title?: string;
  voiceoverSrc?: string;
}

export default function ProgramHeroBanner({
  videoSrc,
}: ProgramHeroBannerProps) {
  return (
    <div
      className="relative w-full overflow-hidden bg-slate-900"
      style={{ height: 'clamp(320px, 45vw, 560px)' }}
    >
      <CanonicalVideo
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlayOnMount
        playThrough
        loop
      />
    </div>
  );
}
