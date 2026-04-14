export type CommunityService = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  eligibility: string;
  ctaLabel: string;
  ctaHref: string;
};

export const communityServices: CommunityService[] = [
  {
    slug: 'vita-tax-preparation',
    title: 'VITA Free Tax Preparation',
    summary: 'Free tax preparation for qualifying households.',
    description: 'IRS Volunteer Income Tax Assistance (VITA) site offering free federal and state tax return preparation for individuals and families earning under $67,000 annually.',
    eligibility: 'Indiana residents earning under $67,000 annually.',
    ctaLabel: 'Schedule Appointment',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'mental-wellness',
    title: 'Mental Wellness Support',
    summary: 'Free mental health services through Selfish Inc.',
    description: 'Access mental wellness resources, counseling referrals, and peer support through our partnership with Selfish Inc. Services are free or low-cost for qualifying participants.',
    eligibility: 'Open to Indiana residents. Income guidelines may apply for some services.',
    ctaLabel: 'Learn More',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'wioa-funded-training',
    title: 'WIOA-Funded Job Training',
    summary: 'Fully funded career training for eligible participants.',
    description: 'Workforce Innovation and Opportunity Act (WIOA) funding covers tuition, fees, and support services for eligible Indiana residents pursuing career training programs.',
    eligibility: 'Indiana residents who meet WIOA income and eligibility requirements. Contact us to determine eligibility.',
    ctaLabel: 'Check Eligibility',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'employment-services',
    title: 'Employment Services',
    summary: 'Job placement support and employer connections.',
    description: 'Resume building, interview preparation, job search assistance, and direct employer connections for program graduates and community members.',
    eligibility: 'Open to all community members. Priority given to program graduates.',
    ctaLabel: 'Get Started',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
];

export const statePages = [
  { slug: 'indiana', label: 'Indiana' },
  { slug: 'illinois', label: 'Illinois' },
  { slug: 'ohio', label: 'Ohio' },
  { slug: 'tennessee', label: 'Tennessee' },
  { slug: 'texas', label: 'Texas' },
];
