'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, DollarSign, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function StudentBillingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<any>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    setLoading(true);
    try {
      const res = await fetch('/api/student/billing');
      const data = await res.json();
      if (res.ok) {
        setBillingData(data);
      } else {
        setError(data.error || 'Failed to load billing information');
      }
    } catch (err) {
      setError('Failed to connect to billing service');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPaymentMethod() {
    setUpdating(true);
    setError('');
    try {
      const res = await fetch('/api/student/billing/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to setup billing');
      }
    } catch {
      setError('Failed to connect to billing service');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Student Portal', href: '/student-portal' },
            { label: 'Billing' }
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Billing & Payments</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Payment Method Card */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Payment Method</h2>
                  <p className="text-sm text-slate-500">Card on file for tuition payments</p>
                </div>
              </div>
              {billingData?.hasPaymentMethod ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-green-100 text-brand-green-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No Card
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            {billingData?.hasPaymentMethod ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {billingData.cardBrand} ending in {billingData.cardLast4}
                    </p>
                    <p className="text-sm text-slate-500">
                      Expires {billingData.cardExpMonth}/{billingData.cardExpYear}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Card'}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">No payment method on file</p>
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {updating ? 'Loading...' : 'Add Payment Method'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Balance & Payments */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="font-semibold text-slate-900">Account Balance</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">
                  ${(billingData?.balance || 0).toFixed(2)}
                </p>
                <p className="text-sm text-slate-500 mt-1">Current balance</p>
              </div>
              {billingData && billingData.balance > 0 && (
                <Link
                  href="/student-portal/billing/make-payment"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium rounded-lg transition"
                >
                  Make Payment
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="font-semibold text-slate-900">Next Payment</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {billingData?.nextPaymentDate 
                    ? new Date(billingData.nextPaymentDate).toLocaleDateString() 
                    : 'N/A'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {billingData?.nextPaymentAmount 
                    ? `$${billingData.nextPaymentAmount.toFixed(2)}` 
                    : 'No upcoming payment'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Need help with billing?{' '}
            <Link href="/contact" className="text-brand-blue-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
