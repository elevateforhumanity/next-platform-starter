'use client';
import { useState } from 'react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Program { id: string; title: string; slug: string }

function IntakeForm({ programs = [] }: { programs?: Program[] }) {
  const searchParams = useSafeSearchParams();
  const programParam = searchParams.get('program') || '';

  // Map legacy/alias slugs → canonical registry slugs
  const SLUG_TO_VALUE: Record<string, string> = {
    // HVAC
    hvac: 'hvac-technician',
    'hvac-tech': 'hvac-technician',
    // Barber
    barbering: 'barber-apprenticeship',
    barber: 'barber-apprenticeship',
    // CNA
    cna: 'cna',
    'cna-cert': 'cna',
    'cna-certification': 'cna',
    'certified-nursing-assistant': 'cna',
    'cna-training': 'cna',
    // CDL
    cdl: 'cdl-training',
    'cdl-class-a': 'cdl-training',
    // Phlebotomy
    phlebotomy: 'phlebotomy',
    'phlebotomy-technician': 'phlebotomy',
    // IT
    'it-support': 'it-help-desk',
    // Cybersecurity
    cybersecurity: 'cybersecurity-analyst',
    // CPR
    'cpr-first-aid-hsi': 'cpr-first-aid',
    cpr: 'cpr-first-aid',
  };
  const initialProgram = SLUG_TO_VALUE[programParam] || programParam || '';
  // Barber is a self-pay apprenticeship — simplify the form for this program
  const isBarberProgram = initialProgram === 'barber-apprenticeship';
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fundingTag, setFundingTag] = useState('');
  const [submittedProgram, setSubmittedProgram] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setSubmittedProgram((data.program_interest as string) || '');
        setSubmitted(true);
        setFundingTag(result.funding_tag || '');
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    }

    setLoading(false);
  }

  if (submitted) {
    const isBarber = submittedProgram === 'barber-apprenticeship';
    const isBarberSelfPay = isBarber && fundingTag === 'self-pay';

    // Barber self-pay: send directly to payment cart
    if (isBarberSelfPay) {
      return (
        <div className="min-h-screen bg-white">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received</h1>
            <p className="text-lg text-slate-700 mb-2">
              You&apos;re one step away from enrolling in the Barber Apprenticeship.
            </p>
            <p className="text-sm text-slate-600 mb-8">
              Set up your payment plan now to secure your spot. Takes 2 minutes.
            </p>
            <Link
              href="/programs/barber-apprenticeship/payment-setup"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Set Up Payment Plan →
            </Link>
            <p className="mt-4 text-xs text-slate-400">
              Check your email for a confirmation and your account login link.
            </p>
          </div>
        </div>
      );
    }

    // All other programs / funding paths
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-black flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received</h1>
          <p className="text-lg text-black mb-2">
            Thank you for your interest in Elevate for Humanity.
          </p>
          <p className="text-sm text-black mb-2">
            Check your email — we sent you a link to access your learner account and track your
            application status.
          </p>
          {fundingTag === 'jri' && (
            <p className="text-base text-slate-700 mb-6">
              Based on your responses, you may qualify for Job Ready Indy funding. Our team will
              review your eligibility and contact you within 2 business days.
            </p>
          )}
          {isBarber && fundingTag !== 'self-pay' && (
            <p className="text-base text-slate-700 mb-6">
              We&apos;ll review your funding eligibility for the Barber Apprenticeship and contact you within 2 business days.
              If funding isn&apos;t available, we&apos;ll walk you through payment options.
            </p>
          )}
          {!isBarber && fundingTag === 'self-pay' && (
            <p className="text-base text-slate-700 mb-6">
              We&apos;ve noted your self-pay preference. Our enrollment team will contact you with
              program details and payment options within 2 business days.
            </p>
          )}
          {(fundingTag === 'wioa' || fundingTag === 'wioa-categorical' || fundingTag === 'wioa-income' || fundingTag === 'pending-review') && !isBarber && (
            <p className="text-base text-slate-700 mb-6">
              We will review your funding eligibility and contact you within 2 business days. You
              may qualify for WIOA, WRG, or other workforce funding.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/programs"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Browse Programs
            </Link>
            <Link
              href="/"
              className="bg-white hover:bg-slate-200 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {isBarberProgram ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">Barber Apprenticeship</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Apply to Enroll</h1>
              <p className="text-slate-300 text-base">
                Takes 3–5 minutes. After submitting, you&apos;ll set up your payment plan and get access to the program.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Funding &amp; Apprenticeship Intake</h1>
              <p className="text-slate-300 text-base">
                This form screens your eligibility for workforce-funded training programs including
                WIOA, WRG, and Job Ready Indy. Funding is not guaranteed and requires partner review.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          {error && (
            <div
              className="bg-brand-red-50 border border-brand-red-200 text-brand-red-800 px-4 py-3 rounded-lg mb-6"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    required
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date_of_birth"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Date of Birth *
                    </label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      required
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="county"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      County of Residence *
                    </label>
                    <input
                      id="county"
                      name="county"
                      required
                      placeholder="e.g. Marion, Hamilton"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      defaultValue="IN"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Program Interest */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Program Interest</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="program_interest"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Which program are you interested in?
                  </label>
                  <select
                    id="program_interest"
                    name="program_interest"
                    defaultValue={initialProgram || 'barber-apprenticeship'}
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.slug}>{p.title}</option>
                    ))}
                    <optgroup label="External Pathways (Google / Microsoft)">
                      <option value="google-it-support">Google IT Support Certificate</option>
                      <option value="google-cybersecurity">Google Cybersecurity Certificate</option>
                      <option value="google-data-analytics">Google Data Analytics Certificate</option>
                      <option value="google-project-management">Google Project Management Certificate</option>
                      <option value="microsoft-azure-fundamentals">Microsoft Azure Fundamentals (AZ-900)</option>
                      <option value="microsoft-365-fundamentals">Microsoft 365 Fundamentals (MS-900)</option>
                    </optgroup>
                    <option value="other">Other / Not Listed</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="preferred_location"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Preferred Training Location
                  </label>
                  <input
                    id="preferred_location"
                    name="preferred_location"
                    placeholder="e.g. Indianapolis, Kokomo"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Funding Eligibility */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Funding Eligibility</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="employment_status"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Current Employment Status
                  </label>
                  <select
                    id="employment_status"
                    name="employment_status"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Select...</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="part-time">Part-Time Employed</option>
                    <option value="full-time">Full-Time Employed</option>
                    <option value="self-employed">Self-Employed / Business Owner</option>
                    <option value="independent-contractor">Independent Contractor / 1099</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                {/* Barber is self-pay — hide the funding question and default to false */}
                {isBarberProgram ? (
                  <input type="hidden" name="funding_needed" value="false" />
                ) : (
                  <div>
                    <label
                      htmlFor="funding_needed"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Do you need funding assistance?
                    </label>
                    <select
                      id="funding_needed"
                      name="funding_needed"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="true">Yes, I need funding assistance</option>
                      <option value="false">No, I can self-pay</option>
                    </select>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="probation_or_reentry"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Are you connected to probation, reentry, or community corrections?
                  </label>
                  <select
                    id="probation_or_reentry"
                    name="probation_or_reentry"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {/* WIOA income/benefits/barriers — not relevant for barber self-pay */}
                {!isBarberProgram && <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="household_size"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Household Size
                    </label>
                    <select
                      id="household_size"
                      name="household_size"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="">Select...</option>
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n}{n === 8 ? '+' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="annual_income"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Annual Household Income
                    </label>
                    <select
                      id="annual_income"
                      name="annual_income"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="">Select...</option>
                      <option value="0-15000">Under $15,000</option>
                      <option value="15000-25000">$15,000 – $25,000</option>
                      <option value="25000-35000">$25,000 – $35,000</option>
                      <option value="35000-50000">$35,000 – $50,000</option>
                      <option value="50000+">Over $50,000</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="snap_recipient"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Do you receive SNAP (food stamps)?
                    </label>
                    <select
                      id="snap_recipient"
                      name="snap_recipient"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="tanf_recipient"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Do you receive TANF / cash assistance?
                    </label>
                    <select
                      id="tanf_recipient"
                      name="tanf_recipient"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                {/* WIOA eligibility fields */}
                <div>
                  <label
                    htmlFor="education_level"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Highest Education Level Completed
                  </label>
                  <select
                    id="education_level"
                    name="education_level"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Select...</option>
                    <option value="less-than-hs">Less than high school</option>
                    <option value="hs-diploma">High school diploma</option>
                    <option value="ged">GED / HiSET</option>
                    <option value="some-college">Some college (no degree)</option>
                    <option value="associates">Associate&apos;s degree</option>
                    <option value="bachelors">Bachelor&apos;s degree or higher</option>
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="work_authorization"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Authorized to work in the U.S.?
                    </label>
                    <select
                      id="work_authorization"
                      name="work_authorization"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="selective_service"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Selective Service registered? <span className="font-normal text-slate-500">(males 18–25 only)</span>
                    </label>
                    <select
                      id="selective_service"
                      name="selective_service"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="na">N/A</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
                {/* Race/ethnicity — voluntary, required for WIOA demographic reporting */}
                <div>
                  <label
                    htmlFor="ethnicity"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Race / Ethnicity <span className="font-normal text-slate-500">(voluntary — required for federal reporting)</span>
                  </label>
                  <select
                    id="ethnicity"
                    name="ethnicity"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Prefer not to answer</option>
                    <option value="hispanic-latino">Hispanic or Latino</option>
                    <option value="american-indian">American Indian or Alaska Native</option>
                    <option value="asian">Asian</option>
                    <option value="black">Black or African American</option>
                    <option value="native-hawaiian">Native Hawaiian or Other Pacific Islander</option>
                    <option value="white">White</option>
                    <option value="two-or-more">Two or more races</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Barriers to Employment (select all that apply)
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { value: 'homeless', label: 'Homeless / Housing Instability' },
                      { value: 'ex-offender', label: 'Ex-Offender / Justice-Involved' },
                      { value: 'veteran', label: 'Veteran / Military Spouse' },
                      { value: 'disability', label: 'Disability' },
                      { value: 'basic-skills', label: 'Basic Skills Deficient' },
                      { value: 'english-learner', label: 'English Language Learner' },
                      { value: 'single-parent', label: 'Single Parent' },
                      { value: 'foster-youth', label: 'Foster Youth / Aged Out' },
                      { value: 'transportation', label: 'Lack of Transportation' },
                      { value: 'childcare', label: 'Childcare Needs' },
                    ].map(b => (
                      <label key={b.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="barriers"
                          value={b.value}
                          className="rounded border-slate-300 text-brand-red-600 focus:ring-brand-red-500"
                        />
                        {b.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="workforce_connection"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Are you connected to any workforce services?
                  </label>
                  <select
                    id="workforce_connection"
                    name="workforce_connection"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">None / Not sure</option>
                    <option value="workone">WorkOne Indiana</option>
                    <option value="fssa">FSSA (Family &amp; Social Services Administration)</option>
                    <option value="employer-indy">EmployIndy</option>
                    <option value="goodwill">Goodwill</option>
                    <option value="reclaim-academy">Reclaim Academy</option>
                    <option value="other">Other workforce program</option>
                  </select>
                </div>
                </>}
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="referral_source"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    How did you hear about us?
                  </label>
                  <select
                    id="referral_source"
                    name="referral_source"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Select...</option>
                    <option value="website">Website</option>
                    <option value="social-media">Social Media</option>
                    <option value="referral">Friend / Family Referral</option>
                    <option value="workforce-partner">Workforce Partner</option>
                    <option value="probation-officer">Probation / Parole Officer</option>
                    <option value="community-event">Community Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Tell us about your goals (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-black">
              By submitting, you authorize Elevate for Humanity to review your intake for training
              and funding pathways. Final funding decisions are made by workforce partners and are
              not guaranteed. See our{' '}
              <Link href="/legal/privacy" className="text-brand-red-600 underline">
                privacy policy
              </Link>
              {' '}and{' '}
              <Link href="/impact/methodology" className="text-brand-red-600 underline">
                impact methodology
              </Link>
              .
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-400 text-white text-lg font-bold p-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  Check Eligibility & Apply <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// No Suspense boundary needed — useSafeSearchParams reads from context
// provided by SafeSearchParamsProvider in PublicLayout.
export default function IntakeFormInner({ programs = [] }: { programs?: Program[] }) {
  return <IntakeForm programs={programs} />;
}
