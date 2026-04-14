import { siteConfig } from '@/content/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'CNA Interest List',
  description: 'Join the interest list for CNA training pathway updates, eligibility details, and upcoming enrollment opportunities.',
  path: '/cna-waitlist',
});

export default function CnaWaitlistPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">CNA Interest List</h1>
      <p className="mt-4 text-gray-600">
        Join the interest list to be notified about CNA training pathway updates,
        eligibility details, and upcoming enrollment opportunities.
      </p>
      <p className="mt-3 text-gray-600">
        The Certified Nursing Assistant program is a 6-week Indiana state certification
        program with clinical rotations at licensed healthcare facilities. WIOA and
        Workforce Ready Grant funding available for eligible Indiana residents.
      </p>
      <div className="mt-8">
        <a
          href={siteConfig.handoff.apply}
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          Start Application
        </a>
      </div>
    </section>
  );
}
