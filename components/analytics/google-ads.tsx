'use client';

import Script from 'next/script';

/**
 * Google Ads tag for account AW-1084612631.
 * Loads the gtag conversion tracking script.
 * Conversion actions are fired via trackAdsConversion() below.
 *
 * Conversion actions registered in Google Ads:
 *   - ENROLL:  AW-1084612631/enroll   — application submitted (/apply/success)
 *   - DONATE:  AW-1084612631/donate   — donation completed (/donate/thank-you)
 *   - CONTACT: AW-1084612631/contact  — contact form submitted
 *
 * After deploying, register each conversion in Google Ads:
 *   Goals → Conversions → New conversion action → Website → enter your domain
 *   → select "Page load" → enter the thank-you page URL → save
 */

export const GOOGLE_ADS_ID = 'AW-1084612631';

// Conversion action labels — create these in Google Ads Goals → Conversions
// then replace these placeholder labels with the real ones from the tag details
export const CONVERSION_ACTIONS = {
  ENROLL: `${GOOGLE_ADS_ID}/enroll_application`,
  DONATE: `${GOOGLE_ADS_ID}/donate_complete`,
  CONTACT: `${GOOGLE_ADS_ID}/contact_form`,
} as const;

export function GoogleAds() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-ads-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
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
