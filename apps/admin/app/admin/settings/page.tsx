import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  Globe, Bell, Shield, CreditCard, Mail, Webhook,
  Share2, Users, Key, Navigation, BarChart2, Building2,
  ArrowRight, ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Settings | Admin' };

const SECTIONS = [
  {
    title: 'General',
    description: 'Site name, support email, timezone, and contact details.',
    href: '/admin/settings/general',
    icon: Globe,
    accent: 'bg-blue-50',
    iconColor: 'text-blue-600',
    image: '/images/pages/admin-network-hero.webp',
    keys: ['site_name', 'support_email', 'timezone'],
  },
  {
    title: 'Notifications',
    description: 'Email, SMS, and Slack alert preferences.',
    href: '/admin/settings/notifications',
    icon: Bell,
    accent: 'bg-amber-50',
    iconColor: 'text-amber-600',
    image: '/images/pages/admin-automation-hero.webp',
    keys: ['email_notifications', 'sms_notifications', 'slack_webhook'],
  },
  {
    title: 'Security',
    description: 'MFA enforcement, session timeout, and IP allowlist.',
    href: '/admin/settings/security',
    icon: Shield,
    accent: 'bg-red-50',
    iconColor: 'text-red-600',
    image: '/images/pages/cybersecurity-hero.webp',
    keys: ['mfa_required', 'session_timeout', 'ip_allowlist'],
  },
  {
    title: 'Payments',
    description: 'Stripe mode, currency, and accepted payment methods.',
    href: '/admin/settings/payments',
    icon: CreditCard,
    accent: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    image: '/images/pages/admin-finance.webp',
    keys: ['stripe_mode', 'currency', 'payment_methods'],
  },
  {
    title: 'Email',
    description: 'From name, from address, and email delivery provider.',
    href: '/admin/settings/email',
    icon: Mail,
    accent: 'bg-violet-50',
    iconColor: 'text-violet-600',
    image: '/images/pages/admin-email-marketing-d1.jpg',
    keys: ['email_from_name', 'email_from_address', 'email_provider'],
  },
  {
    title: 'Social Media',
    description: 'Facebook, Instagram, YouTube, and Twitter/X connections.',
    href: '/admin/settings/social-media',
    icon: Share2,
    accent: 'bg-pink-50',
    iconColor: 'text-pink-600',
    image: '/images/pages/admin-social-campaigns-new-hero.jpg',
    keys: ['social_facebook_connected', 'social_instagram_connected', 'social_youtube_connected'],
  },
  {
    title: 'Integrations',
    description: 'Webhooks, API keys, and third-party service connections.',
    href: '/admin/settings/integrations',
    icon: Webhook,
    accent: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    image: '/images/pages/admin-integrations-gc-detail.webp',
    keys: ['active_integrations', 'webhook_secret'],
  },
  {
    title: 'Organization',
    description: 'Legal name, EIN, address, and accreditation details.',
    href: '/admin/settings/organization-profile',
    icon: Building2,
    accent: 'bg-slate-100',
    iconColor: 'text-slate-600',
    image: '/images/pages/admin-business-hero.webp',
    keys: ['org_name', 'org_ein', 'org_address'],
  },
  {
    title: 'Staff & Roles',
    description: 'Admin users, roles, and access permissions.',
    href: '/admin/staff',
    icon: Users,
    accent: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    image: '/images/pages/admin-instructors-detail.webp',
    keys: [] as string[],
  },
  {
    title: 'API Keys',
    description: 'Generate and revoke keys for external integrations.',
    href: '/admin/api-keys',
    icon: Key,
    accent: 'bg-orange-50',
    iconColor: 'text-orange-600',
    image: '/images/pages/admin-dev-studio-detail.webp',
    keys: [] as string[],
  },
  {
    title: 'Navigation',
    description: 'Customise admin sidebar sections and item ordering.',
    href: '/admin/settings/nav',
    icon: Navigation,
    accent: 'bg-teal-50',
    iconColor: 'text-teal-600',
    image: '/images/pages/admin-activity-hero.webp',
    keys: [] as string[],
  },
  {
    title: 'Site Stats',
    description: 'Page views, UTM tracking, and analytics configuration.',
    href: '/admin/settings/site-stats',
    icon: BarChart2,
    accent: 'bg-lime-50',
    iconColor: 'text-lime-600',
    image: '/images/pages/admin-analytics-hero.webp',
    keys: [] as string[],
  },
];

function resolveLabel(key: string, value: string | undefined): { label: string; ok: boolean } {
  if (!value) return { label: 'Not set', ok: false };
  if (key.endsWith('_connected')) return { label: value === 'true' ? 'Connected' : 'Not connected', ok: value === 'true' };
  if (key.endsWith('_webhook') || key.endsWith('_secret')) return { label: 'Configured', ok: true };
  return { label: value.length > 22 ? value.slice(0, 20) + '\u2026' : value, ok: true };
}

function humanKey(key: string): string {
  return key
    .replace(/^(site_|org_|email_|social_|stripe_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AdminSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: settingsRows } = await db
    .from('platform_settings')
    .select('key, value, updated_at')
    .order('key');

  const settings: Record<string, string> = Object.fromEntries(
    (settingsRows ?? []).map((r: any) => [r.key, r.value]),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Settings</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform configuration, integrations, security, and access control.
        </p>
      </div>

      <div className="px-6 py-6 max-w-7xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const hasKeys = section.keys.length > 0;
            const configured = !hasKeys || section.keys.some((k) => !!settings[k]);

            return (
              <Link
                key={section.title}
                href={section.href}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-brand-blue-300 hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-28 w-full overflow-hidden bg-slate-100 shrink-0">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className={`absolute top-3 left-3 w-9 h-9 rounded-xl ${section.accent} flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-4 h-4 ${section.iconColor}`} />
                  </div>
                  <div
                    className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${configured ? 'bg-emerald-400' : 'bg-slate-300'}`}
                    title={configured ? 'Configured' : 'Not configured'}
                  />
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 text-sm leading-snug">{section.title}</h2>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-blue-500 transition-colors shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1">
                    {section.description}
                  </p>

                  {hasKeys && (
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      {section.keys.slice(0, 3).map((k) => {
                        const { label, ok } = resolveLabel(k, settings[k]);
                        return (
                          <div key={k} className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-[11px] text-slate-400 truncate shrink-0 max-w-[45%]">
                              {humanKey(k)}
                            </span>
                            <span className={`text-[11px] font-medium truncate text-right ${ok ? 'text-slate-700' : 'text-slate-300'}`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {settingsRows && settingsRows.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">All Platform Settings</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {settingsRows.length} keys
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Key', 'Value', 'Last Updated'].map((h) => (
                      <th key={h} className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(settingsRows as any[]).map((r) => (
                    <tr key={r.key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-5 font-mono text-xs text-slate-700 whitespace-nowrap">{r.key}</td>
                      <td className="py-2.5 px-5 text-slate-600 text-xs max-w-xs truncate">{r.value ?? '—'}</td>
                      <td className="py-2.5 px-5 text-slate-400 text-xs whitespace-nowrap">
                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
