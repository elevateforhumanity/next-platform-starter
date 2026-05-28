import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Key, Server, Share2, Webhook, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'AI & Integrations | Admin Settings' };

const AI_PROVIDERS = [
  { key: 'openai_api_key',  label: 'OpenAI',   desc: 'GPT-4o — AI tutor, course generator, document prefill', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'groq_api_key',    label: 'Groq',     desc: 'Llama 3 — fast inference, Dev Studio routing',          color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  { key: 'gemini_api_key',  label: 'Gemini',   desc: 'Google Gemini — multimodal, document OCR assist',       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  { key: 'azure_openai_key','label': 'Azure OpenAI', desc: 'Enterprise Azure endpoint — HIPAA/FedRAMP eligible', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
];

const INTEGRATION_CARDS = [
  { title: 'Platform Secrets', desc: 'Encrypted secrets store — API keys loaded at runtime by lib/secrets.ts. Highest priority.', href: '/admin/dev-studio?tab=secrets', icon: Key, img: '/images/pages/admin-ai-console-hero.webp', accent: 'from-violet-600 to-indigo-600' },
  { title: 'Environment Variables', desc: 'Manage integration keys, API tokens, and plaintext config in platform_settings.', href: '/admin/integrations/env-manager', icon: Server, img: '/images/pages/admin-advanced-tools-hero.webp', accent: 'from-slate-600 to-slate-800' },
  { title: 'AWS / ECS Container', desc: 'Push environment variables to ECS task definitions and SSM Parameter Store.', href: '/admin/dev-studio?tab=container', icon: Server, img: '/images/pages/admin-automation-qa-hero.webp', accent: 'from-amber-600 to-orange-600' },
  { title: 'Social Media Accounts', desc: 'Connect Facebook, Instagram, YouTube, and Twitter/X for campaign publishing.', href: '/admin/settings/social-media', icon: Share2, img: '/images/pages/admin-campaigns-hero.webp', accent: 'from-pink-600 to-fuchsia-600' },
  { title: 'Webhooks', desc: 'Inbound and outbound webhooks, signing secrets, and delivery logs.', href: '/admin/settings/integrations', icon: Webhook, img: '/images/pages/admin-automation-hero.webp', accent: 'from-teal-600 to-cyan-600' },
];

export default async function IntegrationSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: secrets } = await db
    .from('platform_secrets')
    .select('key')
    .in('key', AI_PROVIDERS.map(p => p.key));

  const configuredKeys = new Set((secrets ?? []).map((r: any) => r.key));
  const anyAiConfigured = AI_PROVIDERS.some(p => configuredKeys.has(p.key));

  return (
    <div className="w-full space-y-8">
      {/* Breadcrumb + header */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          <Link href="/admin/settings" className="hover:text-slate-600 transition-colors">Settings</Link>
          {' / '}AI &amp; Integrations
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI &amp; Integrations</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Connect AI providers and external services. AI features across the platform read from{' '}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">platform_secrets</code> at runtime.
        </p>
      </div>

      {/* AI provider status banner */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${anyAiConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${anyAiConfigured ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {anyAiConfigured
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : <AlertTriangle className="w-5 h-5 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${anyAiConfigured ? 'text-emerald-900' : 'text-amber-900'}`}>
            {anyAiConfigured ? 'AI provider configured' : 'No AI provider configured'}
          </p>
          <p className={`text-xs mt-0.5 ${anyAiConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
            {anyAiConfigured
              ? 'AI tutor, course generator, document prefill, and Dev Studio are active.'
              : 'Add at least one API key below to enable AI features. Without a key, all AI calls return static fallback responses.'}
          </p>
        </div>
        <Link
          href="/admin/dev-studio?tab=secrets"
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${anyAiConfigured ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
        >
          <Key className="w-3.5 h-3.5" />
          {anyAiConfigured ? 'Manage Keys' : 'Add Key Now'}
        </Link>
      </div>

      {/* AI provider cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h2 className="font-semibold text-slate-900 text-sm">AI Providers</h2>
          <span className="text-xs text-slate-400 ml-1">— {configuredKeys.size} of {AI_PROVIDERS.length} configured</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {AI_PROVIDERS.map((provider) => {
            const isSet = configuredKeys.has(provider.key);
            return (
              <Link
                key={provider.key}
                href="/admin/dev-studio?tab=secrets"
                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${isSet ? provider.bg : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${isSet ? `${provider.color} bg-white border border-current/20` : 'bg-slate-100 text-slate-400'}`}>
                  {provider.label.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{provider.label}</p>
                    {isSet
                      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Configured</span>
                      : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">Not set</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{provider.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-0.5 transition-colors" />
              </Link>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Keys are stored encrypted in <code className="bg-slate-100 px-1 rounded">platform_secrets</code>. The AI service tries providers in order: Groq → OpenAI → Gemini → Azure.
        </p>
      </div>

      {/* Integration cards */}
      <div>
        <h2 className="font-semibold text-slate-900 text-sm mb-4">Service Connections</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all bg-white"
              >
                <div className="relative h-32 overflow-hidden flex-shrink-0">
                  <Image src={card.img} alt={card.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-55`} />
                  <div className="absolute bottom-3 left-4">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-semibold text-slate-900 text-sm mb-1">{card.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{card.desc}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-brand-blue-600 flex items-center gap-1 transition-colors">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Config hierarchy note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-widest">Configuration Priority</p>
        <div className="space-y-2">
          {[
            { label: 'platform_secrets', note: 'Dev Studio → Secrets tab — encrypted, highest priority at runtime', rank: '1' },
            { label: 'app_secrets', note: 'Dev Studio → Container env — development environment secrets', rank: '2' },
            { label: 'platform_settings', note: 'Env Manager — plaintext config keys, integration settings', rank: '3' },
            { label: 'process.env', note: 'ECS task definition / .env.local — base layer, lowest priority', rank: '4' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.rank}</span>
              <div>
                <code className="text-xs font-mono text-slate-800">{item.label}</code>
                <span className="text-xs text-slate-500 ml-2">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
