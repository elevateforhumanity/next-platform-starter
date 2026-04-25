import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { postJobAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/post-job' },
  title: 'Post a Job | Elevate For Humanity',
  description: 'Post job opportunities for program graduates.',
};

export default async function PostJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer/post-job');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/employer" className="hover:text-slate-900">Employer</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Post Job</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Post a Job</h1>
          <p className="text-slate-700 mt-2">Create a new job posting for qualified graduates</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form action={postJobAction} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Job Title *</label>
              <input name="title" type="text" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" placeholder="e.g., HVAC Technician" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Description *</label>
              <textarea name="description" rows={5} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" placeholder="Job description and responsibilities" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Employment Type</label>
                <select name="job_type" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500">
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Location</label>
                <input name="location" type="text" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500" placeholder="City, State or Remote" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Salary Range</label>
                <input name="salary_range" type="text" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g., $18–$25/hr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Application Deadline</label>
                <input name="deadline" type="date" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Requirements</label>
              <textarea name="requirements" rows={3} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500" placeholder="Required skills and qualifications" />
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium transition-colors">
                Post Job
              </button>
              <Link href="/employer" className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-slate-900 transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
