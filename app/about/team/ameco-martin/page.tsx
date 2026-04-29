import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ameco Martin | Our Team | Elevate for Humanity',
  description:
    'Ameco Martin — Director of Information Technology at Elevate for Humanity Technical and Career Institute. A.S. Business, B.S. Computer Programming.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Team', href: '/about/team' }, { label: 'Ameco Martin' }]}
        />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/about/team"
            className="inline-flex items-center text-sm text-black hover:text-brand-red-600 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
          </Link>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Photo placeholder — replace src when headshot is available */}
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-slate-100 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Photo coming soon</span>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Ameco Martin</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-2">
                Director of Information Technology
              </p>
              <p className="text-slate-500 text-sm mb-6">
                A.S. Business &nbsp;·&nbsp; B.S. Computer Programming &nbsp;·&nbsp; Owner, Ameco&apos;s Enterprise LLC
              </p>

              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>
                  Ameco Martin holds an Associate&apos;s Degree in Business and a Bachelor&apos;s
                  Degree in Computer Programming. She is the owner of Ameco&apos;s Enterprise LLC,
                  located at 6110 West 25th Street, Unit 241022, Indianapolis, IN 46224.
                </p>
                <p>
                  As Director of Information Technology at Elevate for Humanity, Ameco oversees all
                  IT and technology credential programs including IT Help Desk / CompTIA A+,
                  Cybersecurity Analyst, Network Administration, Network Support Technician, Web
                  Development, Software Development, Graphic Design, CAD/Drafting, Bookkeeping
                  &amp; QuickBooks, Tax Preparation, Office Administration, Business Administration,
                  Entrepreneurship, and Project Management.
                </p>
                <p>
                  Ameco also serves as the dedicated Career Coach embedded full-time at Warren
                  Central High School under Elevate&apos;s WIOA In-School Youth contract with
                  EmployIndy. In that role she provides in-person career coaching, WIOA eligibility
                  screening, Individual Service Strategy development, Indiana Career Connect data
                  entry, employer coordination, and work-based learning placement for in-school
                  youth participants.
                </p>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                  <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">
                    Credentials &amp; Affiliations
                  </h2>
                  {[
                    'A.S. in Business',
                    'B.S. in Computer Programming',
                    'Owner — Ameco\'s Enterprise LLC',
                    'Director of IT Programs — Elevate for Humanity',
                    'WIOA Career Coach — Warren Central High School (EmployIndy)',
                    'Program Holder — IT, Business & Technology Credential Programs',
                  ].map((item) => (
                    <p key={item} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-brand-red-600 font-bold">·</span> {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
