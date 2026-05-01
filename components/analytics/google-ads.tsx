'use client';

import Script from 'next/script';

/**
 * Sit Selfish Inc — Google tag IDs
 *   AW-16712632425  Google Ads conversion account
 *   GT-5N5RZZTD     Google Tag Manager container
 *
 * Both tags are loaded on every page. Conversion events are fired via
 * trackAdsConversion() on success/thank-you pages.
 */

export const GOOGLE_ADS_ID = 'AW-16712632425';
export const GOOGLE_TAG_ID = 'GT-5N5RZZTD';

// Conversion action labels — update labels after creating actions in Google Ads:
//   Goals → Conversions → New conversion action → Website
export const CONVERSION_ACTIONS = {
  ENROLL: `${GOOGLE_ADS_ID}/enroll_application`,
  DONATE: `${GOOGLE_ADS_ID}/donate_complete`,
  CONTACT: `${GOOGLE_ADS_ID}/contact_form`,
} as const;

export function GoogleAds() {
  return (
    <>
      {/* Google Tag Manager container */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="lazyOnload"
      />
      {/* Google Ads conversion tag */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-ads-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
          gtag('config', '${GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });
        `}
      </Script>
    </>
  );
}

/**
 * Fire a Google Ads conversion event.
 * Call this on the thank-you / success page after the action completes.
 *
 * @param action  - one of CONVERSION_ACTIONS
 * @param value   - dollar value of the conversion (optional)
 * @param currency - defaults to USD
 */
export function trackAdsConversion(
  action: string,
  value?: number,
  currency: string = 'USD',
) {
  if (typeof window === 'undefined') return;
  const gtag = (window as any).gtag;
  if (typeof gtag !== 'function') return;

  gtag('event', 'conversion', {
    send_to: action,
    ...(value !== undefined && { value, currency }),
  });
}
