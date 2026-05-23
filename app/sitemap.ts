import { MetadataRoute } from 'next';

// force-dynamic: the sitemap is generated at request time from a hardcoded
// route list. The previous force-static + fs.readdirSync approach crashed on
// ECS/Fargate because the container does not include the app/ source tree at
// runtime, causing fs.readdirSync to throw and return a 500.
export const dynamic = 'force-dynamic';

const ELEVATE_URL = 'https://www.elevateforhumanity.org';

const SEO_HUB_PREFIXES = [
  '/workforce-training-indianapolis',
  '/wioa-funded-training-indiana',
  '/healthcare-training-indianapolis',
  '/skilled-trades-training-indiana',
  '/it-certification-training-indianapolis',
  '/employer-workforce-partnerships-indiana',
  '/agency-referral-workforce-training-indiana',
] as const;

// Priority mapping based on route patterns
function getPriority(route: string): number {
  if (route === '/') return 1.0;
  if (route === '/apply' || route === '/programs') return 1.0;
  // SEO authority hubs — buyer-intent local/Indiana search (priority 1.0)
  if (SEO_HUB_PREFIXES.some(p => route.startsWith(p))) return 1.0;
  if (route.startsWith('/programs/')) return 0.9;
  if (route.startsWith('/apprenticeships')) return 0.9;
  if (route === '/employer/dashboard' || route === '/how-it-works') return 0.9;
  if (route.startsWith('/about') || route === '/contact') return 0.8;
  if (route.startsWith('/funding') || route.startsWith('/career')) return 0.8;
  // State-specific SEO pages - high priority
  if (route.startsWith('/career-training-')) return 0.9;
  if (route.startsWith('/community-services-')) return 0.9;
  if (route.startsWith('/store/guides')) return 0.8;
  if (route.startsWith('/blog') || route.startsWith('/resources')) return 0.7;
  if (route.startsWith('/policies') || route.startsWith('/legal/privacy') || route.startsWith('/legal'))
    return 0.4;
  return 0.6;
}

// Change frequency based on route patterns
function getChangeFreq(
  route: string,
): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (route === '/' || route === '/apply') return 'daily';
  if (route.startsWith('/programs') || route.startsWith('/blog')) return 'weekly';
  // SEO authority hubs — reviewed and updated monthly
  if (SEO_HUB_PREFIXES.some(p => route.startsWith(p))) return 'monthly';
  // State-specific pages update monthly
  if (route.startsWith('/career-training-') || route.startsWith('/community-services-'))
    return 'monthly';
  if (route.startsWith('/policies') || route.startsWith('/legal/privacy')) return 'yearly';
  return 'monthly';
}

// Canonical public routes — maintained manually.
// The previous fs.readdirSync approach crashed on ECS because the container
// does not include the app/ source tree at runtime. This list covers all
// public-facing pages. Add new public pages here when they go live.
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/about/mission',
  '/about/team',
  '/about/leadership',
  '/about/accreditation',
  '/about/compliance',
  '/about/partners',
  '/apply',
  '/apply/quick',
  '/apply/impact',
  '/apply/pending-workone',
  '/apprenticeships',
  '/blog',
  '/booking',
  '/careers',
  '/check-eligibility',
  '/contact',
  '/dmca',
  '/donate',
  '/employer',
  '/employer/dashboard',
  '/faq',
  '/federal-funded',
  '/for-employers',
  '/for-students',
  '/funding',
  '/funding/wioa',
  '/funding/workforce-ready-grant',
  '/funding/fssa-impact',
  '/funding/job-ready-indy',
  '/how-it-works',
  '/jri',
  '/news',
  '/partners',
  '/policies/copyright',
  '/policies/privacy',
  '/policies/terms',
  '/legal/privacy',
  '/programs',
  '/programs/apprenticeships',
  '/programs/federal-funded',
  '/programs/healthcare',
  '/programs/micro-programs',
  '/programs/skilled-trades',
  // Healthcare
  '/programs/cna',
  '/programs/qma',
  '/programs/medical-assistant',
  '/programs/peer-recovery-specialist',
  '/programs/direct-support-professional',
  '/programs/drug-alcohol-specimen-collector',
  '/programs/cpr-first-aid',
  '/programs/pharmacy-technician',
  '/programs/phlebotomy',
  '/programs/home-health-aide',
  '/programs/sanitation-infection-control',
  '/programs/dental-assistant',
  '/programs/chw-cert',
  '/programs/nha-pharmacy-technician',
  '/programs/nha-ehr',
  '/programs/nha-patient-care-technician',
  '/programs/nha-medical-admin-assistant',
  '/programs/nha-medical-assistant',
  '/programs/nha-billing-coding',
  '/programs/nha-phlebotomy',
  '/programs/nha-ekg-technician',
  // Trades
  '/programs/hvac-technician',
  '/programs/electrical',
  '/programs/plumbing',
  '/programs/cdl-training',
  '/programs/welding',
  '/programs/building-services-technician',
  '/programs/building-maintenance-wrg',
  '/programs/solar-panel-installation',
  '/programs/manufacturing-technician',
  '/programs/diesel-mechanic',
  '/programs/automotive-technician',
  '/programs/construction-trades-certification',
  '/programs/forklift',
  // Apprenticeships
  '/programs/barber-apprenticeship',
  '/programs/cosmetology-apprenticeship',
  '/programs/esthetician-apprenticeship',
  '/programs/nail-technician-apprenticeship',
  '/programs/culinary-apprenticeship',
  '/programs/youth-culinary-apprenticeship',
  '/programs/emt-apprenticeship',
  // Business & Finance
  '/programs/finance-bookkeeping-accounting',
  '/programs/bookkeeping',

  '/programs/entrepreneurship',
  '/programs/business-startup',
  '/programs/business-administration',
  '/programs/real-estate-agent',
  '/programs/insurance-agent',
  '/programs/administrative-assistant',
  '/programs/customer-service-representative',
  '/programs/office-administration',
  '/programs/project-management',
  // Technology
  '/programs/it-help-desk',
  '/programs/software-development',
  '/programs/web-development',
  '/programs/data-analytics',
  '/programs/cybersecurity-analyst',
  '/programs/network-administration',
  '/programs/network-support-technician',
  '/programs/cad-drafting',
  '/programs/graphic-design',
  // Special
  '/programs/jri',
  '/programs/jri-introduction',
  '/programs/jri-badge-1-mindsets',
  '/programs/jri-badge-2-self-management',
  '/programs/jri-badge-3-learning-strategies',
  '/programs/jri-badge-4-social-skills',
  '/programs/jri-badge-5-workplace-skills',
  '/programs/jri-badge-6-launch-a-career',
  '/programs/reentry-specialist',
  '/programs/life-coach-certification-wioa',
  '/programs/nrf-riseup',
  // Hospitality
  '/programs/start-hospitality',
  '/programs/guest-service-gold',
  '/programs/servsuccess',
  '/programs/servsafe-food-handler',
  '/programs/servsafe-manager',
  // Beauty
  '/programs/esthetician',
  '/resources',
  '/sitemap',
  '/legal',
  '/verify',
  '/workforce',
  '/workforce-training-indianapolis',
  '/wioa-funded-training-indiana',
  '/healthcare-training-indianapolis',
  '/skilled-trades-training-indiana',
  '/it-certification-training-indianapolis',
  '/employer-workforce-partnerships-indiana',
  '/agency-referral-workforce-training-indiana',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${ELEVATE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: getChangeFreq(route),
    priority: getPriority(route),
  }));
}
