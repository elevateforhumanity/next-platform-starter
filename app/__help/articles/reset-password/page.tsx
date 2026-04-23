import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, ChevronRight, Mail, Shield, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reset Your Password | Help Center | Elevate for Humanity',
  description: 'Step-by-step instructions for resetting your Elevate for Humanity account password.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/reset-password' },
};

const STEPS = [
  { step: '1', title: 'Go to the login page', desc: 'Visit elevateforhumanity.org/login or click "Sign In" in the top navigation.' },
  { step: '2', title: 'Click "Forgot password?"', desc: 'The link is below the password field on the login form.' },
  { step: '3', title: 'Enter your email address', desc: 'Use the email address you registered with. If you are unsure which email you used, try all addresses you own.' },
  { step: '4', title: 'Check your inbox', desc: 'You will receive a password reset email within a few minutes. Check your spam folder if it does not arrive.' },
  { step: '5', title: 'Click the reset link', desc: 'The link in the email is valid for 1 hour. Click it to open the password reset form.' },
  { step: '6', title: 'Set a new password', desc: 'Choose a password at least 8 characters long with a mix of letters, numbers, and symbols. Confirm it and click Save.' },
];

const FAQS = [
  { q: 'I did not receive the reset email. What should I do?', a: 'First, check your spam or junk folder. If it is not there, wait 5 minutes and try again. Make sure you are using the email address you registered with. If the problem persists, contact support.' },
  { q: 'The reset link says it has expired. What now?', a: 'Reset links expire after 1 hour. Go back to the login page, click "Forgot password?" again, and request a new link.' },
  { q: 'I do not remember which email I used to sign up.', a: 'Try all email addresses you own. If you still cannot find it, contact support at support@elevateforhumanity.org with your full name and we will look up your account.' },
  { q: 'I reset my password but still cannot log in.', a: 'Make sure you are using the new password, not the old one. Clear your browser cache and try again. If the issue continues, contact support.' },
  { q: 'Can I change my password without resetting it?', a: 'Yes. Log in to your account, go to Account Settings, and click "Change Password." You will need to enter your current password to confirm.' },
  { q: 'My account is locked. How do I unlock it?', a: 'Accounts are temporarily locked after 5 failed login attempts. Wait 15 minutes and try again, or use the password reset flow to set a new password and unlock immediately.' },
];

export default function ResetPasswordHelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Link href="/help" className="hover:text-slate-700">Help Center</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/help/articles" className="hover:text-slate-700">Articles</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">Reset Password</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-slate-600" />
          </div>
          <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">Account & Security</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mt-4 mb-3">Reset your password</h1>
        <p className="text-slate-600 mb-10">Follow these steps to regain access to your account. The process takes about 2 minutes.</p>

        {/* Quick action */}
        <div className="bg-slate-900 text-white rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-slate-300" />
            <div>
              <p className="font-semibold">Go straight to the reset form</p>
              <p className="text-slate-400 text-sm">We will send a reset link to your email.</p>
            </div>
          </div>
          <Link href="/forgot-password" className="bg-white text-slate-900 px-5 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm whitespace-nowrap">
            Reset Password →
          </Link>
        </div>

        {/* Steps */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Step-by-step instructions</h2>
          <div className="space-y-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 p-5 border border-slate-200 rounded-xl">
                <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{step}</div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-600 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-12 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">Security tip</p>
            <p className="text-amber-800 text-sm">Elevate staff will never ask for your password by email or phone. If you receive a suspicious message asking for your credentials, do not respond — contact support immediately.</p>
          </div>
        </div>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-slate-900 mb-1">{q}</p>
                <p className="text-slate-600 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border border-slate-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 mb-1">Still locked out?</p>
          <p className="text-slate-600 text-sm mb-4">Our support team can verify your identity and restore access manually.</p>
          <Link href="/contact" className="inline-block bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors text-sm">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
