'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Shield } from 'lucide-react';

const PROGRAM = {
  name: 'Medical Assistant (CCMA)',
  slug: 'medical-assistant',
  price: 5000,
  downPayment: 1000,
  weeklyPayment: 200,
  paymentWeeks: 20,
};

export default function MedicalAssistantEnrollPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentOption, setPaymentOption] = useState('payment-plan');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/enroll/cna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          programSlug: PROGRAM.slug,
          programName: PROGRAM.name,
          paymentOption,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!data.enrollmentId || !uuidPattern.test(data.enrollmentId)) {
        throw new Error('Enrollment could not be confirmed. Please call (317) 314-3757.');
      }

      if (paymentOption === 'affirm') {
        const affirmRes = await fetch('/api/affirm/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: PROGRAM.price * 100,
            programId: PROGRAM.slug,
            programSlug: PROGRAM.slug,
            programName: PROGRAM.name,
            enrollmentId: data.enrollmentId,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });
        const affirm = await affirmRes.json();
        if (affirm.url) { window.location.href = affirm.url; return; }
      } else if (paymentOption === 'sezzle') {
        const sezzleRes = await fetch('/api/sezzle/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: PROGRAM.price * 100,
            programId: PROGRAM.slug,
            programSlug: PROGRAM.slug,
            programName: PROGRAM.name,
            enrollmentId: data.enrollmentId,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
          }),
        });
        const sezzle = await sezzleRes.json();
        if (sezzle.url || sezzle.checkout_url) { window.location.href = sezzle.url || sezzle.checkout_url; return; }
      }

      if (paymentOption === 'payment-plan') {
        window.location.href = `/lms/payments/checkout?program=medical-assistant&amount=${PROGRAM.downPayment}&type=down-payment&enrollment=${data.enrollmentId}`;
      } else {
        window.location.href = `/lms/payments/checkout?program=medical-assistant&amount=${PROGRAM.price}&type=full-payment&enrollment=${data.enrollmentId}`;
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Call (317) 314-3757.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/programs/medical-assistant" className="inline-flex items-center gap-2 text-white hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Medical Assistant Program
          </Link>
          <h1 className="text-3xl font-bold text-white">{PROGRAM.name}</h1>
          <p className="text-slate-300 mt-2">Enroll in the CCMA certification program</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Your Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!formData.firstName || !formData.email} className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50">
              Continue to Payment Options
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Payment Options</h2>
            <p className="text-slate-600 text-sm">Total tuition: <span className="font-bold text-slate-900">${PROGRAM.price.toLocaleString()}</span> · WIOA funding may cover 100%</p>

            <div className="space-y-3">
              {/* Payment Plan */}
              <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'payment-plan' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="po" value="payment-plan" checked={paymentOption === 'payment-plan'} onChange={() => setPaymentOption('payment-plan')} className="sr-only" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Payment Plan</span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Most Popular</span>
                    </div>
                    <p className="text-slate-700 mt-1"><span className="text-xl font-bold">${PROGRAM.downPayment.toLocaleString()}</span> down + <span className="font-semibold">${PROGRAM.weeklyPayment}/wk</span> × {PROGRAM.paymentWeeks} weeks</p>
                  </div>
                  {paymentOption === 'payment-plan' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                </div>
              </label>

              {/* Pay in Full */}
              <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'full-payment' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="po" value="full-payment" checked={paymentOption === 'full-payment'} onChange={() => setPaymentOption('full-payment')} className="sr-only" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">Pay in Full</span>
                    <p className="text-slate-700 mt-1"><span className="text-xl font-bold">${PROGRAM.price.toLocaleString()}</span> one-time payment</p>
                  </div>
                  {paymentOption === 'full-payment' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                </div>
              </label>

              {/* Affirm */}
              <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'affirm' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="po" value="affirm" checked={paymentOption === 'affirm'} onChange={() => setPaymentOption('affirm')} className="sr-only" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Affirm</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">BNPL</span>
                    </div>
                    <p className="text-slate-700 mt-1">As low as <span className="font-semibold">${Math.round(PROGRAM.price / 12)}/mo</span> for 12 months</p>
                    <p className="text-xs text-slate-500">0% APR available · Instant decision</p>
                  </div>
                  {paymentOption === 'affirm' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                </div>
              </label>

              {/* Sezzle */}
              <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'sezzle' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="po" value="sezzle" checked={paymentOption === 'sezzle'} onChange={() => setPaymentOption('sezzle')} className="sr-only" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Sezzle</span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">BNPL</span>
                    </div>
                    <p className="text-slate-700 mt-1">4 interest-free payments of <span className="font-semibold">${(PROGRAM.price / 4).toFixed(2)}</span></p>
                    <p className="text-xs text-slate-500">Every 2 weeks · No credit impact</p>
                  </div>
                  {paymentOption === 'sezzle' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
              <Shield className="w-4 h-4" />
              <span>All payments are secure and encrypted. WIOA/WRG funding may cover 100% of tuition.</span>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50">Back</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50">
                {isSubmitting ? 'Processing...' : paymentOption === 'affirm' ? 'Continue with Affirm' : paymentOption === 'sezzle' ? 'Continue with Sezzle' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
