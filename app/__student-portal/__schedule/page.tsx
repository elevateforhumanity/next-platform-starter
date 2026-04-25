import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Video,
  Building2,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Schedule | Student Portal',
  description: 'View your class schedule and upcoming sessions.',
  robots: { index: false, follow: false },
};

type ActiveEnrollment = {
  id: string;
  status: string;
  cohort_id: string | null;
  program_title: string | null;
  delivery_mode: string | null;
  source: string;
};

type CohortSession = {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  modality: string | null;
  location: string | null;
  instructor_name: string | null;
  notes: string | null;
  cohort_name: string | null;
  program_title: string | null;
};

type Appointment = {
  id: string;
  title: string;
  scheduled_at: string;
  location: string | null;
  status: string;
};

export default async function StudentPortalSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/student-portal/schedule');
  }

  // 1. training_enrollments (legacy + HVAC)
  const { data: trainingEnrollments } = await supabase
    .from('training_enrollments')
    .select('id, status, cohort_id, program_id, course:training_courses(course_name, delivery_mode), program:programs(title)')
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress']);

  // 2. program_enrollments (canonical — all new students)
  const { data: programEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, status, cohort_id, program:programs(title, delivery_method)')
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress', 'pending']);

  // 3. student_enrollments (barber apprenticeship)
  const { data: studentEnrollments } = await supabase
    .from('student_enrollments')
    .select('id, status, cohort_id, program_slug')
    .eq('student_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress']);

  const activeEnrollments: ActiveEnrollment[] = [
    ...(trainingEnrollments ?? []).map((e: any) => ({
      id: e.id,
      status: e.status,
      cohort_id: e.cohort_id ?? null,
      program_title: e.program?.title ?? e.course?.course_name ?? null,
      delivery_mode: e.course?.delivery_mode ?? null,
      source: 'training',
    })),
    ...(programEnrollments ?? []).map((e: any) => ({
      id: e.id,
      status: e.status,
      cohort_id: e.cohort_id ?? null,
      program_title: e.program?.title ?? null,
      delivery_mode: e.program?.delivery_method ?? null,
      source: 'program',
    })),
    ...(studentEnrollments ?? []).map((e: any) => ({
      id: e.id,
      status: e.status,
      cohort_id: e.cohort_id ?? null,
      program_title: e.program_slug
        ? e.program_slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : null,
      delivery_mode: 'hybrid',
      source: 'student',
    })),
  ];

  // 4. Cohort sessions
  const cohortIds = activeEnrollments.map(e => e.cohort_id).filter((id): id is string => !!id);

  let cohortSessions: CohortSession[] = [];
  if (cohortIds.length > 0) {
    const { data: sessions } = await supabase
      .from('cohort_sessions')
      .select('id, session_date, start_time, end_time, modality, location, instructor_name, notes, cohort:cohorts(name, program:programs(title))')
      .in('cohort_id', cohortIds)
      .gte('session_date', new Date().toISOString().split('T')[0])
      .order('session_date', { ascending: true })
      .limit(20);

    cohortSessions = (sessions ?? []).map((s: any) => ({
      id: s.id,
      session_date: s.session_date,
      start_time: s.start_time,
      end_time: s.end_time,
      modality: s.modality,
      location: s.location,
      instructor_name: s.instructor_name,
      notes: s.notes,
      cohort_name: s.cohort?.name ?? null,
      program_title: s.cohort?.program?.title ?? null,
    }));
  }

  // 5. CRM appointments
  const { data: appointmentsRaw } = await supabase
    .from('crm_appointments')
    .select('id, title, scheduled_at, location, status, appointment_type')
    .eq('contact_id', user.id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10);

  const upcomingAppointments: Appointment[] = appointmentsRaw ?? [];

  const formatTime = (t: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const modalityIcon = (m: string | null) => {
    if (m === 'virtual') return <Video className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />;
    if (m === 'in_person') return <MapPin className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />;
    return <Layers className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] min-h-[320px] overflow-hidden">
        <Image src="/images/pages/student-portal-page-10.jpg" alt="Class schedule" fill sizes="100vw" className="object-cover opacity-50" priority />
      </section>

      <section className="pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Student Portal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">My Schedule</h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl">
            Your active programs, upcoming class sessions, and appointments in one place.
          </p>
        </div>
      </section>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Portal', href: '/student-portal' }, { label: 'Schedule' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Active Programs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Active Programs</h2>
              <p className="text-sm text-slate-700">Your currently enrolled programs</p>
            </div>
          </div>

          {activeEnrollments.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
              <div className="relative h-56 sm:h-72">
                <Image src="/images/pages/student-portal-page-3.jpg" alt="Browse programs" fill sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-white/65" />
                <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                  <BookOpen className="w-12 h-12 text-slate-400 mb-3" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No active enrollments</h3>
                  <p className="text-slate-600 text-sm mb-5 max-w-sm">Enroll in a program to see your schedule here.</p>
                  <Link href="/lms/programs" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors">
                    Browse Programs <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {activeEnrollments.map((enrollment) => (
                <div key={`${enrollment.source}-${enrollment.id}`} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-36 overflow-hidden">
                    <Image src="/images/pages/student-portal-page-4.jpg" alt={enrollment.program_title ?? 'Program'} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-base leading-tight">{enrollment.program_title ?? 'Program'}</h3>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${enrollment.status === 'active' ? 'bg-brand-green-500 text-white' : 'bg-brand-blue-500 text-white'}`}>
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {enrollment.delivery_mode && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        {enrollment.delivery_mode === 'online' || enrollment.delivery_mode === 'virtual'
                          ? <Video className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                          : <Building2 className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />}
                        <span className="capitalize">{enrollment.delivery_mode.replace('_', ' ')}</span>
                      </div>
                    )}
                    {enrollment.cohort_id
                      ? <p className="text-xs text-brand-green-600 font-medium">Cohort sessions scheduled — see below</p>
                      : <p className="text-xs text-slate-400 italic">No cohort assigned yet — contact student services for schedule details.</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Cohort Sessions */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upcoming Class Sessions</h2>
              <p className="text-sm text-slate-700">Scheduled sessions for your cohort</p>
            </div>
          </div>

          {cohortSessions.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No upcoming sessions</h3>
              <p className="text-sm text-slate-500">
                {cohortIds.length === 0
                  ? 'You are not assigned to a cohort yet. Contact student services.'
                  : 'No sessions are scheduled yet. Check back soon.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cohortSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 text-center bg-brand-blue-50 rounded-xl p-2 border border-brand-blue-100">
                      <p className="text-xs font-bold text-brand-blue-600 uppercase">
                        {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-extrabold text-brand-blue-800 leading-none">
                        {new Date(session.session_date + 'T00:00:00').getDate()}
                      </p>
                      <p className="text-xs text-brand-blue-500">
                        {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-semibold text-slate-900">{session.program_title ?? session.cohort_name ?? 'Class Session'}</p>
                      {(session.start_time || session.end_time) && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Clock className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                          <span>{formatTime(session.start_time)}{session.end_time ? ` – ${formatTime(session.end_time)}` : ''}</span>
                        </div>
                      )}
                      {session.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          {modalityIcon(session.modality)}
                          <span>{session.location}</span>
                        </div>
                      )}
                      {session.instructor_name && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                          <span>{session.instructor_name}</span>
                        </div>
                      )}
                      {session.notes && <p className="text-xs text-slate-500 mt-1">{session.notes}</p>}
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      session.modality === 'virtual' ? 'bg-brand-blue-100 text-brand-blue-700'
                      : session.modality === 'in_person' ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                      {session.modality?.replace('_', ' ') ?? 'hybrid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upcoming Appointments</h2>
              <p className="text-sm text-slate-700">Advising sessions, orientations, and scheduled meetings</p>
            </div>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
              <div className="relative h-56 sm:h-72">
                <Image src="/images/pages/student-portal-page-5.jpg" alt="Schedule an appointment" fill sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-white/65" />
                <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                  <Calendar className="w-12 h-12 text-slate-400 mb-3" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming appointments</h3>
                  <p className="text-slate-600 text-sm mb-5 max-w-sm">Need to speak with an advisor? Reach out to student services.</p>
                  <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-orange-600 transition-colors">
                    Contact Student Services <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-5">
                  <div className="flex-shrink-0 w-14 text-center bg-brand-orange-50 rounded-xl p-2 border border-brand-orange-100">
                    <p className="text-xs font-bold text-brand-orange-600 uppercase">
                      {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-2xl font-extrabold text-brand-orange-800 leading-none">
                      {new Date(apt.scheduled_at).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{apt.title}</p>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {new Date(apt.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
                      {new Date(apt.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {apt.location && (
                      <p className="text-sm text-slate-700 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {apt.location}
                      </p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    apt.status === 'confirmed' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {apt.status === 'confirmed'
                      ? <><CheckCircle className="w-3 h-3" /> Confirmed</>
                      : <><AlertCircle className="w-3 h-3" /> Pending</>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Training Location */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Training Location</h2>
              <p className="text-sm text-slate-700">Elevate for Humanity main training center</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="relative h-56 md:h-auto min-h-[220px]">
                <Image src="/images/pages/student-portal-page-8.jpg" alt="Training center" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Elevate for Humanity Career &amp; Technical Institute</h3>
                <div className="flex items-start gap-3 text-sm text-slate-900">
                  <MapPin className="w-4 h-4 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">8888 Keystone Crossing, Suite 1300</p>
                    <p>Indianapolis, IN 46240</p>
                    <p className="text-slate-500 text-xs mt-1">Appointment-only. Confirm your session before arriving.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-900">
                  <Clock className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                  <span>Mon–Fri, 9:00 AM – 5:00 PM EST</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-900">
                  <Phone className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                  <a href="tel:+13173143757" className="hover:text-brand-blue-600 transition-colors">(317) 314-3757</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-900">
                  <Mail className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                  <a href="mailto:info@elevateforhumanity.org" className="hover:text-brand-blue-600 transition-colors">info@elevateforhumanity.org</a>
                </div>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors w-fit">
                  Contact Student Services <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-5">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'My Courses', href: '/lms/courses', img: '/images/pages/student-portal-page-1.jpg' },
              { label: 'Grades & Progress', href: '/student-portal/grades', img: '/images/pages/student-portal-page-2.jpg' },
              { label: 'Documents', href: '/student-portal/onboarding/documents', img: '/images/pages/student-portal-page-6.jpg' },
              { label: 'Contact Support', href: '/contact', img: '/images/pages/student-portal-page-9.jpg' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="group relative rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <div className="relative h-28">
                  <Image src={link.img} alt={link.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-slate-900/40 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center px-2">
                    <span className="text-white font-bold text-sm text-center leading-tight">{link.label}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
