'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Save, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface SubmittedEntry {
  date: string;
  hours: number;
  activity: string;
  notes: string;
}

export default function LogHoursPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    activity: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedEntry | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  const activities = [
    'Classroom Training',
    'Lab Practice',
    'Online Coursework',
    'Study Time',
    'Assessment / Testing',
    'Clinical Hours',
    'Hands-on Practice',
    'Other',
  ];

  useEffect(() => {
    supabaseRef.current.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login?redirect=/student/hours/log');
        return;
      }
      setUser(user);
      setAuthReady(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.date || !formData.hours || !formData.activity) {
      setError('Please fill in all required fields.');
      return;
    }

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours < 0.5 || hours > 24) {
      setError('Hours must be between 0.5 and 24.');
      return;
    }

    if (!user) {
      router.replace('/login?redirect=/student/hours/log');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/student/log-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          hours,
          services_performed: formData.activity,
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to log hours. Please try again.');
      }

      setSubmitted({ date: formData.date, hours, activity: formData.activity, notes: formData.notes });
    } catch (err: any) {
      setError(err.message || 'Failed to log hours. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      activity: '',
      notes: '',
    });
    setError('');
  };

  // Auth loading
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Clock className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Success screen — shows a summary of what was submitted
  if (submitted) {
    const displayDate = new Date(submitted.date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Hours Submitted</h1>
          <p className="text-slate-600 mb-6">
            Your entry is pending instructor approval.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">{displayDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Hours</span>
              <span className="font-medium text-slate-900">{submitted.hours} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Activity</span>
              <span className="font-medium text-slate-900">{submitted.activity}</span>
            </div>
            {submitted.notes && (
              <div className="flex justify-between text-sm gap-4">
                <span className="text-slate-500 shrink-0">Notes</span>
                <span className="font-medium text-slate-900 text-right">{submitted.notes}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetForm}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              <Plus className="w-4 h-4" />
              Log More Hours
            </button>
            <Link
              href="/student/hours"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Hours Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/learner/dashboard" className="hover:text-blue-600">Student Portal</Link>
            <span className="mx-2">/</span>
            <Link href="/student/hours" className="hover:text-blue-600">Hours</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-medium">Log Hours</span>
          </nav>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/student/hours"
          className="inline-flex items-center text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hours
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Log Training Hours</h1>
              <p className="text-slate-600">Record your completed training time</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="e.g. 4"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">0.5 – 24 hours</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Activity Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select activity type</option>
                {activities.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Describe what you worked on..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-2">Important</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Hours are submitted for instructor approval before counting toward your total</li>
                <li>• Only log hours for completed training activities</li>
                <li>• Falsifying hours may result in program dismissal</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Link
                href="/student/hours"
                className="px-6 py-3 text-slate-700 hover:text-slate-900 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Hours
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
