'use client';

/**
 * BnplCheckoutWidget
 *
 * Standalone BNPL payment UI driven entirely by bnpl-config.ts.
 * No provider names are hardcoded here — add/remove providers in bnpl-config only.
 *
 * Stripe-native providers (klarna, afterpay, zip, cashapp, amazon_pay, us_bank_account)
 * open an EmbeddedCheckout inline. Separate-SDK providers (affirm, sezzle) redirect
 * to their own checkout URLs via the respective API routes.
 *
 * Usage:
 *   <BnplCheckoutWidget
 *     amountCents={498000}
 *     checkoutEndpoint="/api/barber/checkout/embedded"
 *     customerEmail="..."
 *     customerName="..."
 *     onSuccess={(sessionId) => router.push('/success')}
 *   />
 */

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, ChevronRight, X } from 'lucide-react';
import {
  ACTIVE_BNPL_PROVIDERS,
  getProvidersForAmount,
  type BnplProvider,
} from '@/lib/bnpl-config';

// Stripe-native provider IDs — derived from bnpl-config (stripeMethodId !== null)
const STRIPE_NATIVE_IDS = new Set(
  ACTIVE_BNPL_PROVIDERS.filter((p) => p.stripeMethodId !== null).map((p) => p.id),
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BnplCheckoutWidgetProps {
  /** Amount in cents */
  amountCents: number;
  /** API route that returns { clientSecret } for Stripe EmbeddedCheckout */
  checkoutEndpoint: string;
  /** Extra body fields forwarded to checkoutEndpoint */
  checkoutPayload?: Record<string, unknown>;
  /** Called when Stripe EmbeddedCheckout completes (receives session_id) */
  onSuccess?: (sessionId: string) => void;
  /** Called when user cancels / closes the embedded checkout */
  onCancel?: () => void;
  /** Show only providers valid for amountCents (default: true) */
  filterByAmount?: boolean;
}

// ── Provider card ─────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  selected,
  onClick,
}: {
  provider: BnplProvider;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-brand-blue-500 bg-brand-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Provider badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${provider.badgeBg} ${provider.badgeText}`}
        >
          {provider.name}
        </span>
        <span className="text-slate-600 text-sm">{provider.description}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {provider.maxAmount > 0 && (
          <span className="text-xs text-slate-400 hidden sm:block">
            up to ${provider.maxAmount.toLocaleString()}
          </span>
        )}
        <ChevronRight
          className={`w-4 h-4 transition-colors ${selected ? 'text-brand-blue-500' : 'text-slate-400'}`}
        />
      </div>
    </button>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function BnplCheckoutWidget({
  amountCents,
  checkoutEndpoint,
  checkoutPayload = {},
  onSuccess,
  onCancel,
  filterByAmount = true,
}: BnplCheckoutWidgetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = filterByAmount
    ? getProvidersForAmount(amountCents / 100)
    : ACTIVE_BNPL_PROVIDERS;

  const selectedProvider = providers.find((p) => p.id === selectedId) ?? null;
  const isStripeNative = selectedId ? STRIPE_NATIVE_IDS.has(selectedId) : false;

  const handleContinue = useCallback(async () => {
    if (!selectedId || !selectedProvider) return;
    setLoading(true);
    setError(null);

    try {
      if (isStripeNative) {
        // Open Stripe EmbeddedCheckout inline
        const res = await fetch(checkoutEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...checkoutPayload,
            bnpl_provider: selectedId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.clientSecret) {
          setError(data.error ?? 'Unable to start checkout. Please try another option.');
          return;
        }
        setClientSecret(data.clientSecret);
      } else {
        // Separate SDK flow — redirect to provider checkout URL
        const sdkRoute =
          selectedId === 'affirm'
            ? '/api/affirm/checkout'
            : selectedId === 'sezzle'
              ? '/api/sezzle/checkout'
              : null;

        if (!sdkRoute) {
          setError('This provider is not yet available. Please choose another option.');
          return;
        }

        const res = await fetch(sdkRoute, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...checkoutPayload,
            amount_cents: amountCents,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.checkoutUrl) {
          setError(
            data.error ?? `${selectedProvider.name} is temporarily unavailable. Please try another option.`,
          );
          return;
        }
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedId, selectedProvider, isStripeNative, checkoutEndpoint, checkoutPayload, amountCents]);

  const handleClose = useCallback(() => {
    setClientSecret(null);
    setSelectedId(null);
    onCancel?.();
  }, [onCancel]);

  // ── Embedded checkout open ────────────────────────────────────────────────
  if (clientSecret) {
    return (
      <div className="rounded-2xl border-2 border-brand-blue-200 overflow-hidden">
        {/* Header */}
        <div className="bg-brand-blue-50 px-5 py-3 flex items-center justify-between border-b border-brand-blue-200">
          <div className="flex items-center gap-2">
            {selectedProvider && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedProvider.badgeBg} ${selectedProvider.badgeText}`}
              >
                {selectedProvider.name}
              </span>
            )}
            <p className="text-sm font-semibold text-slate-800">Secure Checkout</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stripe EmbeddedCheckout */}
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  // ── Provider selection ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {providers.length === 0 ? (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            No BNPL providers are available for this amount. Please choose a different payment
            method.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Select a provider — you will complete checkout on the next screen.
          </p>

          <div className="space-y-2">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                selected={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            disabled={!selectedId || loading}
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening checkout…
              </>
            ) : (
              <>
                Continue with {selectedProvider?.name ?? 'selected provider'}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Payment options subject to provider eligibility. Terms vary by provider.
          </p>
        </>
      )}
    </div>
  );
}
