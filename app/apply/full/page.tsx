'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  User,
  GraduationCap,
  Briefcase,
  FileText,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const steps = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Education', icon: GraduationCap },
  { id: 3, name: 'Experience', icon: Briefcase },
  { id: 4, name: 'Documents', icon: FileText },
  { id: 5, name: 'Review', icon: CheckCircle },
];

export default function FullApplicationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    highSchool: '',
    graduationYear: '',
    gpa: '',
    college: '',
    major: '',
    employed: '',
    employer: '',
    jobTitle: '',
    yearsExperience: '',
    resume: null as File | null,
    transcript: null as File | null,
  });

  const updateField = (field: string, value: string | File | null) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit() {
    if (!agreed) {
      setError('Please certify that your information is accurate.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dob || null,
        address: formData.address || null,
        program: 'general',
        source: 'apply-full',
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Submission failed');
      router.push('/apply/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Link href="/" className="hover:text-orange-600">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/apply" className="hover:text-orange-600">
            Apply
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">Full Application</span>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Program Application</h1>
        <p className="text-slate-600 mb-8">Complete all steps to submit your application</p>

        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-slate-500'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:block ${currentStep === step.id ? 'font-medium text-slate-900' : 'text-slate-500'}`}
              >
                {step.name}
              </span>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    ['First Name *', 'firstName', 'text'],
                    ['Last Name *', 'lastName', 'text'],
                    ['Email *', 'email', 'email'],
                    ['Phone *', 'phone', 'tel'],
                    ['Date of Birth *', 'dob', 'date'],
                    ['Address', 'address', 'text'],
                  ] as [string, string, string][]
                ).map(([label, field, type]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(formData as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Education Background</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    ['High School *', 'highSchool', 'text'],
                    ['Graduation Year *', 'graduationYear', 'text'],
                    ['GPA', 'gpa', 'text'],
                    ['College/University', 'college', 'text'],
                  ] as [string, string, string][]
                ).map(([label, field, type]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(formData as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Major/Field of Study
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => updateField('major', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Currently employed?
                  </label>
                  <select
                    value={formData.employed}
                    onChange={(e) => updateField('employed', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select…</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {(
                  [
                    ['Current/Most Recent Employer', 'employer', 'text'],
                    ['Job Title', 'jobTitle', 'text'],
                  ] as [string, string, string][]
                ).map(([label, field, type]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(formData as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Years of Experience
                  </label>
                  <select
                    value={formData.yearsExperience}
                    onChange={(e) => updateField('yearsExperience', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select…</option>
                    <option value="0-1">0–1 years</option>
                    <option value="1-3">1–3 years</option>
                    <option value="3-5">3–5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
              {(
                [
                  ['Resume/CV', 'resume', '.pdf,.doc,.docx', 'PDF, DOC, or DOCX (max 5MB)'],
                  ['Transcript (Optional)', 'transcript', '.pdf', 'PDF only (max 5MB)'],
                ] as [string, string, string, string][]
              ).map(([label, field, accept, hint]) => (
                <div key={field} className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-slate-500 mb-2">{hint}</p>
                  <input
                    type="file"
                    accept={accept}
                    onChange={(e) => updateField(field, e.target.files?.[0] ?? null)}
                    className="text-sm"
                  />
                  {(formData as any)[field] && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {((formData as any)[field] as File).name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Review Your Application</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-1">Personal Information</h3>
                  <p className="text-sm text-slate-600">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formData.email} · {formData.phone}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-1">Education</h3>
                  <p className="text-sm text-slate-600">
                    {formData.highSchool} ({formData.graduationYear})
                  </p>
                  {formData.college && (
                    <p className="text-sm text-slate-600">
                      {formData.college} — {formData.major}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-1">Experience</h3>
                  <p className="text-sm text-slate-600">
                    {formData.employer || 'Not provided'} — {formData.jobTitle || 'N/A'}
                  </p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-sm text-slate-700">
                    I certify that all information provided is accurate and complete. I understand
                    that providing false information may result in disqualification.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
