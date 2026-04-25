import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, Flower2, BookOpen, Clock, Phone, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrolled | Professional Esthetician Program | Elevate for Humanity',
  description: 'Your enrollment in the Professional Esthetician program is confirmed.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/programs/professional-esthetician/enrollment-success');

  let { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment && user.email) {
    const { data: emailMatch } = await supabase
      .from('program_enrollments')
      .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
      .ilike('email', user.email.toLowerCase().trim())
      .is('user_id', null)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (emailMatch) {
      await supabase.from('program_enrollments').update({ user_id: user.id }).eq('id', emailMatch.id);
      enrollment = { ...emailMatch, user_id: user.id };
    }
  }

  if (!enrollment) redirect('/programs/professional-esthetician');

  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase.from('program_enrollments')
      .update({ status: 'confirmed', enrollment_confirmed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
  }

  const programName = (enrollment.programs as { name?: string })?.name || 'Professional Esthetician';
  const enrolledDate = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
  const daysUntilMonday = (8 - enrolledDate.getDay()) % 7 || 7;
  const startDate = new Date(enrolledDate);
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Flower2 className="w-12 h-12 text-white" />
          </div>
          <p className="text-rose-400 font-bold text-sm uppercase tracking-widest mb-2">Professional Certification Program</p>
          <h1 className="text-4xl font-black text-white mb-2">You're officially enrolled.</h1>
          <p className="text-slate-400">Welcome to the Professional Esthetician program.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-rose-500 px-6 py-3">
            <p className="text-white font-bold text-sm">Enrollment Confirmation</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Program</span>
              <span className="font-bold text-slate-900">{programName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />Active
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Classes Begin</span>
              <span className="font-bold text-slate-900">{formattedStartDate}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Training Hours</span>
              <span className="font-bold text-slate-900">700 hours</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Credential</span>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-slate-900">Indiana Esthetician License</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <p className="text-white font-bold mb-4">Your next steps</p>
          <div className="space-y-3">
            {[
              { n: 1, title: 'Complete your online coursework', desc: 'Theory, skin anatomy, and treatment protocols — access via your learner dashboard' },
              { n: 2, title: 'Complete 700 hands-on training hours', desc: 'At your approved training site — log hours weekly' },
              { n: 3, title: 'Schedule your Indiana State Board Exam', desc: 'Written + practical exam through PLA — we help you prepare' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{n}</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/learner/dashboard" className="block w-full bg-rose-500 hover:bg-rose-600 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg mb-3">
          Access Your Coursework →
        </Link>
        <a
          href="https://www.in.gov/pla/professions/cosmetology-esthetics-and-related-professions/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white text-center py-4 rounded-xl font-bold transition-all mb-6"
        >
          <ExternalLink className="w-4 h-4" />Indiana PLA — Esthetician Licensing
        </a>

        <div className="text-center space-y-1">
          <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />Questions? Mon–Fri 9am–5pm ET
          </p>
          <a href="tel:317-314-3757" className="text-rose-400 hover:underline text-sm flex items-center justify-center gap-1">
            <Phone className="w-3 h-3" />317-314-3757
          </a>
        </div>
      </div>
    </div>
  );
}
