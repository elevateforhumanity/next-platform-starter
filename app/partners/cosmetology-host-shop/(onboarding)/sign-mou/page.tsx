'use client';
import { logger } from '@/lib/logger';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Eraser, Loader2, AlertCircle } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getHostShopMouSections } from '@/lib/partners/host-shop-mou-sections';

const MOU_SECTIONS = getHostShopMouSections('cosmetology');

export default function CosmetologySignMOUPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureDataRef = useRef<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [salonName, setSalonName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Owner / Licensed Cosmetologist');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [compensationModel, setCompensationModel] = useState('hourly');
  const [compensationRate, setCompensationRate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [handbookRead, setHandbookRead] = useState(false);

  useEffect(() => {
    fetch('/api/partners/cosmetology-host-shop/my-application')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.salon_legal_name || data.salon_name || data.name || data.shop_name) {
          setSalonName(data.salon_legal_name || data.salon_name || data.name || data.shop_name);
        }
        if (data.owner_name) setSignerName(data.owner_name);
        else if (data.contact_name) setSignerName(data.contact_name);
        if (data.supervisor_name) setSupervisorName(data.supervisor_name);
        if (data.supervisor_license_number) setSupervisorLicense(data.supervisor_license_number);
        if (data.compensation_model) setCompensationModel(data.compensation_model);
      })
      .catch((err) => logger.warn('[sign-mou] prefill fetch failed', err));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const initCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
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
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsDrawing(true);
    },
    [getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, getPos],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!salonName.trim()) {
      setError('Please enter your salon name.');
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
    if (!handbookRead) {
      setError('You must confirm you have read the Partner Handbook.');
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = signatureDataRef.current || canvasRef.current?.toDataURL('image/png');
      const res = await fetch('/api/partners/cosmetology-host-shop/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: salonName,
          signer_name: signerName,
          signer_title: signerTitle,
          supervisor_name: supervisorName,
          supervisor_license: supervisorLicense,
          compensation_model: compensationModel,
          compensation_rate: compensationRate,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          mou_version: '2025-cosmetology-01',
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to submit MOU');
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
          <p className="text-slate-600 mb-6">
            Your Memorandum of Understanding has been submitted. Our team will countersign and send
            you a fully executed copy within 2 business days.
          </p>
          <div className="space-y-3">
            <Link
              href="/partners/cosmetology-host-shop/handbook"
              className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Continue to Partner Handbook
            </Link>
            <Link
              href="/partners/cosmetology-host-shop"
              className="block w-full px-6 py-3 text-slate-900 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
            >
              Back to Partner Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Partners', href: '/partners/cosmetology-host-shop' },
            { label: 'Onboarding', href: '/partners/cosmetology-host-shop' },
            { label: 'Sign MOU' },
          ]}
        />
      </div>

      <div className="bg-white border-b border-slate-200 mt-4">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <InstitutionalHeader
            documentType="Memorandum of Understanding"
            title="Indiana Cosmetology Apprenticeship — Worksite Partner Agreement"
            subtitle="USDOL Registered Apprenticeship · RAPIDS Program ID: 2025-IN-132302"
            noDivider
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* MOU Text */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl mb-8">
          <div className="p-6 space-y-6">
            {MOU_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Salon & Signer Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Salon & Signer Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Salon Legal Name *</label>
                <input
                  required
                  className={inputCls}
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="Legal business name"
                />
              </div>
              <div>
                <label className={labelCls}>Signer Full Legal Name *</label>
                <input
                  required
                  className={inputCls}
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Signer Title *</label>
                <input
                  required
                  className={inputCls}
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Supervising Cosmetologist */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Supervising Cosmetologist</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Supervisor Full Name *</label>
                <input
                  required
                  className={inputCls}
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Indiana Cosmetology License # *</label>
                <input
                  required
                  className={inputCls}
                  value={supervisorLicense}
                  onChange={(e) => setSupervisorLicense(e.target.value)}
                  placeholder="IPLA license number"
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Apprentice Compensation</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Compensation Model *</label>
                <select
                  required
                  className={inputCls}
                  value={compensationModel}
                  onChange={(e) => setCompensationModel(e.target.value)}
                >
                  <option value="hourly">Hourly Wage</option>
                  <option value="hybrid">Hybrid (Hourly Base + Commission)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Starting Rate *</label>
                <input
                  required
                  className={inputCls}
                  value={compensationRate}
                  onChange={(e) => setCompensationRate(e.target.value)}
                  placeholder={
                    compensationModel === 'hourly' ? 'e.g. $10.00/hr' : 'e.g. $8.00/hr + 20%'
                  }
                />
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Digital Signature</h2>
            <p className="text-sm text-slate-500">
              Draw your signature in the box below using your mouse or finger.
            </p>
            <div
              className="rounded-lg overflow-hidden bg-white"
              style={{ border: '2px solid #cbd5e1', height: 160 }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={160}
                className="w-full h-full cursor-crosshair touch-none block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <Eraser className="w-4 h-4" /> Clear signature
            </button>
          </div>

          {/* Acknowledgments */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Acknowledgments</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-purple-600"
                checked={handbookRead}
                onChange={(e) => setHandbookRead(e.target.checked)}
              />
              <span className="text-sm text-slate-700">
                I confirm that I have read and understood the{' '}
                <Link
                  href="/partners/cosmetology-host-shop/handbook"
                  target="_blank"
                  className="text-purple-600 hover:underline font-medium"
                >
                  Cosmetology Partner Handbook
                </Link>{' '}
                in full prior to signing this MOU.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-purple-600"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="text-sm text-slate-700">
                I agree to all terms of this Memorandum of Understanding on behalf of the salon
                named above. I understand this is a legally binding agreement governing a USDOL
                Registered Apprenticeship worksite.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !agreedToTerms || !handbookRead}
            className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </>
            ) : (
              'Sign and Submit MOU'
            )}
          </button>

          <p className="text-center text-slate-500 text-xs">
            Questions?{' '}
            <Link href="/contact" className="text-purple-600 hover:underline">
              Contact us
            </Link>{' '}
            or call{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-purple-600 hover:underline">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
