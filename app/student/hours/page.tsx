import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock, Plus, Calendar, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Training Hours | Student Portal',
  description: 'Track your program hours and progress',
};

export const dynamic = 'force-dynamic';

export default async function StudentHoursPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login?redirect=/student/hours');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student/hours');

  // Fetch hour entries for this user
  const { data: hoursData } = await supabase
    .from('hour_entries')
    .select('id, work_date, hours_claimed, accepted_hours, source_type, notes, status')
    .eq('user_id', user.id)
    .order('work_date', { ascending: false })
    .limit(10);

  const entries = hoursData || [];

  // Compute totals from real data only
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let totalHours = 0;
  let thisWeekHours = 0;
  let thisMonthHours = 0;

  for (const entry of entries) {
    if (entry.status !== 'approved') continue;
    const hours = Number(entry.accepted_hours) || Number(entry.hours_claimed) || 0;
    const entryDate = new Date(entry.work_date);
    totalHours += hours;
    if (entryDate >= weekAgo) thisWeekHours += hours;
    if (entryDate >= monthAgo) thisMonthHours += hours;
  }

  // Fetch enrollment to get required hours
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_id, programs:program_id (slug)')
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled'])
    .maybeSingle();

  const PROGRAM_REQUIRED_HOURS: Record<string, number> = {
    'barber-apprenticeship': 2000,
    'cosmetology-apprenticeship': 2000,
    'esthetician-apprenticeship': 700,
    'nail-tech-apprenticeship': 450,
    'nail-technician-apprenticeship': 450,
  };
  const programSlug = (enrollment?.programs as { slug?: string } | null)?.slug ?? '';
  const requiredHours = PROGRAM_REQUIRED_HOURS[programSlug] ?? 500;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/learner/dashboard" className="hover:text-blue-600">
              Student Portal
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-medium">Hours</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Training Hours</h1>
            <p className="text-slate-600">Track your program hours and progress</p>
          </div>
          <Link
            href="/student/hours/log"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Hours
          </Link>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Progress Overview</h2>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-slate-600">Total Hours Completed</span>
              <span className="font-bold text-slate-900">
                {totalHours} / {requiredHours} hours
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalHours / requiredHours) * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {Math.round((totalHours / requiredHours) * 100)}% complete &bull;{' '}
              {Math.max(requiredHours - totalHours, 0)} hours remaining
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{thisWeekHours}</p>
              <p className="text-sm text-slate-600">This Week</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{thisMonthHours}</p>
              <p className="text-sm text-slate-600">This Month</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{totalHours}</p>
              <p className="text-sm text-slate-600">Total Hours</p>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Hour Logs</h2>
            <Link
              href="/student/hours/history"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {entries.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {entries.map((entry) => {
                const hours =
                  entry.status === 'approved'
                    ? Number(entry.accepted_hours) || Number(entry.hours_claimed) || 0
                    : Number(entry.hours_claimed) || 0;
                return (
                  <div
                    key={entry.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.notes || entry.source_type?.replace(/_/g, ' ') || 'Training'}
                        </p>
                        <p className="text-sm text-slate-600">{formatDate(entry.work_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900">{hours} hrs</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded flex items-center ${
                          entry.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : entry.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {entry.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {(entry.status === 'pending' || entry.status === 'submitted') && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No hours logged yet</p>
              <Link
                href="/student/hours/log"
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Log your first hours
              </Link>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-slate-900 mb-3">Tips for Tracking Hours</h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              Log your hours daily to ensure accuracy
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              Include detailed notes about your activities
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              Hours must be approved by your instructor to count toward completion
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
