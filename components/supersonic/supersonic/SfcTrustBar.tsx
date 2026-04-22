/**
 * SfcTrustBar
 * Required trust / compliance strip for all Supersonic Fast Cash financial pages.
 * Renders: estimate disclaimer, fee structure note, secure-handling note, legal links.
 *
 * Usage:
 *   import SfcTrustBar from '@/components/supersonic/SfcTrustBar';
 *   <SfcTrustBar />
 */

import Link from 'next/link';
import { ShieldCheck, Lock, FileText } from 'lucide-react';

interface SfcTrustBarProps {
  /** Show the "No upfront fee" line (default true) */
  showNoUpfrontFee?: boolean;
  /** Show the "Estimates are not guarantees" line (default true) */
  showEstimateDisclaimer?: boolean;
  className?: string;
}

export default function SfcTrustBar({
  showNoUpfrontFee = true,
  showEstimateDisclaimer = true,
  className = '',
}: SfcTrustBarProps) {
  return (
    <section
      className={`bg-slate-50 border-t border-slate-200 py-8 ${className}`}
      aria-label="Trust and compliance information"
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Icon badges row */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <ShieldCheck className="w-5 h-5 text-brand-green-600 flex-shrink-0" aria-hidden="true" />
            <span>PTIN-certified preparers</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Lock className="w-5 h-5 text-brand-green-600 flex-shrink-0" aria-hidden="true" />
            <span>256-bit encrypted document storage</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <FileText className="w-5 h-5 text-brand-green-600 flex-shrink-0" aria-hidden="true" />
            <span>IRS Authorized e-File Provider</span>
          </div>
        </div>

        {/* Disclaimer text */}
        <div className="text-center space-y-1.5 text-xs text-slate-500 max-w-3xl mx-auto">
          {showEstimateDisclaimer && (
            <p>
              Refund estimates are not guarantees. Actual refund amounts depend on IRS
              validation of your complete tax information.
            </p>
          )}
          <p>
            Final refund depends on IRS acceptance and processing. Refund advance is
            not a loan — it is an advance on your actual refund with zero interest and
            zero fees when you file with Supersonic Fast Cash.
          </p>
          {showNoUpfrontFee && (
            <p>
              No upfront fees required to start your return. Preparation fees are
              deducted from your refund or due at time of filing.
            </p>
          )}
          <p>
            Your documents are handled securely and are never shared with third parties
            without your explicit consent.
          </p>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {[
            { label: 'Terms of Service',  href: '/supersonic-fast-cash/legal/terms' },
            { label: 'Privacy Policy',    href: '/supersonic-fast-cash/legal/privacy' },
            { label: 'Consent',           href: '/supersonic-fast-cash/consent' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-brand-red-600 hover:underline"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
