import Link from 'next/link';

export interface BillingNavItem {
  href: string;
  label: string;
}

interface Props {
  items: BillingNavItem[];
  basePath: string;
}

export function BillingSubnav({ items, basePath }: Props) {
  return (
    <nav className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {item.label}
        </Link>
      ))}
      <span className="sr-only">Billing section navigation under {basePath}</span>
    </nav>
  );
}

export const ADMIN_BILLING_NAV: BillingNavItem[] = [
  { href: '/admin/billing', label: 'Overview' },
  { href: '/admin/billing/plans', label: 'Plans' },
  { href: '/admin/billing/addons', label: 'Add-ons' },
  { href: '/admin/billing/subscriptions', label: 'Subscriptions' },
  { href: '/admin/billing/licenses', label: 'Licenses' },
  { href: '/admin/billing/usage', label: 'Usage' },
  { href: '/admin/billing/invoices', label: 'Invoices' },
  { href: '/admin/billing/feature-flags', label: 'Feature flags' },
];

export const ACCOUNT_BILLING_NAV: BillingNavItem[] = [
  { href: '/account/billing', label: 'Overview' },
  { href: '/account/plan', label: 'Your plan' },
  { href: '/account/addons', label: 'Add-ons' },
  { href: '/account/invoices', label: 'Invoices' },
  { href: '/account/payment-methods', label: 'Payment methods' },
];
