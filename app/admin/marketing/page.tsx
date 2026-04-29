import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Megaphone, Mail, Share2, FileText, BarChart2,
  Users, PlusCircle, TrendingUp, Eye, Send,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Marketing | Admin',
  description: 'Marketing hub — campaigns, email, social media, blog, and CRM.',
};

export const revalidate = 60;

export default async function MarketingPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const [campaignsRes, leadsRes, postsRes] = await Promise.all([
    db.from('campaigns').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('leads').select('id', { count: 'exact', head: true }),
    db.from('blog_posts').select('id, title, published, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const campaigns = campaignsRes.data ?? [];
  const totalLeads = leadsRes.count ?? 0;
  const posts = postsRes.data ?? [];

  const sections = [
    {
      title: 'Campaigns',
      icon: Megaphone,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600',
      links: [
        { label: 'All Campaigns', href: '/admin/campaigns' },
        { label: 'New Campaign', href: '/admin/campaigns/new' },
        { label: 'CRM Campaigns', href: '/admin/crm/campaigns' },
      ],
    },
    {
      title: 'Email Marketing',
      icon: Mail,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600',
      links: [
        { label: 'Email Campaigns', href: '/admin/email-marketing' },
        { label: 'Email Analytics', href: '/admin/email-marketing/analytics' },
        { label: 'Email Automation', href: '/admin/email-marketing/automation' },
        { label: 'New Email Campaign', href: '/admin/email-marketing/campaigns/new' },
      ],
    },
    {
      title: 'Social Media',
      icon: Share2,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600',
      links: [
        { label: 'Social Media Hub', href: '/admin/social-media' },
        { label: 'New Social Campaign', href: '/admin/social-media/campaigns/new' },
      ],
    },
    {
      title: 'Blog & Content',
      icon: FileText,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-600',
      links: [
        { label: 'All Posts', href: '/admin/blog' },
        { label: 'New Post', href: '/admin/blog/new' },
      ],
    },
    {
      title: 'CRM & Leads',
      icon: Users,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-600',
      links: [
        { label: 'CRM Dashboard', href: '/admin/crm' },
        { label: 'All Contacts', href: '/admin/crm/contacts' },
        { label: 'All Leads', href: '/admin/leads' },
        { label: 'New Lead', href: '/admin/leads/new' },
      ],
    },
    {
      title: 'Analytics',
      icon: BarChart2,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-700',
      links: [
        { label: 'Analytics Overview', href: '/admin/analytics' },
        { label: 'Engagement', href: '/admin/analytics/engagement' },
        { label: 'Programs', href: '/admin/analytics/programs' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Marketing' }]} />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Marketing</h1>
              <p className="text-sm text-slate-500">Campaigns, email, social, blog, and CRM</p>
            </div>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Leads', value: totalLeads.toLocaleString(), icon: TrendingUp, color: 'text-blue-600' },
            { label: 'Active Campaigns', value: campaigns.filter((c: any) => c.status === 'active').length.toString(), icon: Send, color: 'text-emerald-600' },
            { label: 'Blog Posts', value: posts.length.toString(), icon: Eye, color: 'text-amber-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(({ title, icon: Icon, iconBg, links }) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-slate-900">{title}</h2>
              </div>
              <ul className="space-y-1">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Recent campaigns */}
        {campaigns.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent Campaigns</h2>
              <Link href="/admin/campaigns" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {campaigns.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-slate-800">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    c.status === 'draft'  ? 'bg-slate-100 text-slate-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent blog posts */}
        {posts.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent Blog Posts</h2>
              <Link href="/admin/blog" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {posts.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-slate-800 truncate max-w-xs">{p.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    p.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
