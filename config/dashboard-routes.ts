import { UserRole } from '@/types/user';

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  // Admin tier
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  org_admin: '/admin/dashboard',

  // Staff / operations
  staff: 'https://admin.elevateforhumanity.org/admin/staff-portal/dashboard',
  instructor: 'https://admin.elevateforhumanity.org/admin/instructor/dashboard',

  // Program holders / delegates
  program_holder: '/program-holder/dashboard',
  delegate: '/my-dashboard',

  // Partners / sponsors
  partner: '/partner/dashboard',
  sponsor: '/employer/dashboard',

  // Workforce oversight
  workforce_board: '/workforce-board/dashboard',

  // Employer
  employer: '/employer/dashboard',

  // Mentor
  mentor: '/mentor/dashboard',

  // Creator
  creator: '/creator/products',

  // Student
  student: '/learner/dashboard',
};

export function getDashboardUrl(role?: UserRole): string {
  if (!role) return '/unauthorized?reason=unknown_role';
  return DASHBOARD_ROUTES[role] || '/unauthorized?reason=unknown_role';
}
