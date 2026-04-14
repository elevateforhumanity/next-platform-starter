import Link from 'next/link';
import { legalDocs } from '@/content/legal';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Legal',
  description: 'Legal documents including privacy policy, enrollment agreement, EULA, and partner agreements for Elevate for Humanity.',
  path: '/legal',
});

export default function LegalPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Legal</h1>
      <p className="mt-4 text-gray-600">
        Legal agreements, disclosures, and documents governing use of Elevate for Humanity
        programs and platforms.
      </p>
      <ul className="mt-8 divide-y">
        {legalDocs.map((doc) => (
          <li key={doc.slug} className="py-4">
            <Link href={`/legal/${doc.slug}`} className="font-medium hover:underline">
              {doc.title}
            </Link>
            <p className="mt-1 text-sm text-gray-600">{doc.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
