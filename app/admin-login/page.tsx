'use client';

// Admin login page on the main site.
// Authenticates via the admin subdomain's /api/auth/admin-login endpoint
// (service-role key, bypasses RLS). On success, redirects to the admin subdomain.

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, Lock } from 'lucide-react';

const ADMIN_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org')
    : 'https://admin.elevateforhumanity.org';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST to the admin subdomain's login API — uses service role key to
      // bypass RLS on the profiles table. Returns a session cookie on success.
      const res = await fetch(`${adminUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // carry the session cookie across subdomains
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Check your credentials.');
        return;
      }

      // Hard navigation — commits the session cookie before the admin app reads it
      window.location.href = `${adminUrl}/admin/dashboard`;
    } catch {
      setError('Unable to reach the admin server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="h-[180px] w-full bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
              Elevate for Humanity
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight">Admin Portal</h1>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <p className="text-slate-400 text-sm">
                Restricted access — authorized staff only
              </p>
            </div>

            {error && (
              <div
                className="mb-5 flex items-start gap-3 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent transition"
                  placeholder="admin@elevateforhumanity.org"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-base"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In to Admin Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 text-center">
              <a
                href={`${adminUrl}/login`}
                className="block text-sm text-brand-blue-400 hover:text-brand-blue-300 transition"
              >
                Go directly to admin.elevateforhumanity.org →
              </a>
              <Link
                href="/reset-password"
                className="block text-xs text-slate-500 hover:text-slate-400 transition"
              >
                Forgot password?
              </Link>
              <Link
                href="/"
                className="block text-xs text-slate-600 hover:text-slate-500 transition"
              >
                ← Back to main site
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Not an admin?{' '}
            <Link href="/login" className="text-slate-500 hover:text-slate-400 underline">
              Student / staff login
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
