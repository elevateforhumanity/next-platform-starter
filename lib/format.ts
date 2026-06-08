/**
 * Shared formatting helpers.
 *
 * Import from '@/lib/format' everywhere instead of defining local
 * formatCurrency / formatDate / formatPhone per-file.
 */

// ── Currency ────────────────────────────────────────────────────────────────

/**
 * Format a dollar amount with Intl.NumberFormat.
 *
 * @param amount  Dollar value (e.g. 4980)
 * @param opts.cents If true, `amount` is in cents and will be divided by 100
 * @param opts.minimumFractionDigits Defaults to 0
 * @param opts.maximumFractionDigits Defaults to 0
 */
export function formatCurrency(
  amount: number,
  opts: {
    cents?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {},
): string {
  const {
    cents = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = opts;
  const value = cents ? amount / 100 : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Compact currency for dashboards — e.g. $1.2M, $350K, $500.
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

// ── Dates ───────────────────────────────────────────────────────────────────

type DateInput = string | Date;

function toDate(input: DateInput): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

/**
 * Short date — "Jun 8, 2026"
 */
export function formatDate(input: DateInput): string {
  const d = toDate(input);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Date with time — "Jun 8, 2026, 02:30 PM"
 */
export function formatDateTime(input: DateInput): string {
  const d = toDate(input);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Short weekday date — "Mon, Jun 8"
 */
export function formatDateShort(input: DateInput): string {
  const d = toDate(input);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Relative date — "Today", "Tomorrow", "3 days", or falls back to short date.
 */
export function formatDateRelative(input: DateInput): string {
  const d = toDate(input);
  if (isNaN(d.getTime())) return 'N/A';
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days <= 7) return `${days} days`;
  return formatDate(d);
}

// ── Phone ───────────────────────────────────────────────────────────────────

/**
 * Format a US phone number — "(317) 555-0123"
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ── Hours ───────────────────────────────────────────────────────────────────

/**
 * Locale-formatted hours — "2,000"
 */
export function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US').format(hours);
}
