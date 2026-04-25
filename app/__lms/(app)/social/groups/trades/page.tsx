import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wrench, BookOpen } from 'lucide-react';
import GroupDiscussions from '@/components/lms/GroupDiscussions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Skilled Trades Network | Groups | LMS | Elevate For Humanity',
  description: 'Connect with electricians, plumbers, HVAC techs, and construction professionals. Share tips, job leads, and industry knowledge.',
};

export default async function GroupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/social/groups/trades');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Groups', href: '/lms/social/groups' },
            { label: 'Skilled Trades Network' },
          ]} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-orange-600 to-yellow-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wrench className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Skilled Trades Network</h1>
              <p className="text-white/80 mt-2 max-w-xl">Connect with electricians, plumbers, HVAC techs, and construction professionals. Share tips, job leads, and industry knowledge.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Discussions</h2>
            <GroupDiscussions groupSlug="trades" accentClass="bg-brand-orange-600 hover:bg-brand-orange-700" />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Group Resources</h3>
              <div className="space-y-3">
                <Link href="/programs/skilled-trades" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <div><div className="font-medium text-slate-900 text-sm">Apprenticeship Guide</div><div className="text-xs text-slate-700">How to start your trade career</div></div>
                </Link>
                <Link href="/lms/dashboard" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <div><div className="font-medium text-slate-900 text-sm">Tool Reviews</div><div className="text-xs text-slate-700">Community-recommended tools</div></div>
                </Link>
                <Link href="/employer" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <div><div className="font-medium text-slate-900 text-sm">Job Board</div><div className="text-xs text-slate-700">Local trade job listings</div></div>
                </Link>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Related Groups</h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/career" className="block p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"><div className="font-medium text-slate-900 text-sm">Career Changers</div></Link>
                <Link href="/lms/social/groups/healthcare" className="block p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"><div className="font-medium text-slate-900 text-sm">Healthcare Professionals</div></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
