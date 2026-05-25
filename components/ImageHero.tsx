import Image from 'next/image';

interface ImageHeroProps {
  src: string;
  alt: string;
  height?: string;
}

export function ImageHero({ src, alt, height = '50vh' }: ImageHeroProps) {
  return (
    <section className="relative w-full overflow-hidden" style={{ height, minHeight: '300px' }}>
// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)
      <Image sizes="100vw" src={src} alt={alt} fill className="object-cover" priority placeholder="empty" />
    </section>
  );
}
