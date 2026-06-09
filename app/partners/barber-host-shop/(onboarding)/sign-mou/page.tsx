'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, Eraser, Download, Send,
  Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getHostShopMouSections } from '@/lib/partners/host-shop-mou-sections';

const MOU_SECTIONS = getHostShopMouSections('barber');

export default function SignMOUPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureDataRef = useRef<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form fields — pre-populated from partner application on mount
  const [shopName, setShopName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Owner / Barber on Duty');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [compensationModel, setCompensationModel] = useState('hourly');
  const [compensationRate, setCompensationRate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [handbookRead, setHandbookRead] = useState(false);

  // Pre-populate from logged-in user's partner application
  useEffect(() => {
    fetch('/api/partners/barber-host-shop/my-application')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.shop_name) setShopName(data.shop_name);
        if (data.owner_name) setSignerName(data.owner_name);
        else if (data.contact_name) setSignerName(data.contact_name);
        if (data.supervisor_name) setSupervisorName(data.supervisor_name);
        if (data.supervisor_license_number) setSupervisorLicense(data.supervisor_license_number);
      })
      .catch((err) => console.warn('[sign-mou] prefill fetch failed', err));
  }, []);

  // Canvas setup — use ResizeObserver so canvas is sized after layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return; // not laid out yet

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Baseline
      ctx.beginPath();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.moveTo(20, rect.height - 30);
      ctx.lineTo(rect.width - 20, rect.height - 30);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px system-ui';
      ctx.fillText('Sign above this line', rect.width / 2 - 60, rect.height - 12);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
    };

    const ro = new ResizeObserver(() => initCanvas());
    ro.observe(canvas);
    initCanvas();
    return () => ro.disconnect();
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    // Capture signature immediately after stroke ends
    if (canvasRef.current) {
      signatureDataRef.current = canvasRef.current.toDataURL('image/png');
      setHasSigned(true);
    }
  }, []);

  const clearSignature = () => {
    signatureDataRef.current = '';
    setHasSigned(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw signature line
    ctx.beginPath();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.fillText('Sign above this line', rect.width / 2 - 50, rect.height - 12);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;

    setHasSigned(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shopName.trim()) {
      setError('Please enter your barbershop name.');
      return;
    }
    if (!signerName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!hasSigned) {
      setError('Please provide your signature above.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the terms of the MOU.');
      return;
    }

    setSubmitting(true);

    try {
      // Use the captured signature (saved on stroke end, not at submit time)
      const signatureData = signatureDataRef.current || canvasRef.current?.toDataURL('image/png');

      const payload = {
        shop_name: shopName,
        signer_name: signerName,
        signer_title: signerTitle,
        supervisor_name: supervisorName,
        supervisor_license: supervisorLicense,
        compensation_model: compensationModel,
        compensation_rate: compensationRate,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        mou_version: '2025-01',
      };

      const res = await fetch('/api/partners/barber-host-shop/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit MOU');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <span className="w-16 h-16 rounded-full bg-brand-green-500 inline-block flex-shrink-0 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">MOU Signed Successfully</h1>
          <p className="text-black mb-6">
            Your Memorandum of Understanding has been submitted. Our team will countersign
            and send you a fully executed copy within 2 business days.
          </p>
          <div className="space-y-3">
            <Link
              href="/partners/barber-host-shop/forms"
              className="block w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              Continue to Required Forms
            </Link>
            <Link
              href="/partners/barber-host-shop/handbook"
              className="block w-full px-6 py-3 text-slate-900 border border-slate-300 rounded-lg font-semibold hover:bg-white"
            >
              Read Partner Handbook
            </Link>
            <Link
              href="/partners/barber-host-shop"
              className="block w-full px-6 py-3 text-slate-900 border border-slate-300 rounded-lg font-semibold hover:bg-white"
            >
              Back to Partner Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/barber-host-shop' },
          { label: 'Sign MOU' },
        ]} />
      </div>

      {/* Institutional Document Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link href="/partners/barber-host-shop" className="inline-flex items-center gap-1 text-black hover:text-brand-blue-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Partner Page
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">

        {/* Handbook prerequisite */}
        <div className={`rounded-xl border-2 p-5 mb-8 ${handbookRead ? 'border-brand-green-400 bg-brand-green-50' : 'border-amber-400 bg-amber-50'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${handbookRead ? 'bg-brand-green-100' : 'bg-amber-100'}`}>
              {handbookRead
                ? <span className="w-6 h-6 rounded-full bg-brand-green-600 inline-block flex-shrink-0" aria-hidden="true" />
                : <AlertCircle className="w-6 h-6 text-amber-600" />
              }
            </div>
            <div className="flex-1">
              <p className={`font-bold text-base mb-1 ${handbookRead ? 'text-brand-green-900' : 'text-amber-900'}`}>
                {handbookRead ? 'Handbook reviewed — you may proceed' : 'Step 1: Read the Partner Handbook before signing'}
              </p>
              <p className={`text-sm mb-3 ${handbookRead ? 'text-brand-green-800' : 'text-amber-800'}`}>
                The Partner Handbook explains your responsibilities as a worksite employer, compensation requirements, hour tracking, and prohibited practices. You must review it before signing this MOU.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href="/partners/barber-host-shop/handbook"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-400 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-50"
                >
                  <FileText className="w-4 h-4" />
                  Open Partner Handbook
                </Link>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handbookRead}
                    onChange={(e) => setHandbookRead(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-brand-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-slate-900">I have read and understood the Partner Handbook</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* MOU Content */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b rounded-t-xl">
            <InstitutionalHeader
              documentType="Memorandum of Understanding"
              title="Indiana Barber Host Shop Program"
              subtitle="Worksite Partner Agreement"
              noDivider
            />
            <div className="text-sm text-black border-t border-slate-200 pt-4 mt-2">
              <p><strong>Between:</strong> 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute (&ldquo;Sponsor&rdquo;)</p>
              <p><strong>And:</strong> Your barbershop (&ldquo;Shop&rdquo;)</p>
            </div>
          </div>
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            {MOU_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-slate-900 mb-1">{section.title}</h3>
                <p className="text-sm text-black leading-relaxed">{section.content}</p>
              </div>
            ))}
            <div className="pt-4 border-t">
              <Link
                href="/docs/Indiana-Barbershop-Apprenticeship-MOU"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                <Download className="w-4 h-4" /> View Full MOU Document
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Partner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Your Barbershop Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Your Title *</label>
              <input
                type="text"
                required
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Owner, Manager, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Supervising Barber Name *</label>
              <input
                type="text"
                required
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Licensed barber who will supervise"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Supervisor Indiana License # *</label>
              <input
                type="text"
                required
                value={supervisorLicense}
                onChange={(e) => setSupervisorLicense(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Indiana barber license number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Compensation Model *</label>
              <select
                required
                value={compensationModel}
                onChange={(e) => setCompensationModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="">Select model</option>
                <option value="hourly">Hourly Wage ($10.00–$15.00/hr recommended)</option>
                <option value="hybrid">Hybrid ($8–$10/hr base + 15%–25% commission)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-900 mb-1">Agreed Rate *</label>
              <input
                type="text"
                required
                value={compensationRate}
                onChange={(e) => setCompensationRate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder={
                  compensationModel === 'hourly' ? '$12.00/hour' :
                  compensationModel === 'commission' ? '40% of all services performed' :
                  compensationModel === 'hybrid' ? '$9.00/hour + 20% commission' :
                  'Select a compensation model first'
                }
              />
              <p className="text-xs text-black mt-1">
                Indiana minimum wage: $7.25/hr. Commission models must average at least minimum wage per pay period. Apprentices keep 100% of tips.
              </p>
            </div>
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Signatures</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Elevate — pre-signed */}
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-bold text-black uppercase tracking-wide mb-3">Sponsor — Already Signed</p>
              <div className="border-b border-slate-400 pb-2 mb-3">
                <span style={{fontFamily:'Georgia,serif',fontSize:'24px',color:'#1a1a2e',fontStyle:'italic'}}>Elizabeth Greene</span>
              </div>
              <p className="text-xs text-black"><strong>Name:</strong> Elizabeth Greene</p>
              <p className="text-xs text-black"><strong>Title:</strong> Founder &amp; CEO</p>
              <p className="text-xs text-black"><strong>Organization:</strong> 2Exclusive LLC-S DBA ${PLATFORM_DEFAULTS.orgLegalName}</p>
              <p className="text-xs text-black"><strong>Date:</strong> {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
              <div className="mt-3 bg-brand-green-50 border border-brand-green-200 rounded px-3 py-1.5 text-xs text-brand-green-700 font-semibold text-center">✓ Signed by ${PLATFORM_DEFAULTS.orgName}</div>
            </div>
            {/* Employer — needs to sign */}
            <div className="border-2 border-dashed border-red-300 rounded-lg p-4 bg-red-50">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Employer Training Site — Your Signature Required</p>
              <div className="border-b border-dashed border-red-400 pb-2 mb-3 min-h-[32px]">
                <span className="text-sm text-red-400 italic">Draw your signature below</span>
              </div>
              <p className="text-xs text-black"><strong>Name:</strong> {signerName || '—'}</p>
              <p className="text-xs text-black"><strong>Title:</strong> Owner</p>
              <p className="text-xs text-black"><strong>Organization:</strong> {shopName || '—'}</p>
              <p className="text-xs text-black"><strong>Date:</strong> {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
              <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded px-3 py-1.5 text-xs text-yellow-700 font-semibold text-center">⚠ Awaiting your signature</div>
            </div>
          </div>
        </div>

        {/* Digital Signature Canvas */}
        <div className={`bg-white rounded-xl shadow-sm border p-6 mb-8 ${!handbookRead ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Draw Your Signature</h2>
            <button
              type="button"
              onClick={clearSignature}
              className="inline-flex items-center gap-1 text-sm text-black hover:text-slate-900"
            >
              <Eraser className="w-4 h-4" /> Clear
            </button>
          </div>
          <p className="text-sm text-black mb-3">
            Draw your signature in the box below using your mouse or finger (on touch devices).
          </p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: '180px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          {hasSigned && (
            <p className="text-sm text-brand-green-600 mt-2 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" /> Signature captured
            </p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-sm text-slate-900">
              I have read and agree to the terms of this Memorandum of Understanding. I confirm that
              I am authorized to sign on behalf of the barbershop named above. I understand that this
              is a legally binding agreement and that my digital signature has the same legal effect
              as a handwritten signature. I acknowledge that I have reviewed the{' '}
              <Link href="/partners/barber-host-shop/handbook" className="text-brand-blue-600 underline">
                Partner Handbook
              </Link>{' '}
              and understand my responsibilities as a worksite partner. *
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={submitting || !handbookRead || !shopName.trim() || !signerName.trim() || !hasSigned || !agreedToTerms}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-bold text-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Sign & Submit MOU
              </>
            )}
          </button>
          <Link
            href="/partners/barber-host-shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-slate-900 border border-slate-300 rounded-lg font-semibold hover:bg-white"
          >
            Cancel
          </Link>
        </div>

        <p className="text-xs text-black mt-4">
          By submitting, you agree that your electronic signature is legally binding under the
          Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.
          A copy of the signed MOU will be emailed to you.
        </p>

        {/* Next Steps */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Next: Partner Handbook</h3>
            <p className="text-sm text-black">After signing the MOU, review the partner handbook.</p>
          </div>
          <Link
            href="/partners/barber-host-shop/handbook"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 text-sm whitespace-nowrap"
          >
            Partner Handbook
          </Link>
        </div>
      </form>
    </div>
  );
}
