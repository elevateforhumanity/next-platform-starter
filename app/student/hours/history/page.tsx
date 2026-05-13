import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Clock,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hours History | Student Portal',
  description: 'View your training hours history.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function HoursHistoryPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student/hours/history');

  // Fetch real hour entries for this user
  const { data: hoursLog } = await supabase
    .from('hour_entries')
    .select('id, work_date, hours_claimed, accepted_hours, source_type, notes, status, approved_by')
    .eq('user_id', user.id)
    .order('work_date', { ascending: false })
    .limit(100);

  // Fetch enrollment to get required hours for this student's program
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
  const requiredHours = PROGRAM_REQUIRED_HOURS[programSlug] ?? 1500;

  const entries = hoursLog || [];

  const approvedHours = entries
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + (Number(e.accepted_hours) || Number(e.hours_claimed) || 0), 0);

  const pendingHours = entries
    .filter((e) => e.status === 'pending' || e.status === 'submitted')
    .reduce((sum, e) => sum + (Number(e.hours_claimed) || 0), 0);

  const progressPercent = Math.min(Math.round((approvedHours / requiredHours) * 100), 100);

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'pending' || status === 'submitted')
      return <Clock className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'text-green-600';
    if (status === 'pending' || status === 'submitted') return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/learner/dashboard" className="hover:text-slate-700">
              Student Portal
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/student/hours" className="hover:text-slate-700">
              Hours
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">History</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hours History</h1>
              <p className="text-slate-600 mt-1">Track your training hours</p>
            </div>
            <Link
              href="/student/hours/log"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Log Hours
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Hours Progress</h2>
            <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{approvedHours}</p>
              <p className="text-sm text-slate-500">Approved Hours</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingHours}</p>
              <p className="text-sm text-slate-500">Pending Hours</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-400">
                {Math.max(requiredHours - approvedHours, 0)}
              </p>
              <p className="text-sm text-slate-500">Remaining</p>
            </div>
          </div>
        </div>

        {/* Hours Log */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Hours Log</h2>
            <span className="text-sm text-slate-500">{entries.length} entries</span>
          </div>

          {entries.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No hours logged yet.</p>
              <Link
                href="/student/hours/log"
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Log your first hours
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {entries.map((entry) => {
                const hours =
                  entry.status === 'approved'
                    ? Number(entry.accepted_hours) || Number(entry.hours_claimed) || 0
                    : Number(entry.hours_claimed) || 0;
                return (
                  <div key={entry.id} className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 text-center">
                          <p className="text-lg font-bold text-slate-900">{hours}</p>
                          <p className="text-xs text-slate-500">hrs</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center gap-1 text-sm">
                              {getStatusIcon(entry.status)}
                              <span className={getStatusColor(entry.status)}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                              </span>
                            </span>
                          </div>
                          <p className="font-medium text-slate-900">
                            {entry.notes || entry.source_type?.replace(/_/g, ' ') || 'Training'}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-slate-500 mt-0.5">{entry.notes}</p>
                          )}
                          {entry.approved_by && (
                            <p className="text-sm text-slate-500 mt-1">
                              Approved by {entry.approved_by}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.work_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Hours Requirement</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your program requires {requiredHours} total hours to complete. Keep logging your
                hours regularly to track your progress toward graduation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
