import { siteConfig } from '@/content/site';

export const routes = {
  home: '/',
  programs: '/programs',
  program: (slug: string) => `/programs/${slug}`,
  careerTraining: '/career-training',
  careerTrainingState: (state: string) => `/career-training/${state}`,
  communityServices: '/community-services',
  communityServicesState: (state: string) => `/community-services/${state}`,
  cnaWaitlist: '/cna-waitlist',
  supersonicFastCash: '/supersonic-fast-cash',
  supersonicService: (slug: string) => `/supersonic-fast-cash/${slug}`,
  policies: '/policies',
  policy: (slug: string) => `/policies/${slug}`,
  legal: '/legal',
  legalDoc: (slug: string) => `/legal/${slug}`,
  about: '/about',
  contact: '/contact',
  funding: '/funding',
  enrollment: '/enrollment',
  // Handoff to learn.elevateforhumanity.org
  apply: siteConfig.handoff.apply,
  login: siteConfig.handoff.login,
  checkout: siteConfig.handoff.checkout,
} as const;
