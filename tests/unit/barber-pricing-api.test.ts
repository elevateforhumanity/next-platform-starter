import { describe, it, expect } from 'vitest';
import {
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_CENTS,
} from '@/lib/barber/pricing';

describe('barber pricing authority', () => {
  it('uses $4,980 tuition, $600 min down, 29 weekly payments', () => {
    expect(TUITION_CENTS).toBe(498000);
    expect(MIN_SETUP_FEE_CENTS).toBe(60000);
    expect(PAYMENT_TERM_WEEKS).toBe(29);
    const weekly = Math.ceil((TUITION_CENTS - MIN_SETUP_FEE_CENTS) / PAYMENT_TERM_WEEKS);
    expect(weekly).toBe(15104); // ~$151/wk after $600 down
  });
});
