import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, Award, CheckCircle, Phone } from 'lucide-react';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Phlebotomy Technician Training | NHA CPT Certification | Indianapolis',
  description: '120-hour phlebotomy program in 4 weeks. Prepare for NHA Certified Phlebotomy Technician (CPT) exam. Self-pay with BNPL options available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/phlebotomy' },
  openGraph: {
    title: 'Phlebotomy Technician Training | NHA CPT Certification',
    description: '120-hour phlebotomy program in 4 weeks. Prepare for NHA Certified Phlebotomy Technician (CPT) exam.',
    url: 'https://www.elevateforhumanity.org/programs/phlebotomy',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/images/pages/phlebotomy-real.webp', width: 1200, height: 630, alt: 'Phlebotomy student practicing venipuncture' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  pageKey: 'phlebotomy',

  title: 'Phlebotomy Technician',
  subtitle: 'Complete 120 hours of classroom and clinical training in 4 weeks. Prepare for the NHA Certified Phlebotomy Technician (CPT) exam.',
  badge: 'Self-Pay',
  badgeColor: 'blue',

  duration: '4 weeks',
  cost: '$1,499',
  format: 'Hybrid (Online + In-Person Lab)',
  credential: 'NHA CPT Certification',

  overview: 'Our Phlebotomy Technician program prepares you for a career in healthcare specimen collection. You will learn venipuncture techniques, capillary puncture, specimen handling, and patient communication. Upon completion, you will be eligible to take the National Healthcareer Association (NHA) Certified Phlebotomy Technician (CPT) exam.',
  highlights: [
    '120 hours of comprehensive training',
    'NHA CPT exam prep included',
    'Hands-on venipuncture practice in clinical lab',
    'CPR/BLS certification included',
    'Bloodborne pathogens training included',
    'Small class sizes (8-12 students)',
    'Flexible payment plans available',
  ],
  overviewImage: '/images/pages/phlebotomy-real.webp',
  overviewImageAlt: 'Phlebotomy student practicing venipuncture technique',

  salaryNumber: 37000,
  salaryLabel: 'Average phlebotomist starting salary in Indiana',
  salaryPrefix: '$',

  credentials: [
    'NHA Certified Phlebotomy Technician (CPT)',
    'CPR/BLS for Healthcare Providers',
    'Bloodborne Pathogens Certificate',
  ],

  careers: [
    { title: 'Phlebotomist', salary: '$32,000–$42,000' },
    { title: 'Lab Assistant', salary: '$30,000–$40,000' },
    { title: 'Patient Services Technician', salary: '$31,000–$41,000' },
    { title: 'Medical Lab Technician', salary: '$45,000–$58,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our simple online application in about 5 minutes.' },
    { title: 'Choose Payment Plan', desc: 'Pay in full, monthly installments, or use BNPL options.' },
    { title: 'Get Materials', desc: 'Receive textbooks, supplies, and lab coat before class starts.' },
    { title: 'Complete Training', desc: 'Attend classroom instruction and hands-on lab sessions.' },
    { title: 'Take Certification Exam', desc: 'Sit for the NHA CPT exam on campus.' },
  ],

  faqs: [
    { question: 'How much does the Phlebotomy program cost?', answer: 'The program costs $1,499. Payment plans and BNPL options are available. This includes tuition, textbooks, supplies, CPR certification, and NHA CPT exam fee.' },
    { question: 'Do I need prior healthcare experience?', answer: 'No prior experience required. This program is designed for beginners. A high school diploma or GED is recommended.' },
    { question: 'How long is the program?', answer: 'The program is 4 weeks long with 120 hours of training. Classes meet Monday through Friday, 8:00 AM to 2:30 PM.' },
    { question: 'What will I learn?', answer: 'You will learn venipuncture techniques, capillary puncture, specimen labeling and handling, infection control, patient communication, and OSHA safety standards.' },
    { question: 'Is certification included?', answer: 'Yes. The program fee includes NHA CPT exam prep and one exam attempt. You will also receive CPR/BLS certification.' },
    { question: 'Can I get a job right after certification?', answer: 'Yes. Phlebotomists are in high demand at hospitals, diagnostic labs, blood donation centers, and physician offices. Our career services team will connect you with hiring employers.' },
    { question: 'What if I cannot afford the full cost upfront?', answer: 'We offer monthly payment plans. You can also use Buy Now, Pay Later options through Affirm or Klarna at checkout.' },
    { question: 'Do you offer financing?', answer: 'Yes! We partner with Affirm to offer 0% APR financing for qualified applicants. You can spread payments over 6, 12, or 18 months.' },
  ],

  applyHref: '/apply?program=phlebotomy',

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Phlebotomy Technician' },
  ],
};

export default function PhlebotomyPage() {
  return (
    <main className="min-h-screen bg-white">
      <ProgramStructuredData config={config} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-700/50 rounded-full text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                NHA CPT Exam Prep Included
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Phlebotomy Technician
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 mb-8">
                120 hours of training. NHA certification included. Start your healthcare career in just 4 weeks.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Clock className="w-6 h-6 mb-2 text-brand-orange-400" />
                  <div className="text-2xl font-bold">4 weeks</div>
                  <div className="text-sm text-blue-200">Duration</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Clock className="w-6 h-6 mb-2 text-brand-orange-400" />
                  <div className="text-2xl font-bold">120 hrs</div>
                  <div className="text-sm text-blue-200">Training</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Award className="w-6 h-6 mb-2 text-brand-orange-400" />
                  <div className="text-2xl font-bold">NHA</div>
                  <div className="text-sm text-blue-200">CPT Cert</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <DollarSign className="w-6 h-6 mb-2 text-brand-orange-400" />
                  <div className="text-2xl font-bold">BNPL</div>
                  <div className="text-sm text-blue-200">Available</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply?program=phlebotomy"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold rounded-xl text-lg transition-colors"
                >
                  Apply Now — $1,499
                </Link>
                <Link
                  href="/programs/healthcare"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition-colors border border-white/20"
                >
                  View All Healthcare Programs
                </Link>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/pages/phlebotomy-real.webp"
                  alt="Phlebotomy student practicing venipuncture technique"
                  width={600}
                  height={450}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/60 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white text-brand-blue-900 px-6 py-3 rounded-xl shadow-lg font-bold">
                <div className="text-sm text-gray-600">Payment Plans</div>
                <div className="text-xl">Starting at $125/mo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What You'll Learn</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive training covering all aspects of phlebotomy practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Venipuncture techniques (needle draw, butterfly, evacuated tubes)',
              'Capillary puncture for finger and heel sticks',
              'Specimen labeling, handling, and transport',
              'Infection control and OSHA safety standards',
              'Patient communication and specimen anxiety management',
              'Bloodborne pathogens exposure prevention',
              'Quality control and specimen rejection criteria',
              'Medical terminology and anatomy basics',
              'Laboratory equipment operation',
              'Legal and ethical considerations in phlebotomy',
              'EKG basics for healthcare settings',
              'Professional development and career skills',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Modules */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Program Curriculum</h2>
            <p className="text-xl text-gray-600">10 comprehensive modules covering all phlebotomy competencies</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { module: 'Module 1', title: 'Foundations of Phlebotomy', hours: '12 hours' },
              { module: 'Module 2', title: 'Safety and Infection Control', hours: '10 hours' },
              { module: 'Module 3', title: 'Legal Issues in Phlebotomy', hours: '8 hours' },
              { module: 'Module 4', title: 'Anatomy and Physiology', hours: '12 hours' },
              { module: 'Module 5', title: 'Blood Collection Equipment', hours: '10 hours' },
              { module: 'Module 6', title: 'Venipuncture Techniques', hours: '16 hours' },
              { module: 'Module 7', title: 'Capillary Puncture', hours: '10 hours' },
              { module: 'Module 8', title: 'Specimen Handling and Processing', hours: '12 hours' },
              { module: 'Module 9', title: 'Complications and Error Prevention', hours: '10 hours' },
              { module: 'Module 10', title: 'Professional Development', hours: '20 hours' },
            ].map((mod, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-brand-blue-300 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center font-bold text-brand-blue-700">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">{mod.module}</div>
                  <div className="font-semibold text-gray-900">{mod.title}</div>
                </div>
                <div className="text-sm text-gray-500">{mod.hours}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24 bg-brand-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything Included</h2>
            <p className="text-xl text-blue-200">One simple price covers your entire phlebotomy training</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📚', title: 'Course Materials', desc: 'Textbooks, workbooks, and digital resources' },
              { icon: '🧪', title: 'Lab Supplies', desc: 'Practice arms, needles, tubes, and equipment' },
              { icon: '🏆', title: 'NHA CPT Exam', desc: 'One exam attempt included' },
              { icon: '❤️', title: 'CPR Certification', desc: 'BLS for Healthcare Providers' },
              { icon: '💊', title: 'Bloodborne Pathogens', desc: 'OSHA-compliant training certificate' },
              { icon: '👩‍⚕️', title: 'Clinical Skills Lab', desc: 'Hands-on venipuncture practice' },
              { icon: '📱', title: 'LMS Access', desc: 'Online learning platform for 1 year' },
              { icon: '🤝', title: 'Career Support', desc: 'Job placement assistance' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="font-bold mb-1">{item.title}</div>
                <div className="text-sm text-blue-200">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Payment Options</h2>
            <p className="text-xl text-gray-600">Start your career without financial stress</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
              <div className="text-sm font-semibold text-green-700 mb-2">BEST VALUE</div>
              <h3 className="text-2xl font-bold mb-2">Pay in Full</h3>
              <div className="text-4xl font-bold text-green-700 mb-4">$1,499</div>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Save on interest</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> No financing fees</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Immediate access</li>
              </ul>
            </div>

            <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Monthly Plan</h3>
              <div className="text-4xl font-bold text-brand-blue-700 mb-4">$125<span className="text-lg font-normal">/mo</span></div>
              <div className="text-sm text-gray-500 mb-4">12 monthly payments</div>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-blue-600" /> No credit check</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-blue-600" /> Flexible payments</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-blue-600" /> Start immediately</li>
              </ul>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Buy Now, Pay Later</h3>
              <div className="text-4xl font-bold text-orange-600 mb-4">$124<span className="text-lg font-normal">/mo</span></div>
              <div className="text-sm text-gray-500 mb-4">12 months, 0% APR</div>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-600" /> Affirm financing</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-600" /> Instant approval</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-600" /> Easy checkout</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Career Opportunities</h2>
            <p className="text-xl text-gray-600">Phlebotomists are in high demand across healthcare settings</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Hospital Labs', salary: '$34,000–$44,000' },
              { title: 'Diagnostic Labs', salary: '$32,000–$42,000' },
              { title: 'Blood Donation Centers', salary: '$30,000–$40,000' },
              { title: 'Physician Offices', salary: '$32,000–$42,000' },
              { title: 'Urgent Care Centers', salary: '$33,000–$43,000' },
              { title: 'Home Health Agencies', salary: '$30,000–$40,000' },
              { title: 'Nursing Homes', salary: '$29,000–$39,000' },
              { title: 'Research Facilities', salary: '$35,000–$45,000' },
            ].map((career, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{career.title}</h3>
                <div className="text-brand-blue-600 font-bold">{career.salary}</div>
                <div className="text-sm text-gray-500">Starting salary range</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-brand-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Phlebotomy Career?</h2>
          <p className="text-xl mb-8 text-orange-100">
            Apply today and be working in healthcare in just 4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=phlebotomy"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-orange-600 font-bold rounded-xl text-lg hover:bg-orange-50 transition-colors"
            >
              Apply Now — $1,499
            </Link>
            <a
              href="tel:+13175551234"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-600 text-white font-semibold rounded-xl text-lg hover:bg-brand-orange-700 transition-colors"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call (317) 555-1234
            </a>
          </div>
        </div>
      </section>

      {/* ProgramPageLayout handles rest of page */}
      <ProgramPageLayout config={config} />
    </main>
  );
}