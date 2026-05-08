import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { User, Bell, Shield, ArrowRight, HelpCircle, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Elevate for Humanity',
  description: 'Manage your account settings.',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">
            Manage your profile, notifications, and account preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Controls</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/profile/edit"
                className="rounded-lg border border-slate-200 p-4 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <p className="mt-3 font-medium text-slate-900">Edit Profile</p>
                <p className="text-sm text-slate-600 mt-1">Update name, contact, and personal info.</p>
              </Link>

              <Link
                href="/settings"
                className="rounded-lg border border-slate-200 p-4 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue-600">
                  <Bell className="w-4 h-4" />
                </div>
                <p className="mt-3 font-medium text-slate-900">Notifications</p>
                <p className="text-sm text-slate-600 mt-1">
                  Manage email and communication preferences.
                </p>
              </Link>

              <Link
                href="/settings"
                className="rounded-lg border border-slate-200 p-4 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue-600">
                  <Shield className="w-4 h-4" />
                </div>
                <p className="mt-3 font-medium text-slate-900">Security</p>
                <p className="text-sm text-slate-600 mt-1">
                  Review password and account protection settings.
                </p>
              </Link>

              <Link
                href="/legal/student-handbook"
                className="rounded-lg border border-slate-200 p-4 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="mt-3 font-medium text-slate-900">Policies</p>
                <p className="text-sm text-slate-600 mt-1">
                  View handbook and learner policy documents.
                </p>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Account Summary</h2>
            <p className="text-sm text-slate-600">
              Signed in as <span className="font-semibold text-slate-900">{profile?.full_name || user.email}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Role: {profile?.role || 'student'}</p>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Need help with account setup?</p>
              <p className="text-xs text-slate-600 mt-1">
                Our support team can help with profile access, notifications, and portal issues.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 mt-3 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                Contact Support
              </Link>
            </div>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1 mt-5 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
            >
              Open Full Settings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
