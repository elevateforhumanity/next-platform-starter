import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { createUserAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create New User | Admin | Elevate For Humanity',
  description: 'Create a new user account.',
};

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();
  const { error } = await searchParams;

  const { data: programs } = await db
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/staff" className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block">
            ← Back to Staff
          </Link>
          <h1 className="text-3xl font-bold text-black">Create New User</h1>
          <p className="mt-2 text-black">Add a new user to the system with appropriate role and permissions.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={createUserAction} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-black">User Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">First Name *</label>
                <input type="text" name="first_name" required placeholder="First name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Last Name *</label>
                <input type="text" name="last_name" required placeholder="Doe"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Email Address *</label>
              <input type="email" name="email" required placeholder="user@organization.org"
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none" />
              <p className="mt-1 text-xs text-slate-500">User will receive a verification email at this address</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Phone Number</label>
              <input type="tel" name="phone" placeholder="(317) 314-3757"
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">User Role *</label>
              <select name="role" required
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none">
                <option value="">Select a role</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="org_admin">Org Admin</option>
                <option value="employer">Employer</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Role determines user permissions and access level</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Temporary Password *</label>
              <input type="password" name="password" required minLength={8} placeholder="Min 8 characters"
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none" />
              <p className="mt-1 text-xs text-slate-500">User will be required to change password on first login</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="send_welcome" defaultChecked className="rounded text-brand-blue-600" />
                <span className="text-sm text-black">Send welcome email</span>
              </label>
            </div>

            {(programs ?? []).length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-black mb-2">Assign to Program (Optional)</label>
                <select name="program_id"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none">
                  <option value="">No program assignment</option>
                  {(programs ?? []).map((p: { id: string; title: string; slug: string }) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black mb-2">Admin Notes (Optional)</label>
              <textarea name="notes" rows={3} placeholder="Add any notes about this user..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-blue-500 focus:outline-none" />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <Link href="/admin/staff" className="px-4 py-2 border border-slate-300 rounded-md text-black hover:bg-slate-50">
                Cancel
              </Link>
              <button type="submit" className="px-6 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 font-semibold">
                Create User
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-brand-blue-900 mb-2">Creating User Accounts</h3>
          <ul className="text-sm text-brand-blue-800 space-y-1">
            <li>• Users will receive a verification email to activate their account</li>
            <li>• Temporary passwords must be changed on first login</li>
            <li>• Role determines what features and data the user can access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
