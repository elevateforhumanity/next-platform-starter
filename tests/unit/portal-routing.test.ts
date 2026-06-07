import { describe, it, expect } from 'vitest';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { portalPathForProgramSlug } from '@/lib/portal/apprenticeship-portal-paths';

describe('portal routing', () => {
  it('maps beauty apprenticeship slugs to industry portals', () => {
    expect(portalPathForProgramSlug('barber-apprenticeship')).toBe('/portal/barber');
    expect(portalPathForProgramSlug('cosmetology-apprenticeship')).toBe('/portal/cosmetology');
    expect(portalPathForProgramSlug('esthetician-apprenticeship')).toBe('/portal/esthetician');
    expect(portalPathForProgramSlug('nail-technician-apprenticeship')).toBe('/portal/nail-technician');
  });

  it('includes partner_admin and sponsor destinations', () => {
    expect(getRoleDestination('partner_admin')).toBe('/partner/dashboard');
    expect(getRoleDestination('sponsor')).toBe('/employer/dashboard');
    expect(getRoleDestination('program_holder')).toBe('/program-holder/dashboard');
  });
});
