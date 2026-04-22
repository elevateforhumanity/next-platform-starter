import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';

const pages: Record<string, { title: string; body: string }> = {
  about: { title: 'About RISE Foundation', body: 'The RISE Foundation supports recovery, healing, and community wellness through evidence-based programs and community partnerships.' },
  'addiction-rehabilitation': { title: 'Addiction Rehabilitation', body: 'Evidence-based support for individuals in recovery, including peer support, counseling referrals, and community connection.' },
  'trauma-recovery': { title: 'Trauma Recovery', body: 'Trauma-informed care and recovery support services for individuals who have experienced adverse life events.' },
  'young-adult-wellness': { title: 'Young Adult Wellness', body: 'Programs for young adults navigating mental health challenges, life transitions, and community reintegration.' },
  'divorce-support': { title: 'Divorce Support', body: 'Resources, peer support, and community connection for individuals navigating divorce and family transitions.' },
  programs: { title: 'RISE Programs', body: 'Full list of RISE Foundation programs including addiction rehabilitation, trauma recovery, and wellness services.' },
  donate: { title: 'Donate to RISE Foundation', body: 'Your support funds peer recovery programs, wellness services, and community outreach for underserved populations.' },
  'get-involved': { title: 'Get Involved', body: 'Volunteer, partner, or advocate with the RISE Foundation to expand access to wellness and recovery services.' },
  events: { title: 'RISE Events', body: 'Community events, workshops, and wellness programs hosted by the RISE Foundation.' },
  curvature: { title: 'Curvature Program', body: 'A RISE Foundation wellness initiative supporting body-positive health and community care.' },
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return buildMetadata({ title: page.title, description: page.body.slice(0, 120), path: `/rise-foundation/${slug}` });
}

export default async function RiseFoundationSubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug] ?? { title: 'RISE Foundation', body: 'For more information, contact us.' };

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{page.title}</h1>
      <p className="mt-6 text-slate-700">{page.body}</p>
      <div className="mt-10 flex gap-4">
        <a href="mailto:info@elevateforhumanity.org" className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Contact Us</a>
        <a href="/rise-foundation" className="rounded border px-5 py-3 hover:bg-slate-50">Back to RISE</a>
      </div>
    </section>
  );
}
