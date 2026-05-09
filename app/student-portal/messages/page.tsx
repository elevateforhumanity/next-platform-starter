import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Inbox, Send, Archive, ArrowRight, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Messages | Elevate for Humanity',
  description: 'View your messages.',
};

export const dynamic = 'force-dynamic';
const MESSAGES_BASE = '/messages';

export default async function Page() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
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

  const { data: conversations, count } = await supabase
    .from('direct_message_conversations')
    .select('id, last_message_at, last_message_preview', { count: 'exact' })
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600 mt-2">
            Stay connected with advisors, instructors, and support.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Conversations</h2>
              <Link
                href={MESSAGES_BASE}
                className="inline-flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                Open Inbox <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={MESSAGES_BASE}
                    className="block rounded-lg border border-slate-200 p-4 hover:border-brand-blue-300 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {conversation.last_message_preview || 'Open conversation'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {conversation.last_message_at
                        ? new Date(conversation.last_message_at).toLocaleString()
                        : 'No timestamp'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-medium">No conversations yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Reach out to support or your advisor to start a conversation.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 mt-4 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  Contact Support <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Message Center</h2>
            <div className="space-y-3">
              <Link
                href={MESSAGES_BASE}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <span className="inline-flex items-center gap-2 text-slate-800">
                  <Inbox className="w-4 h-4 text-brand-blue-600" />
                  Inbox
                </span>
                <span className="text-xs text-slate-500">{count ?? 0}</span>
              </Link>
              <Link
                href={`${MESSAGES_BASE}/sent`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <span className="inline-flex items-center gap-2 text-slate-800">
                  <Send className="w-4 h-4 text-brand-blue-600" />
                  Sent
                </span>
              </Link>
              <Link
                href={`${MESSAGES_BASE}/archived`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-brand-blue-300 hover:bg-slate-50 transition"
              >
                <span className="inline-flex items-center gap-2 text-slate-800">
                  <Archive className="w-4 h-4 text-brand-blue-600" />
                  Archived
                </span>
              </Link>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-700">
                Signed in as <span className="font-semibold">{profile?.full_name || user.email}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Need urgent help? Use contact support for fastest response.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 mt-3 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
              >
                Contact Support <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
