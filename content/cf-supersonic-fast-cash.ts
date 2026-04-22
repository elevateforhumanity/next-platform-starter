export type SupersonicService = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
};

export const supersonicServices: SupersonicService[] = [
  {
    slug: 'tax-preparation',
    title: 'Individual Tax Preparation',
    summary: 'Personal tax returns filed accurately and on time.',
    description: 'PTIN-credentialed preparers serving Indianapolis and all 50 states. W-2, 1099, investment income, rental property, and more.',
    features: ['W-2 and 1099 income', 'Itemized deductions', 'Investment income', 'Rental property', 'Self-employment income'],
    ctaLabel: 'Book Appointment',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'refund-advance',
    title: 'Refund Advance',
    summary: 'Get your refund faster with a tax refund advance.',
    description: 'Access a portion of your expected refund before the IRS processes your return. No interest, no hidden fees for qualifying clients.',
    features: ['Same-day availability', 'No interest for qualifying clients', 'Applied to your tax preparation', 'Available on approved returns'],
    ctaLabel: 'Learn More',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'bookkeeping',
    title: 'Small Business Bookkeeping',
    summary: 'Monthly bookkeeping for small businesses.',
    description: 'QuickBooks-based bookkeeping, bank reconciliation, and financial reporting for small businesses and sole proprietors.',
    features: ['Monthly reconciliation', 'QuickBooks management', 'Financial statements', 'Payroll support', 'Year-end prep'],
    ctaLabel: 'Get a Quote',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'payroll',
    title: 'Payroll Services',
    summary: 'Payroll processing for small businesses.',
    description: 'Weekly, bi-weekly, or monthly payroll processing with direct deposit, tax filings, and year-end W-2 preparation.',
    features: ['Direct deposit', 'Payroll tax filings', 'W-2 and 1099 preparation', 'New hire reporting', 'Multi-state payroll'],
    ctaLabel: 'Get a Quote',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
  {
    slug: 'audit-protection',
    title: 'Audit Protection',
    summary: 'Professional representation if you are audited.',
    description: 'If the IRS or state tax authority contacts you about a return we prepared, we represent you at no additional charge.',
    features: ['IRS correspondence handling', 'Audit representation', 'State tax authority response', 'Enrolled Agent representation'],
    ctaLabel: 'Learn More',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
  },
];

export const supersonicConfig = {
  name: 'Supersonic Fast Cash',
  tagline: 'Professional tax preparation and financial services.',
  description: 'PTIN-credentialed tax preparers serving individuals and small businesses in Indianapolis and all 50 states. Enrolled Agent on staff.',
  phone: '(317) 314-3757',
  ctaHref: 'https://learn.elevateforhumanity.org/apply',
};
