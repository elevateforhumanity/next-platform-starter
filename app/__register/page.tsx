import type { Metadata } from 'next';
import Link from 'next/link';
import SignupForm from '@/app/signup/SignupForm';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Register | Create Account | Elevate for Humanity',
  description: 'Create your free Elevate for Humanity account to access career training programs, track your progress, and connect with career services.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/register' },
};

export default async function RegisterPage() {
  const supabase = await createClient();

  let signupsEnabled = true;
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'signup_enabled')
      .maybeSingle();
    if (settings?.value === 'false') signupsEnabled = false;
  } catch {
    // default to enabled
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Create Your Account</h1>
        <p className="mt-2 text-slate-600">
          Students, staff, program partners, and employers all sign up here. Select your role when registering.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Your account gives you access to</h2>
          <ul className="list-disc pl-5 text-slate-700 space-y-2 text-sm">
            <li><strong>Students</strong> — apply, track progress, upload documents, access your learning portal</li>
            <li><strong>Staff &amp; Employees</strong> — complete onboarding, set up payroll, access staff tools</li>
            <li><strong>Program Partners &amp; Instructors</strong> — manage cohorts, track students, access partner portal</li>
            <li><strong>Employers</strong> — post jobs, hire graduates, access WOTC and OJT tools</li>
          </ul>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {signupsEnabled ? (
            <SignupForm />
          ) : (
            <p className="text-slate-600 text-sm">
              New account registration is temporarily paused. Contact{' '}
              <a href="mailto:info@elevateforhumanity.org" className="underline">info@elevateforhumanity.org</a>{' '}
              to request access.
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
          <Link href="/login" className="underline hover:text-brand-blue-600">Already have an account? Log in</Link>
          <Link href="/start" className="underline hover:text-brand-blue-600">Not ready? Apply first</Link>
          <Link href="/privacy-policy" className="underline hover:text-brand-blue-600">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
