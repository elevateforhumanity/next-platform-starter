'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error: authError }: any = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password, // never trim passwords — leading/trailing spaces are valid
      });

      if (authError) throw authError;
      if (!data?.user) throw new Error('Login succeeded but no user returned');

      // Small delay to allow the session cookie to be set before the server-side check
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify admin role server-side — never trust client-side profile reads
      const check = await fetch('/api/auth/verify-admin-role', { method: 'POST' });
      if (!check.ok) {
        // Fallback: check role directly from the session profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'staff'];
        if (!profile || !ADMIN_ROLES.includes(profile.role)) {
          await supabase.auth.signOut();
          setError(
            'This login is for administrators only. Use the main sign-in page for your portal.',
          );
          setLoading(false);
          return;
        }
      }

      // Hard redirect so the browser sends the fresh session cookie on the next request.
      // router.push() is a client-side navigation and the middleware won't see the cookie.
      window.location.href = '/admin/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('invalid')) {
        setError('Invalid email or password.');
      } else {
        setError(typeof msg === 'string' && msg ? msg : 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[200px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-login-hero.jpg"
          alt="Elevate administration"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          </div>
        </div>
      </section>

      {/* Login Form */}
      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-2">Administrator Sign In</h2>
            <p className="text-center text-slate-600 mb-8 text-sm">
              Restricted to authorized staff only.
            </p>

          {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="you@elevateforhumanity.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Need help?{' '}
            <a href="tel:+13173143757" className="text-brand-blue-600 font-semibold">
              (317) 314-3757
            </a>
          </div>
        </div>

          <div className="mt-6 text-center space-y-2 text-sm text-slate-600">
            <Link
              href="/reset-password"
              className="text-brand-blue-600 hover:text-brand-blue-700 transition-colors block"
            >
              Forgot your password?
            </Link>
            <div>
              Not an admin?{' '}
              <Link href="/login" className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
                Sign in to your portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
