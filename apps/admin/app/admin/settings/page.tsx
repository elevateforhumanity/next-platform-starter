import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bell, Shield, CreditCard, Globe, Mail, Webhook, Share2, Sparkles, BarChart2, Navigation } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Settings | Admin' };

const SECTIONS = [
  { id: 'ai', title: 'AI & Integrations', description: 'Configure AI providers, API keys, model selection, and third-party service connections.', icon: Sparkles, href: '/admin/settings/integrations', img: '/images/pages/admin-ai-studio-hero.webp', accent: 'from-violet-600 to-indigo-600' },
  { id: 'general', title: 'General', description: 'Site name, support email, contact phone, timezone, and platform-wide defaults.', icon: Globe, href: '/admin/settings/general', img: '/images/pages/admin-advanced-tools-hero.webp', accent: 'from-blue-600 to-cyan-600' },
  { id: 'notifications', title: 'Notifications', description: 'Email and SMS alert rules, Slack webhooks, and in-app notification preferences.', icon: Bell, href: '/admin/settings/notifications', img: '/images/pages/admin-automation-hero.webp', accent: 'from-amber-500 to-orange-500' },
  { id: 'security', title: 'Security', description: 'MFA enforcement, session timeouts, IP allowlists, and audit log retention.', icon: Shield, href: '/admin/settings/security', img: '/images/pages/admin-audit-logs-hero.webp', accent: 'from-red-600 to-rose-600' },
  { id: 'payments', title: 'Payments', description: 'Stripe mode, currency, accepted payment methods, and payout configuration.', icon: CreditCard, href: '/admin/settings/payments', img: '/images/pages/admin-business-hero.webp', accent: 'from-emerald-600 to-teal-600' },
  { id: 'email', title: 'Email', description: 'From name, from address, email provider, and transactional template settings.', icon: Mail, href: '/admin/settings/email', img: '/images/pages/admin-email-marketing-d2.webp', accent: 'from-sky-600 to-blue-600' },
  { id: 'social', title: 'Social Media', description: 'Connect Facebook, Instagram, YouTube, and Twitter/X accounts for campaign publishing.', icon: Share2, href: '/admin/settings/social-media', img: '/images/pages/admin-campaigns-hero.webp', accent: 'from-pink-600 to-fuchsia-600' },
  { id: 'webhooks', title: 'Webhooks', description: 'Manage inbound and outbound webhooks, signing secrets, and delivery logs.', icon: Webhook, href: '/admin/settings/integrations', img: '/images/pages/admin-automation-qa-hero.webp', accent: 'from-slate-600 to-slate-800' },
  { id: 'analytics', title: 'Site Stats', description: 'Platform-wide engagement metrics, enrollment counts, and performance snapshots.', icon: BarChart2, href: '/admin/settings/site-stats', img: '/images/pages/admin-analytics-hero.webp', accent: 'from-blue-700 to-indigo-700' },
  { id: 'nav', title: 'Navigation', description: 'Edit public site navigation items, labels, and link destinations.', icon: Navigation, href: '/admin/settings/nav', img: '/images/pages/admin-advanced-tools-hero.webp', accent: 'from-slate-500 to-slate-700' },
];

export default async function AdminSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: settingsRows } = await db
    .from('platform_settings')
    .select('key, value, updated_at')
    .order('key');

  const s: Record<string, string> = Object.fromEntries(
    (settingsRows ?? []).map((r: any) => [r.key, r.value]),
  );

  const aiConfigured = !!(s['openai_api_key'] || s['groq_api_key'] || s['gemini_api_key']);

  const quickStatus: Record<string, React.ReactNode> = {
    ai: aiConfigured
      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Provider configured</span>
      : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />No key set</span>,
    general: s['site_name'] ? <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{s['site_name']}</span> : null,
    notifications: s['email_notifications'] ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s['email_notifications'] === 'true' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${s['email_notifications'] === 'true' ? 'bg-emerald-500' : 'bg-slate-400'}`} />{s['email_notifications'] === 'true' ? 'Enabled' : 'Disabled'}</span> : null,
    security: s['mfa_required'] ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s['mfa_required'] === 'true' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${s['mfa_required'] === 'true' ? 'bg-emerald-500' : 'bg-slate-400'}`} />{s['mfa_required'] === 'true' ? 'MFA on' : 'MFA off'}</span> : null,
    payments: s['stripe_mode'] ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s['stripe_mode'] === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${s['stripe_mode'] === 'live' ? 'bg-emerald-500' : 'bg-amber-400'}`} />{s['stripe_mode'] === 'live' ? 'Live' : 'Test mode'}</span> : null,
    email: s['email_provider'] ? <span className="text-[11px] text-slate-500">{s['email_provider']}</span> : null,
    social: null,
    webhooks: s['webhook_secret'] ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Secret set</span> : null,
    analytics: null,
    nav: null,
  };

  const aiSection = SECTIONS[0];
  const AiIcon = aiSection.icon;

  return (
    <div className="w-full space-y-8">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Configure platform behaviour, AI integrations, and security.</p>
      </div>

      {/* AI — full-width feature card */}
      <Link
        href={aiSection.href}
        className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-violet-200 shadow-sm hover:shadow-lg transition-all bg-white"
      >
        <div className="relative sm:w-80 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
          <Image src={aiSection.img} alt={aiSection.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 320px" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <AiIcon className="w-14 h-14 text-white drop-shadow-xl" />
          </div>
        </div>
        <div className="flex-1 p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">AI &amp; Integrations</span>
              {!aiConfigured && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⚠ Setup required</span>}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Providers &amp; API Keys</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
              Connect OpenAI, Groq, Gemini, or Azure to power the AI tutor, course generator, document prefill, Dev Studio, and all AI-assisted workflows across the platform. Without a provider key, AI features fall back to static responses.
            </p>
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            {quickStatus['ai']}
            <span className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 group-hover:gap-2.5 transition-all">
              Configure AI <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* Remaining cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.slice(1).map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all bg-white"
            >
              {/* Hero image */}
              <div className="relative h-40 overflow-hidden flex-shrink-0">
                <Image src={section.img} alt={section.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
                <div className={`absolute inset-0 bg-gradient-to-br ${section.accent} opacity-55`} />
                <div className="absolute bottom-3 left-4">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-semibold text-slate-900 text-base leading-tight">{section.title}</h2>
                  {quickStatus[section.id] && <div className="flex-shrink-0 mt-0.5">{quickStatus[section.id]}</div>}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{section.description}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-brand-blue-600 flex items-center gap-1 transition-colors">
                    Open settings <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Raw settings table */}
      {settingsRows && settingsRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">All Platform Settings</h2>
            <span className="text-xs text-slate-400">{settingsRows.length} keys</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Key', 'Value', 'Last Updated'].map((h) => (
                    <th key={h} className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {settingsRows.map((r: any) => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="py-3 px-5 font-mono text-xs text-slate-700">{r.key}</td>
                    <td className="py-3 px-5 text-slate-600 text-xs max-w-xs truncate">{r.value ?? '—'}</td>
                    <td className="py-3 px-5 text-slate-400 text-xs">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
