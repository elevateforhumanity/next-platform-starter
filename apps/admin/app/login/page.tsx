import AdminLoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — Elevate Admin',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  return <AdminLoginForm redirectTo={params.redirect} />;
}
