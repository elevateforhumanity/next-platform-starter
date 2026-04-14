import { siteConfig } from '@/content/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About',
  description: 'Elevate for Humanity is a workforce development organization providing career training, community services, and educational pathways in Indianapolis, Indiana.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">About Elevate for Humanity</h1>
      <p className="mt-6 text-lg text-gray-600">
        Elevate for Humanity is a workforce development organization based in Indianapolis, Indiana.
        We provide career training programs, community services, and educational pathways designed
        to move people forward.
      </p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">Our mission</h2>
          <p className="mt-3 text-gray-600">
            To provide accessible, credential-bearing career training and community support services
            that create real economic mobility for individuals and families.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">What we do</h2>
          <p className="mt-3 text-gray-600">
            We operate short-term career training programs in healthcare, skilled trades, technology,
            beauty, and business. Most programs complete in 4–12 weeks and lead to industry-recognized
            credentials. WIOA and Workforce Ready Grant funding is available for eligible Indiana residents.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Community services</h2>
          <p className="mt-3 text-gray-600">
            We operate a VITA free tax preparation site, provide mental wellness referrals through
            Selfish Inc., and connect community members with funded job training and employment services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3 text-gray-600">
            {siteConfig.address} · {siteConfig.phone} · {siteConfig.hours}
          </p>
        </div>
      </div>
    </section>
  );
}
