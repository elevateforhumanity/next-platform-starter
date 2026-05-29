/**
 * Staff portal layout — runs inside the admin shell.
 * Auth and nav are already handled by apps/admin/app/admin/layout.tsx.
 * Staff role is included in adminRoles there, so no additional gate needed.
 */
export default function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
