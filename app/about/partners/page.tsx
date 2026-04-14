import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Partners',
  description: 'Elevate for Humanity partners with employers, workforce boards, and community organizations to connect learners to careers.',
  path: '/about/partners',
});

export default function PartnersPage() {
  const partnerTypes = [
    {
      heading: 'Employer Partners',
      body: 'We work with regional employers to align training to real job openings and facilitate direct hiring pipelines for program graduates.',
    },
    {
      heading: 'Workforce Boards',
      body: 'Partnerships with Indiana, Illinois, Ohio, Tennessee, and Texas workforce development boards enable WIOA funding access for eligible learners.',
    },
    {
      heading: 'Community Organizations',
      body: 'We collaborate with social service agencies, reentry programs, and community centers to reach learners who need wraparound support.',
    },
    {
      heading: 'Credentialing Bodies',
      body: 'NHA, NCCER, EPA, and state licensing boards validate our curriculum and proctor certification exams on-site.',
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Partners</h1>
      <p className="mt-4 text-gray-600">
        Our network of employer, workforce, and community partners makes it possible to connect
        learners to training, funding, and jobs.
      </p>
      <div className="mt-10 space-y-8">
        {partnerTypes.map((p) => (
          <div key={p.heading}>
            <h2 className="text-xl font-semibold">{p.heading}</h2>
            <p className="mt-2 text-gray-600">{p.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <a
          href="mailto:partnerships@elevateforhumanity.org"
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          Become a Partner
        </a>
      </div>
    </section>
  );
}
