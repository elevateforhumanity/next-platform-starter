'use client';

import HeroVideo from '@/components/marketing/HeroVideo';
import type { HeroBannerConfig } from '@/content/heroBanners';

interface HomeHeroVideoProps {
  banner: HeroBannerConfig;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  return (
    <>
      {banner.posterImage && (
        <link rel="preload" as="image" href={banner.posterImage} />
      )}
      <link
        rel="preload"
        as="video"
        href={banner.videoSrcDesktop}
        type="video/mp4"
      />
      <HeroVideo
        videoSrcDesktop={banner.videoSrcDesktop!}
        videoSrcMobile={banner.videoSrcMobile}
        posterImage={banner.posterImage}
        voiceoverSrc={banner.voiceoverSrc}
        microLabel={banner.microLabel}
        belowHeroHeadline={banner.belowHeroHeadline}
        belowHeroSubheadline={banner.belowHeroSubheadline}
        ctas={[banner.primaryCta, banner.secondaryCta].filter(Boolean)}
        trustIndicators={banner.trustIndicators}
        transcript={banner.transcript}
      />
    </>
  );
}