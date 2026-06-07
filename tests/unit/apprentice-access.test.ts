import { describe, it, expect } from 'vitest';
import {
  allowedRolesForPortalPath,
  canAccessApprenticeTools,
  isApprenticeFieldPortalPath,
} from '@/lib/portal/apprentice-access';

describe('apprentice portal access', () => {
  it('treats barber portal as apprenticeship field portal', () => {
    expect(isApprenticeFieldPortalPath('/portal/barber')).toBe(true);
    expect(isApprenticeFieldPortalPath('/portal/healthcare')).toBe(false);
  });

  it('allows program_holder on barber portal', () => {
    expect(allowedRolesForPortalPath('/portal/barber')).toContain('program_holder');
  });

  it('does not allow program_holder on healthcare portal', () => {
    expect(allowedRolesForPortalPath('/portal/healthcare')).not.toContain('program_holder');
  });

  it('allows program_holder on apprentice tools', () => {
    expect(canAccessApprenticeTools('program_holder')).toBe(true);
    expect(canAccessApprenticeTools('employer')).toBe(false);
  });
});
