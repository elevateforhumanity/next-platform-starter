'use client';

import React, { useState, useEffect } from 'react';

interface PaymentCalculatorProps {
  totalCost: number;
  depositPercent?: number;
  maxMonths?: number;
  className?: string;
}

interface PaymentBreakdown {
  deposit: number;
  monthlyPayment: number;
  totalMonths: number;
  totalWithInterest: number;
  apr: number;
}

export default function PaymentCalculator({
  totalCost,
  depositPercent = 20,
  maxMonths = 6,
  className = '',
}: PaymentCalculatorProps) {
  const [termMonths, setTermMonths] = useState(maxMonths);
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null);

  useEffect(() => {
    // 0% APR installment plan
    const deposit = Math.round(totalCost * (depositPercent / 100));
    const remaining = totalCost - deposit;
    const monthlyPayment = Math.ceil(remaining / termMonths);

    setBreakdown({
      deposit,
      monthlyPayment,
      totalMonths: termMonths,
      totalWithInterest: totalCost,
      apr: 0,
    });
  }, [totalCost, depositPercent, termMonths]);

  if (!breakdown) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const termOptions = [3, 4, 6, 12].filter((t) => t <= maxMonths);

  return (
    <div className={`bg-slate-50 rounded-xl p-6 border border-slate-200 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Calculator</h3>
      
      {/* Term selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Payment Plan Duration
        </label>
        <div className="flex gap-2 flex-wrap">
          {termOptions.map((term) => (
            <button
              key={term}
              onClick={() => setTermMonths(term)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                termMonths === term
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:border-brand-blue-400'
              }`}
            >
              {term} months
            </button>
          ))}
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="text-slate-600">Total Program Cost</span>
          <span className="font-semibold text-slate-900">{formatCurrency(totalCost)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="text-slate-600">Down Payment ({depositPercent}%)</span>
          <span className="font-medium text-slate-900">{formatCurrency(breakdown.deposit)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="text-slate-600">Monthly Payment</span>
          <span className="font-semibold text-brand-blue-600 text-lg">
            {formatCurrency(breakdown.monthlyPayment)}/mo
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 bg-slate-100 rounded-lg px-3 -mx-3">
          <span className="text-slate-700 font-medium">Total (0% APR)</span>
          <span className="font-bold text-slate-900">{formatCurrency(breakdown.totalWithInterest)}</span>
        </div>
      </div>

      {/* BNPL options */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 mb-3">Also available with BNPL providers:</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
            Klarna
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
            Afterpay
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            Zip
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        * 0% APR financing. First payment due at enrollment. Subject to approval.
      </p>
    </div>
  );
}
