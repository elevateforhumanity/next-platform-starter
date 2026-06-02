import { describe, it, expect } from 'vitest';
import {
  shouldHideMarketingHeader,
  shouldSuppressMarketingChrome,
  isAppRoute,
} from '@/lib/layout/app-routes';

describe('marketing header visibility', () => {
  it('hides global header on /education', () => {
    expect(shouldHideMarketingHeader('/education')).toBe(true);
    expect(shouldHideMarketingHeader('/education/foo')).toBe(true);
  });

  it('does not hide global header on marketing home', () => {
    expect(shouldHideMarketingHeader('/')).toBe(false);
    expect(shouldHideMarketingHeader('/programs')).toBe(false);
  });

  it('suppresses chrome for app routes and custom header routes', () => {
    expect(shouldSuppressMarketingChrome('/lms/dashboard')).toBe(true);
    expect(shouldSuppressMarketingChrome('/education')).toBe(true);
    expect(shouldSuppressMarketingChrome('/')).toBe(false);
  });

  it('app routes still use isAppRoute', () => {
    expect(isAppRoute('/login')).toBe(true);
    expect(isAppRoute('/education')).toBe(false);
  });
});
