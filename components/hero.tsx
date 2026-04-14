import Link from 'next/link';

type HeroProps = {
  heading: string;
  subheading: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function Hero({
  heading,
  subheading,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: HeroProps) {
  const isExternal = (href: string) => href.startsWith('http');

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-6 text-lg text-gray-600">{subheading}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          {isExternal(primaryHref) ? (
            <a
              href={primaryHref}
              className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              {primaryLabel}
            </a>
          ) : (
            <Link
              href={primaryHref}
              className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              {primaryLabel}
            </Link>
          )}
          {secondaryLabel && secondaryHref && (
            isExternal(secondaryHref) ? (
              <a href={secondaryHref} className="rounded border px-5 py-3 hover:bg-gray-50">
                {secondaryLabel}
              </a>
            ) : (
              <Link href={secondaryHref} className="rounded border px-5 py-3 hover:bg-gray-50">
                {secondaryLabel}
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
