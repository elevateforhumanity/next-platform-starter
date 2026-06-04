import Image from 'next/image';
import { hero, layout, type } from '@/lib/page-design-tokens';

interface CleanPageHeroProps {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  priority?: boolean;
}

/**
 * Marketing hero — image band only, copy in white panel below.
 * No gradient overlays or text on the image (page-design-standard).
 */
export function CleanPageHero({ src, alt, title, subtitle, priority }: CleanPageHeroProps) {
  return (
    <>
      <div className={hero.imageWrap}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover object-center"
          sizes={hero.imageSizes}
          placeholder="empty"
        />
      </div>
      <section className={hero.contentPanel}>
        <div className={`${layout.containerNarrow} py-6 sm:py-8`}>
          <h1 className={type.h1}>{title}</h1>
          {subtitle ? <p className={`${type.body} mt-3 max-w-2xl`}>{subtitle}</p> : null}
        </div>
      </section>
    </>
  );
}
