import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, BookOpen } from 'lucide-react';
import GroupDiscussions from '@/components/lms/GroupDiscussions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Healthcare Professionals | Groups | LMS | Elevate For Humanity',
  description: 'Connect with nurses, CNAs, medical assistants, and healthcare workers. Share clinical tips, certification advice, and career support.',
};

export default async function GroupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/social/groups/healthcare');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Groups', href: '/lms/social/groups' },
            { label: 'Healthcare Professionals' },
          ]} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-red-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <Heart className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Healthcare Professionals</h1>
              <p className="text-white/80 mt-2 max-w-xl">Connect with nurses, CNAs, medical assistants, and healthcare workers. Share clinical tips, certification advice, and career support.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Discussions</h2>
            <GroupDiscussions groupSlug="healthcare" accentClass="bg-brand-red-600 hover:bg-brand-red-700" />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Group Resources</h3>
              <div className="space-y-3">
                <Link href="/programs/cna" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <div><div className="font-medium text-slate-900 text-sm">Certification Guides</div><div className="text-xs text-slate-700">CNA, MA, Phlebotomy prep</div></div>
                </Link>
                <Link href="/career-services" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <div><div className="font-medium text-slate-900 text-sm">Clinical Tips</div><div className="text-xs text-slate-700">Best practices from the field</div></div>
                </Link>
                <Link href="/employer" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <div><div className="font-medium text-slate-900 text-sm">Job Placement</div><div className="text-xs text-slate-700">Healthcare employer connections</div></div>
                </Link>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Related Groups</h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/career" className="block p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"><div className="font-medium text-slate-900 text-sm">Career Changers</div></Link>
                <Link href="/lms/social/groups/trades" className="block p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"><div className="font-medium text-slate-900 text-sm">Skilled Trades Network</div></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
